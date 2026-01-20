import asyncio
import json
from datetime import datetime
from websockets import State, connect
from typing import Callable, Coroutine, List
from colorama import Fore, Style
from .types import KlineMap
from .Spot import Spot

from app.utils.log import log
from app.utils.timeframe import timeframe_to_second, TimeframeEventValue

event_to_stream = {
    "markPriceUpdate": "markPrice",
    "depthUpdate": "depth",
    "trade": "trade",
    "aggTrade": "aggTrade",
    "klineUpdate": "kline",  # Ví dụ với mốc thời gian 1 phút
    "24hrTicker": "24hrTicker",
    # Bạn có thể thêm nhiều Event Type khác ở đây...
}

class StreamSpot:
    def __init__(self, url: str = "wss://stream.binance.com:9443/ws"):
        """
        Initialize the BinanceStreamFuture class.
        :param url: Base WebSocket URL (default is for Binance futures).
        """
        self.base_url = url
        self.connection = None
        self.subscriptions = {}  # Store active subscriptions {stream_name: [callbacks]}

    async def connect(self):
        """
        Connect to the Binance WebSocket.
        """
        self.connection = await connect(self.base_url)
        log.info("✔️ Connected to Binance StreamSpot WebSocket")
        asyncio.create_task(self.on_message())  # Automatically start listening

    async def disconnect(self):
        """
        Disconnect from the Binance WebSocket.
        """
        if self.connection:
            await self.connection.close()
            log.error(f"{Fore.RED}Disconnected from Binance Stream Spot WebSocket")
    
    def is_connected(self) -> bool:
            """
            Kiểm tra trạng thái kết nối WebSocket.
            Trả về True nếu kết nối đang mở, ngược lại là False.
            """
            return self.connection is not None and self.connection.state == State.OPEN

    def isConnected(self):
        """
        Kiểm tra kết nối đến Binance WebSocket.
        """
        return self.connection.state == State.OPEN
    
    async def subscribe(self, stream_name: str, callback: Callable):
        """
        Subscribe to a stream and add a callback to handle the data.
        :param stream_name: The stream name (e.g., 'btcusdt@depth@100ms').
        :param callback: A function to handle incoming data for this stream.
        """
        if stream_name not in self.subscriptions:
            self.subscriptions[stream_name] = []
            # Send subscription request to the server
            await self._send_subscription(stream_name)
        self.subscriptions[stream_name].append(callback)
        
    async def subscribe_multiple(self, stream_names: List[str], callback: Callable):
        """
        Subscribe to multiple streams and add a callback to handle the data.
        :param stream_names: A list of stream names (e.g., ['btcusdt@depth@100ms', 'ethusdt@trade']).
        :param callback: A function to handle incoming data for these streams.
        """
        message = {
            "method": "SUBSCRIBE",
            "params": stream_names,
            "id": 1
        }
        await self.connection.send(json.dumps(message))
        log.info(f"Subscribed to {stream_names}")
        
        for stream_name in stream_names:
            if stream_name not in self.subscriptions:
                self.subscriptions[stream_name] = []
            self.subscriptions[stream_name].append(callback)

    async def unsubscribe(self, stream_name: str, callback: Callable = None):
        """
        Unsubscribe from a stream or remove a specific callback.
        :param stream_name: The stream name (e.g., 'btcusdt@depth@100ms').
        :param callback: The callback to remove (if None, unsubscribe from stream completely).
        """
        if stream_name in self.subscriptions:
            if callback:
                self.subscriptions[stream_name].remove(callback)
                if not self.subscriptions[stream_name]:  # If no callbacks remain
                    del self.subscriptions[stream_name]
                    await self._send_unsubscription(stream_name)
            else:
                del self.subscriptions[stream_name]
                await self._send_unsubscription(stream_name)
                
    async def unsubscribe_multiple(self, stream_names: List[str]):
        """
        Unsubscribe from multiple streams.
        """
        for stream_name in stream_names:
            await self.unsubscribe(stream_name)
            
    async def unsubscribe_multiple_callback(self, stream_names: List[str], callback: Callable):
        """
        Unsubscribe from multiple streams and remove a specific callback.
        """
        for stream_name in stream_names:
            await self.unsubscribe(stream_name, callback)

    async def _send_subscription(self, stream_name: str):
        """
        Send subscription message to the server.
        """
        message = {
            "method": "SUBSCRIBE",
            "params": [stream_name],
            "id": 1
        }
        await self.connection.send(json.dumps(message))
        log.info(f"Subscribed to {stream_name}")

    async def _send_unsubscription(self, stream_name: str):
        """
        Send unsubscription message to the server.
        """
        message = {
            "method": "UNSUBSCRIBE",
            "params": [stream_name],
            "id": 1
        }
        await self.connection.send(json.dumps(message))
        log.info(f"Unsubscribed from {stream_name}")

    async def on_message(self):
        """
        Listen for incoming messages from the WebSocket.
        """
    # try:
        async for message in self.connection:
            data = json.loads(message)
            data_type = data.get("e")
            symbol = data.get("s")
            if not symbol or not data_type or data_type not in event_to_stream:
                continue
            
            stream_name = f"{symbol.lower()}@{event_to_stream[data_type]}"
            if data_type == "kline":
                stream_name = f"{symbol.lower()}@{event_to_stream[data_type]}_{data.get('k').get('i')}"

            if stream_name and stream_name in self.subscriptions:
                for callback in self.subscriptions[stream_name]:
                    asyncio.create_task(callback(data))
                    
    # except websockets.exceptions.ConnectionClosed as e:
    #     log.error(f"{Fore.RED}Connection closed: {e} {Fore.RESET}")
    # except Exception as err:
    #     log.error(f"{Fore.RED}Error: {err} {Fore.RESET}", file=sys.stderr)
    #     traceback.print_exc(file=sys.stderr)
    # finally:
    #     await self.disconnect()

    async def subscribe_agg_trades(self, symbols: List[str], callback: Callable):
        """
        Subscribe to Aggregated Trade Streams for given symbols.
        :param symbols: List of symbols to subscribe to (e.g., ['btcusdt', 'ethusdt']).
        :param callback: A function to handle aggregated trade data.
        """
        stream_names: List = []
        for symbol in symbols:
            stream_names.append(f"{symbol.lower()}@aggTrade")
            
        await self.subscribe_multiple(stream_names, callback)

    async def subscribe_mark_prices(self, symbols: List[str], callback: Callable):
        """
        Subscribe to Mark Price Streams for given symbols.
        """
        stream_names: List = []
        for symbol in symbols:
            stream_names.append(f"{symbol.lower()}@markPrice")
            
        await self.subscribe_multiple(stream_names, callback)
    
    async def subscribe_depths(self, symbols: List[str], callback: Callable):
        """
        Subscribe to Depth Streams for given symbols.
        :param symbols: List of symbols to subscribe to (e.g., ['btcusdt', 'ethusdt']).
        :param callback: A function to handle depth data.
        """
        stream_names: List = []
        for symbol in symbols:
            stream_names.append(f"{symbol.lower()}@depth")
            
        await self.subscribe_multiple(stream_names, callback)

    async def subscribe_trades(self, symbols: List[str], callback: Callable):
        """
        Subscribe to Trade Streams for given symbols.
        :param symbols: List of symbols to subscribe to (e.g., ['btcusdt', 'ethusdt']).
        :param callback: A function to handle trade data.
        """
        stream_names: List = []
        for symbol in symbols:
            stream_names.append(f"{symbol.lower()}@trade")
            
        await self.subscribe_multiple(stream_names, callback)

    @staticmethod
    async def subscribe_timeframe(timeframe: str = "1m", on_close: Coroutine = None, on_remaining: Coroutine = None) -> Callable:
        """
        Đăng ký nhận dữ liệu kline theo khung thời gian cụ thể và thực hiện hành động khi nến đóng.
        :param timeframe: Khung thời gian của nến (ví dụ: 1m, 5m, 1h, v.v.).
        :param on_close: Hàm callback được gọi khi nến đóng, nhận đối số là một đối tượng chứa thông tin về thời gian còn lại, khung thời gian, thời gian mở và thời gian đóng của nến.
        :param on_remaining: (Tùy chọn) Hàm callback được gọi khi có dữ liệu kline mới, nhận đối số là một đối tượng chứa thông tin về thời gian còn lại, khung thời gian, thời gian mở và thời gian đóng của nến.
        :returns: Hàm để dừng bắt sự kiện `subscribe_timeframe`.
        """
        now = datetime.now()
        timeframe_s = timeframe_to_second(timeframe) # seconds
        start_time = int(now.timestamp() - timeframe_s) * 1000
        end_time = int(now.timestamp() * 1000)

        # lấy cây nến cuối
        klines = await Spot.get_klines('BTCUSDT',
                                         start_time,
                                         end_time,
                                         timeframe)

        if klines and len(klines) > 0:
            # thời gian mở nến seconds
            open_time = float(klines[-1][KlineMap.openTime])/1000 
            # thời gian đóng nến seconds
            close_time = open_time + timeframe_s
            
            async def loop(open_time: float, close_time: float):
                while True:
                    # thời gian còn lại trước khi đóng nến seconds
                    remaining = datetime.now().timestamp() - close_time
                    timeframeEvent = TimeframeEventValue(remaining,  open_time, close_time, timeframe)
                    # đóng nến, chạy hàm on_close 
                    if remaining >= 0:
                        asyncio.create_task(on_close(timeframeEvent))
                            
                        open_time = close_time
                        close_time += timeframe_s
                    
                    # nếu có hàm on_remaining thì chạy 
                    if on_remaining:
                        asyncio.create_task(on_remaining(timeframeEvent))
                        
                    await asyncio.sleep(1)
                    
            try:
                return asyncio.create_task(loop(open_time, close_time))
            except asyncio.CancelledError:
                log.error(f"{Fore.RED}Task cancelled cleanly")
            except Exception as err:
                raise err
        
        else:
            raise RuntimeError(f"Failed to fetch klines: start_time:{start_time}, end_time: {end_time}, timeframe: {timeframe}", start_time, end_time, timeframe)
