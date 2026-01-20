"""
Tải data từ sàn binance về 
Tổng hợp thành dữ liệu dataset
Lưu vào mongodb
Lưu vào qdrant
"""
import asyncio
import zipfile
import aiohttp
from aiohttp_socks import ProxyConnector
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from colorama import Fore, Style
from pymongo import ReplaceOne
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from qdrant_client.models import Distance, VectorParams, PointStruct
from app.models.dataset import Dataset
from app.db.init_db import db
from app.utils.log import log
from app.utils.timeframe import Timeframe, TimeframeEventValue, get_timeframe_start_end, infer_timestamp_unit
from app.utils.timeframe_timer import TimeframeTimer
from app.schemas.dataset import DatasetType 
from app.models.dataset import Dataset
from app.utils.Binance.vision import BinanceVisionData
from app.utils.types import MarketType

field_names = ["trade_id", "price", "quantity", "quote_quantity", "timestamp", "is_buyer_maker"]
ex_field_names = ["is_best_match"]


class CollectDatasetService:
    download_dir = 'import/'
    vision = BinanceVisionData()

    async def import_file_trades_csv(
        self, 
        symbol: str, 
        market_type: MarketType,
        file_csv_path: Path
    ):
        """
        Import file csv trades về.

        """
        # Log để theo dõi đang đọc file nào (symbol/market/file)
        log.info(f"⏳ đọc file csv... {symbol} - {market_type} - {file_csv_path.name}")
        # nếu là spot thì không có header, header gồm: trade_id, price, quantity, quote_quantity, timestamp, is_buyer_maker, is_best_match
        # nếu là future thì có header, header gồm: trade_id, price, quantity, quote_quantity, timestamp, is_buyer_maker 
        if market_type == "spot":
            # Spot: không có header, bỏ cột is_best_match
            # - header=None vì file spot không có header
            # - names=... để gán tên cột theo đúng schema mình kỳ vọng
            df = pd.read_csv(file_csv_path, header=None, names=[*field_names, *ex_field_names])
            # Bỏ cột is_best_match vì không dùng
            df = df.drop("is_best_match", axis=1)
        elif market_type == "future":
            # Future: có header, skip header row và đặt tên cột mới
            # - header=0: dòng đầu là header
            # - names=field_names: chuẩn hoá lại tên cột để thống nhất với nhánh spot
            df = pd.read_csv(file_csv_path, header=0, names=field_names)
        else:
            raise ValueError(f"Market type {market_type} không hợp lệ")
        
        # Chuyển sang xử lý dạng DataFrame: normalize dữ liệu, gom block, tính toán, và lưu DB
        return await self.import_file_trades_pandas(symbol, market_type, df)


    async def import_file_trades_pandas(self, symbol: str, market_type: MarketType, df: pd.DataFrame):
        """
        Import file csv trades về.
        
        """
        # Không có dữ liệu thì không làm gì
        if df is None or df.empty:
            return (0, 0, 0)

        # Validate: đảm bảo có đủ các cột tối thiểu để xử lý
        required_cols = {"price", "quantity", "timestamp", "is_buyer_maker"}
        missing = required_cols - set(df.columns)
        if missing:
            raise ValueError(f"Thiếu cột bắt buộc trong dataframe: {sorted(missing)}")

        # df = df.copy()

        # Chuẩn hoá kiểu dữ liệu (đọc từ CSV thường là string)
        df["price"] = pd.to_numeric(df["price"], errors="coerce")
        df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce")
        df["timestamp"] = pd.to_numeric(df["timestamp"], errors="coerce")

        # Drop các dòng không parse được để tránh lỗi khi tính toán
        df = df.dropna(subset=["price", "quantity", "timestamp", "is_buyer_maker"])
        if df.empty:
            return (0, 0, 0)

        # Sort theo thời gian (và trade_id nếu có) để gom consecutive chính xác
        if "trade_id" in df.columns:
            df["trade_id"] = pd.to_numeric(df["trade_id"], errors="coerce")
            df = df.sort_values(["timestamp", "trade_id"], kind="mergesort")
        else:
            df = df.sort_values(["timestamp"], kind="mergesort")

        # Định nghĩa đơn vị timestamp theo market_type
        # - spot: microseconds (us)
        # - future: milliseconds (ms)
        if market_type == "spot":
            ts_unit = "us"
        elif market_type == "future":
            ts_unit = "ms"
        else:
            raise ValueError(f"Market type {market_type} không hợp lệ")

        # Chuyển timestamp thành datetime UTC
        df["time"] = pd.to_datetime(df["timestamp"].astype("int64"), unit=ts_unit, utc=True)

        # Đồng bộ: chuyển tất cả về microseconds để lưu thống nhất
        if ts_unit == "ms":
            # ms -> us (multiply by 1_000)
            df["timestamp_us"] = df["timestamp"] * 1_000
        else:
            # us -> us (no change)
            df["timestamp_us"] = df["timestamp"]

        # Gom các giao dịch liên tiếp cùng chiều (is_buyer_maker) thành một "block"
        # Ý tưởng: mỗi khi is_buyer_maker đổi giá trị => bắt đầu block mới
        df["_block"] = df["is_buyer_maker"].ne(df["is_buyer_maker"].shift()).cumsum()
        grouped = df.groupby("_block", sort=False)

        # Tổng hợp block:
        # - volume: sum(quantity)
        # - time: lấy time cuối block (đại diện block)
        # - first_price, last_price: để tính price và price_delta theo yêu cầu
        # - is_buyer_maker: lấy giá trị của block (True/False)
        agg = grouped.agg(
            time=("time", "last"),
            first_time=("time", "first"),
            last_time=("time", "last"),
            volume=("quantity", "sum"),
            first_price=("price", "first"),
            last_price=("price", "last"),
            is_buyer_maker=("is_buyer_maker", "first"),
        ).reset_index(drop=True)

        # Giá đại diện = giá giao dịch đầu tiên trong block
        agg["price"] = agg["first_price"]
        # price_delta = giá cuối - giá đầu
        agg["price_delta"] = agg["last_price"] - agg["first_price"]
        # is_buy = True nếu is_buyer_maker == False (người mua là maker => bán)
        agg["is_buy"] = agg["is_buyer_maker"] == False
        agg = agg.dropna(subset=["price", "volume", "time", "first_price", "last_price", "is_buyer_maker"]) 
        if agg.empty:
            return (0, 0, 0)

        # Delta giữa các block liên tiếp (dùng để làm feature/label)
        agg["time_delta"] = agg["time"].diff().fillna(pd.Timedelta(0))

        # Map sang document Dataset để lưu MongoDB
        # Lưu ý: MongoDB không encode được timedelta => convert time_delta sang milliseconds (int)
        docs: List[dict] = []
        
        # Thu thập raw features cho Qdrant
        raw_features_list = []
        for r in agg.itertuples(index=False):
            time_delta = r.time_delta
            price_delta = float(r.price_delta)
            volume = float(r.volume)
            is_buy = bool(r.is_buy)
            docs.append(
                {
                    "symbol": symbol,
                    "time": r.time.to_pydatetime() if hasattr(r.time, "to_pydatetime") else r.time,
                    "time_delta": time_delta,
                    "price": float(r.price),
                    "price_delta": price_delta,
                    "volume": volume,
                    "is_buy": is_buy,
                }
            )
            
            # Thu thập features cho Qdrant
            is_buy_f = 1.0 if is_buy else 0.0
            raw_features_list.append([price_delta, volume, time_delta, is_buy_f])
        # Chuyển sang numpy array
        raw_features = np.array(raw_features_list) if raw_features_list else np.empty((0, 4))

        # Lưu vào Qdrant (nếu có dữ liệu)
        if raw_features.size > 0:
            await self.save_to_qdrant(raw_features, docs)
            
        # Lưu vào MongoDB bằng hàm riêng 
        return await self.save_to_mongodb(docs)


    async def save_to_mongodb(self, docs: List[dict]):
        """
        Lưu danh sách documents vào MongoDB bằng bulk upsert.
        
        Args:
            docs: List[Dict] - danh sách document Dataset để lưu
            
        Returns:
            tuple: (inserted, replaced, total)
        """
        if not docs:
            return (0, 0, 0)
            
        ops = [
            ReplaceOne(
                {"symbol": d["symbol"], "time": d["time"]},
                d,
                upsert=True,
            )
            for d in docs
        ]

        # Bulk upsert để tăng tốc import (thay vì insert từng record)
        collection = Dataset.get_pymongo_collection()
        result = await collection.bulk_write(ops, ordered=False)

        inserted = len(getattr(result, "upserted_ids", {}) or {})
        replaced = int(getattr(result, "modified_count", 0) or 0)
        total = len(ops)

        return (inserted, replaced, total)


    async def save_to_qdrant(self, X_raw: np.ndarray, docs: List[dict]):
        """
        Lưu vectors và metadata vào Qdrant.
        
        Args:
            X_raw: numpy array - raw features [[price_delta, volume, time_delta, is_buy], ...]
            docs: List[dict] - metadata tương ứng với mỗi vector
        """
        if X_raw.size == 0 or not docs:
            return

        scaler = StandardScaler()
        scaler.fit(X_raw)
        joblib.dump(scaler, "qdrant_scaler.pkl")
        print("✅ Đã lưu scaler!")

        client = db.qdrant_client
        collection_name = "dataset"
        
        # --- 1. Đảm bảo collection tồn tại ---
        try:
            client.get_collection(collection_name)
        except Exception:
            # Tạo mới nếu chưa có
            client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=4, distance=Distance.COSINE)
            )
            log.info(f"🆕 Tạo collection Qdrant: {collection_name}")
        
        # --- 2. Chuẩn hóa features (CHỈ transform, không fit!) ---
        try:
            X_scaled = scaler.transform(X_raw)  # ← scaler phải được fit trước!
        except Exception as e:
            log.error(f"❌ Lỗi khi chuẩn hóa dữ liệu cho Qdrant: {e}")
            return

        # --- 3. Tạo points ---
        points = []
        for vector, doc in zip(X_scaled, docs):
            # Tạo ID ổn định: symbol + timestamp (microseconds)
            ts_us = int(doc["time"].timestamp() * 1_000_000)  # microsecond precision
            id_str = f"{doc['symbol']}_{ts_us}"
            point_id = int(hashlib.md5(id_str.encode()).hexdigest()[:16], 16)

            points.append(PointStruct(
                id=point_id,
                vector=vector.tolist(),
                payload={
                    "symbol": doc["symbol"],
                    "time": doc["time"].isoformat(),
                    "price": float(doc["price"]),
                    "price_delta": float(doc["price_delta"]),
                    "volume": float(doc["volume"]),
                    "is_buy": bool(doc["is_buy"]),
                    "time_delta_sec": float(doc["time_delta"]),  # đơn vị: giây
                }
            ))

        # --- 4. Upsert theo batch ---
        batch_size = 100
        max_retries = 3

        for i in range(0, len(points), batch_size):
            batch = points[i:i + batch_size]
            for attempt in range(max_retries):
                try:
                    client.upsert(collection_name=collection_name, points=batch)
                    log.info(f"✅ Đã lưu {len(batch)} vectors vào Qdrant (batch {i // batch_size + 1})")
                    break
                except Exception as e:
                    if attempt < max_retries - 1:
                        log.warning(f"⚠️ Qdrant upsert thất bại (lần {attempt + 1}), thử lại...: {str(e)[:100]}")
                        await asyncio.sleep(1)
                    else:
                        log.error(f"❌ Qdrant upsert thất bại sau {max_retries} lần: {e}")




    async def import_month(
        self, 
        symbol: str, 
        market_type: MarketType,
        month: int, 
        year: int
    ):
        """
        Tải data từ sàn binance về.
        mở file csv ra, đọc.
        chuyển đổi thành định dạng dataset
        """
        data_type = 'trades'
        # tải 
        # nếu file đã tải thì thôi 
        # zip_path = self.vision.download_trades_month(symbol, market_type, data_type, month, year, self.download_dir)
        zip_path = self.vision.download_trade(symbol, market_type, data_type, datetime(2025, 12, 1), self.download_dir)
        log.info(f"Đã tải xong file: {zip_path}, đang giải nén...")
        # mở file 
        # đọc file csv
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            for name in zip_ref.namelist():
                if name.endswith(".csv"):
                    r = zip_ref.extract(name, path=zip_path.parent)
                    extracted_path = zip_path.with_suffix(".csv")
                    # đổi tên để khỏi trùng
                    Path(r).rename(extracted_path)
                    log.info(f"Đã giải nén file: {extracted_path}")
                    (inserted, replaced, total) = await self.import_file_trades_csv(symbol, market_type, extracted_path)
                    log.info(f"Đã import file: {extracted_path}, inserted: {Fore.GREEN}{inserted}{Style.RESET_ALL}, replaced: {Fore.YELLOW}{replaced}{Style.RESET_ALL}, total: {Fore.CYAN}{total}{Style.RESET_ALL}")

    