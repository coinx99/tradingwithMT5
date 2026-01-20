import asyncio
import os
import time
from datetime import datetime, timedelta, timezone
import re
from colorama import Fore
import httpx
from websockets import State, connect
import json
from typing import List, Dict, Union
import json

from app.utils.log import log
from app.utils.timeframe import Timeframe, timeframe_to_ms


class Spot:
    """
    Class kết nối tới Binance WebSocket và lấy dữ liệu Klines.
    """
    url = "wss://ws-api.binance.com:443/ws-api/v3"
    url_http = "https://api.binance.com/api/v3"
    
    def __init__(self, url: str = "wss://ws-api.binance.com:443/ws-api/v3", url_http: str = "https://api.binance.com/api/v3"):
        self.url = url
        self.url_http = url_http
        self.connection = None

    async def connect(self):
        """
        Kết nối WebSocket.
        """
        self.connection = await connect(self.url)
        log.info(f"{Fore.GREEN}Connected to Binance Spot WebSocket")

    async def disconnect(self):
        """
        Ngắt kết nối WebSocket.
        """
        if self.connection:
            await self.connection.close()
            self.connection = None
            log.error(f"{Fore.RED}🚨 Disconnected from Binance Spot WebSocket")
    
    def is_connected(self) -> bool:
            """
            Kiểm tra trạng thái kết nối WebSocket.
            Trả về True nếu kết nối đang mở, ngược lại là False.
            """
            return self.connection is not None and self.connection.state == State.OPEN

    async def send_request(self, payload: dict) -> dict:
        """
        Gửi yêu cầu qua WebSocket và nhận phản hồi.
        """
        if not self.connection:
            raise RuntimeError("WebSocket connection not established")

        # Gửi yêu cầu
        await self.connection.send(json.dumps(payload))

        # Nhận phản hồi
        response = await self.connection.recv()
        return json.loads(response)

    async def get_klines(
        self,
        symbol: str,
        start_time: int,
        end_time: int,
        timeframe: str = "1d"
    ) -> List[Dict[str, Union[str, int]]]:
        """
        Lấy dữ liệu đồ thị nến cho một cặp tiền trong khoảng thời gian.
        Tự động chia nhỏ truy vấn nếu số nến lớn hơn 1000.
        """
        timeframe_ms = timeframe_to_ms(timeframe)
        if timeframe_ms == 0:
            raise ValueError(f"Invalid timeframe: {timeframe}")

        result = []
        limit = 1000
        current_start_time = start_time

        while current_start_time < end_time:
            # Tính toán end_time cho truy vấn này
            current_end_time = min(current_start_time + timeframe_ms * limit, end_time)

            # Tạo payload
            payload = {
                "method": "klines",
                "params": {
                    "symbol": symbol,
                    "interval": timeframe,
                    "startTime": current_start_time,
                    "endTime": current_end_time,
                    "limit": limit,
                },
                "id": 1,
            }

            # Gửi yêu cầu
            response = await self.send_request(payload)

            # Kiểm tra lỗi
            if "error" in response:
                raise RuntimeError(f"Error from Binance: {response['error']}")

            # Lưu kết quả
            klines = response.get("result", [])
            result.extend(klines)

            # Cập nhật current_start_time
            if len(klines) < limit:
                # Nếu nhận được ít hơn `limit` nến, nghĩa là đã hết dữ liệu
                break

            current_start_time = klines[-1][0] + timeframe_ms  # Tiếp tục từ nến cuối cùng

        return result

    async def get_historical_trades(self, symbol: str, from_id: int = None, limit: int = 1000) -> list:
        """
        Lấy Historical Trades qua Binance WebSocket API.
        Docs: https://binance-docs.github.io/websocket-api

        :param symbol: Cặp tiền (VD: "BNBBTC")
        :param from_id: (tùy chọn) Trade ID để bắt đầu
        :param limit: số trades trả về (mặc định 500, tối đa 1000)
        :return: Danh sách trade (JSON)
        """
        if not self.connection:
            raise RuntimeError("WebSocket connection not established")
        payload = {
            "id": int(time.time() * 1000),
            "method": "trades.historical",
            "params": {
                "symbol": symbol,
                "limit": limit,
            } 
        }
        if from_id is not None and from_id >= 0:
            payload["params"]["fromId"] = from_id

        data = await self.send_request(payload)

        if "error" in data:
            raise RuntimeError(f"Error from Binance WS: {data['error']}")

        return data.get("result", [])

    get_trades_in_time_range_time_wait = 0.2 # second
    """
    thời gian chờ giữa các lượt batch truy vấn của get_trades_in_time_range, đơn vị giây
    """
    async def get_trades_in_time_range(self, symbol: str, start_time: int, end_time: int, limit_per_call: int = 1000) -> list:
        """
        Lấy trades trong khoảng thời gian [start_time, end_time] (milliseconds).
        Đi ngược về quá khứ bằng historical trades.
        
        :param symbol: Cặp tiền (VD: "BNBBTC")
        :param start_time: mốc thời gian bắt đầu (ms)
        :param end_time: mốc thời gian kết thúc (ms)
        :param limit_per_call: số trade lấy mỗi lần (mặc định 1000)
        :return: List trades trong khoảng thời gian
        """
        if not self.connection:
            raise RuntimeError("WebSocket connection not established")

        all_trades = []
        retry = 0
        max_retries = 5

        # # 1) Lấy batch mới nhất
        # latest = await self.get_historical_trades(symbol, limit=limit_per_call)
        # if not latest:
        #     return []
        # all_trades.extend(latest)
        # await asyncio.sleep(self.get_trades_in_time_range_time_wait)

        # 2) Lấy từ tradeId nhỏ hơn (lùi dần về quá khứ)
        min_id = None
        while True:
            try:
                batch = await self.get_historical_trades(symbol, from_id=None if min_id == None else max(min_id - limit_per_call, 0), limit=limit_per_call)
                if not batch:
                    break

                all_trades = batch + all_trades  # prepend
                min_id = batch[0]["id"]

                # nếu trade sớm nhất đã trước start_time thì dừng
                if batch[0]["time"] < start_time:
                    break

                # nghỉ ngơi
                await asyncio.sleep(self.get_trades_in_time_range_time_wait)
            
            except Exception as e:
                log.error(f"⚠️ Error fetching trades {symbol} : {e}")
                retry += 1
                if retry > max_retries:
                    log.error(f"🚨 Max retries reached for {symbol}")
                    break

                # Nếu lỗi policy violation thì disconnect và reconnect
                if "1008" in str(e) or "policy violation" in str(e).lower():
                    os._exit(1)   # kết thúc process ngay lập tức
                    await asyncio.sleep(5 * retry)  # exponential backoff
                    await self.disconnect()
                    # nghỉ 1 phút 
                    await asyncio.sleep(60)
                    await self.connect()
                else:
                    await asyncio.sleep(3 * retry)

        # 3) Lọc trong khoảng thời gian yêu cầu
        result = [t for t in all_trades if start_time <= t["time"] <= end_time]
        return result

    @staticmethod
    async def get_klines(
        symbol: str,
        start_time: int,
        end_time: int,
        timeframe: Timeframe
    ) -> List[Dict[str, Union[int, float]]]:
        """
        Lấy dữ liệu đồ thị nến từ Binance API trong khoảng thời gian.
        :param symbol: Cặp tiền (VD: "BTCUSDT").
        :param start_time: Thời gian bắt đầu (epoch milliseconds).
        :param end_time: Thời gian kết thúc (epoch milliseconds).
        :param timeframe: Khoảng thời gian nến (VD: "1m", "1d").
        :return: Danh sách các nến.
        """
        url = f"{Spot.url_http}/klines"
        limit = 1000  # Binance API giới hạn 1000 nến mỗi lần truy vấn
        result = []

        timeframe_ms = timeframe_to_ms(timeframe)

        # Bắt đầu truy vấn dữ liệu
        current_start_time = start_time

        async with httpx.AsyncClient() as client:
            while current_start_time < end_time:
                # Tính thời gian kết thúc cho truy vấn hiện tại
                current_end_time = min(current_start_time + timeframe_ms * limit, end_time)

                # Thực hiện yêu cầu HTTP
                params = {
                    "symbol": symbol,
                    "interval": timeframe,
                    "startTime": current_start_time,
                    "endTime": current_end_time,
                    "limit": limit,
                }

                response = await client.get(url, params=params)

                if response.status_code != 200:
                    raise RuntimeError(f"Failed to fetch klines: {response.text}")

                klines = response.json()

                if not klines:
                    break

                result.extend(klines)

                # Cập nhật current_start_time cho vòng lặp tiếp theo
                current_start_time = klines[-1][0] + timeframe_ms

                # Dừng nếu nhận được ít hơn số lượng tối đa (đã hết dữ liệu)
                if len(klines) < limit:
                    break

        return result
    
    @staticmethod
    async def ticker_24hr() -> List[Dict[str, Union[str, float]]]:
        """
        Lấy dữ liệu ticker 24hr từ Binance API.
        :return: Danh sách các ticker với dữ liệu 24 giờ.
        """
        url = Spot.url_http + "/ticker/24hr"

        # Gửi yêu cầu HTTP
        async with httpx.AsyncClient() as client:
            response = await client.get(url)

        # Kiểm tra lỗi từ API
        if response.status_code != 200:
            raise RuntimeError(f"Failed to fetch data: {response.text}")

        # Lọc bỏ những cặp mà có  lastQty = 0 và volume=0, nhớ chuyển thành số trước
        # bỏ closeTime quá lâu 1 ngày trước 
        yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).timestamp() * 1000
        filtered_data = [item for item in response.json() if float(item["lastQty"]) != 0.0 
                         and float(item["volume"]) != 0.0
                         and not re.search("1000|BEAR|BULL|UP|DOWN|_", item["symbol"])
                         and item["closeTime"] > yesterday]
        # Trả về kết quả dưới dạng JSON 
        return filtered_data
    
    @staticmethod
    async def exchangeInfo() -> List[Dict[str, Union[str, float]]]:
        """
        Lấy dữ liệu exchangeInfo từ Binance API.
        """
        url = Spot.url_http + "/exchangeInfo"

        # Gửi yêu cầu HTTP
        async with httpx.AsyncClient() as client:
            response = await client.get(url)    

        # Kiểm tra lỗi từ API
        if response.status_code != 200:
            raise RuntimeError(f"Failed to fetch data: {response.text}")

        # Trả về kết quả dưới dạng JSON
        return response.json()
