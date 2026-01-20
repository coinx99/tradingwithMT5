from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Callable, Literal, Union
import requests
import inspect
import asyncio

from app.utils.log import log
from app.utils.types import MarketType


DataType = Literal["aggTrades", "trades", "klines"]



class BinanceVisionData:
    BASE_URL = "https://data.binance.vision/data"

    @staticmethod
    def build_url(symbol: str, market_type: MarketType, data_type: DataType, date: datetime, prefer_monthly: bool) -> str:
        """
        Tạo URL tải dữ liệu từ Binance Vision.
        """
        type_folder = "monthly" if prefer_monthly else "daily"
        date_str = date.strftime("%Y-%m") if prefer_monthly else date.strftime("%Y-%m-%d")
        filename = f"{symbol.upper()}-{data_type}-{date_str}.zip"
        return f"{BinanceVisionData.BASE_URL}/{market_type}{'s/um' if market_type=="future" else ''}/{type_folder}/{data_type}/{symbol.upper()}/{filename}"


    @staticmethod
    def download_file(url: str, dest_path: Path):
        """
        Tải file từ URL và lưu vào đường dẫn chỉ định.
        """
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        if dest_path.exists():
            # log.info(f"🟡 Đã tồn tại: {dest_path.name}")
            return

        log.info(f"⬇️  Đang tải: {url}")
        response = requests.get(url, stream=True)
        if response.status_code == 200:
            with open(dest_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            # log.info(f"✅ Đã tải: {dest_path.name}")
        else:
            log.error(f"❌ Không thể tải: {url} ({response.status_code})")


    @staticmethod
    def download_range_trades(
        symbol: str,
        market_type: MarketType,
        data_type: DataType,
        start_date: datetime,
        end_date: datetime,
        download_dir: str,
        prefer_monthly: bool = False,
        on_csv_extracted: Optional[Callable[[Path, datetime], None]] = None
    ):
        """
        Tải dữ liệu trades từ Binance Vision trong khoảng thời gian đã cho.

        Parameters:
            symbol (str): Ví dụ 'BTCUSDT'
            market_type (str): 'spot', 'um', 'cm', ...
            data_type (str): 'trades', 'aggTrades', ...
            start_date (datetime): ngày bắt đầu
            end_date (datetime): ngày kết thúc
            download_dir (str): thư mục lưu file .zip
            prefer_monthly (bool): True = tải dạng monthly, False = daily
            on_csv_extracted (Callable, optional): callback để xử lý zip sau khi tải, nhận tham số (path: Path, current_date: datetime)
        """
        current_date = start_date
        while current_date <= end_date:
            url = BinanceVisionData.build_url(symbol, market_type, data_type, current_date, prefer_monthly)
            file_name = url.split("/")[-1]
            save_path = Path(download_dir) / f"{market_type}_{file_name}"

            BinanceVisionData.download_file(url, save_path)

            if save_path.exists() and on_csv_extracted:
                # Kiểm tra xem callback có phải là async function không
                if inspect.iscoroutinefunction(on_csv_extracted):
                    # Nếu là async function, chạy trong event loop
                    try:
                        loop = asyncio.get_event_loop()
                        if loop.is_running():
                            # Nếu đang trong event loop, tạo task
                            asyncio.create_task(on_csv_extracted(save_path, current_date))
                        else:
                            # Nếu không có event loop, chạy sync
                            loop.run_until_complete(on_csv_extracted(save_path, current_date))
                    except RuntimeError:
                        # Nếu không có event loop, tạo mới
                        asyncio.run(on_csv_extracted(save_path, current_date))
                else:
                    # Nếu là sync function, gọi trực tiếp
                    on_csv_extracted(save_path, current_date)

            current_date += timedelta(days=30) if prefer_monthly else timedelta(days=1)

    
    @staticmethod
    def download_trade(
        symbol: str,
        market_type: MarketType,
        data_type: DataType,
        date: datetime,
        download_dir: str,
    ) -> Path:
        """
        Tải dữ liệu trades của 1 ngày hoặc 1 tháng từ Binance Vision.

        Parameters:
            symbol (str): Ví dụ 'BTCUSDT'
            market_type (MarketType): 'spot', 'um', 'cm', ...
            data_type (DataType): 'trades', 'aggTrades', ...
            date (datetime): ngày hoặc tháng cần tải
            download_dir (str): thư mục lưu file .zip
            prefer_monthly (bool): True = tải dạng monthly, False = daily
            on_csv_extracted (Callable, optional): callback xử lý zip sau khi tải

        Returns:
            Path: Đường dẫn file đã tải
        """
        # Tạo URL và đường dẫn lưu
        url = BinanceVisionData.build_url(symbol, market_type, data_type, date, False)
        file_name = url.split("/")[-1]
        save_path = Path(download_dir) / f"{market_type}_{file_name}"

        # Tải file
        BinanceVisionData.download_file(url, save_path)
        return save_path

    @staticmethod
    def download_trades_month(
        symbol: str,
        market_type: MarketType,
        data_type: DataType,
        month: int,
        year: int,
        download_dir: str,
    ) -> Path:
        """
        Tải dữ liệu trades của 1 tháng từ Binance Vision.

        Parameters:
            symbol (str): Ví dụ 'BTCUSDT'
            market_type (MarketType): 'spot', 'um', 'cm', ...
            data_type (DataType): 'trades', 'aggTrades', ...
            month (int): tháng cần tải
            year (int): năm cần tải
            download_dir (str): thư mục lưu file .zip

        Returns:
            Path: Đường dẫn file đã tải
        """
        date = datetime(year, month, 1)
        # Tạo URL và đường dẫn lưu
        url = BinanceVisionData.build_url(symbol, market_type, data_type, date, True)
        file_name = url.split("/")[-1]
        save_path = Path(download_dir) / f"{market_type}_{file_name}"

        # Tải file
        BinanceVisionData.download_file(url, save_path)
        return save_path
