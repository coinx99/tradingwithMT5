from datetime import datetime, timedelta
# from typing import Optional

from sentence_transformers import SentenceTransformer
import numpy as np

from beanie import Document
from pydantic import field_serializer, field_validator
# from pydantic.fields import Field

class Dataset(Document):
    symbol: str

    time: datetime
    """
    đơn vị microseconds
    """
    time_delta: timedelta
    """
    đơn vị microseconds
    """

    price: float
    price_delta: float

    volume: float

    is_buy: bool

    @field_validator("time_delta", mode="before")
    @classmethod
    def _validate_time_delta(cls, v):
        if isinstance(v, timedelta):
            return v
        if isinstance(v, (int, float)):
            return timedelta(milliseconds=float(v))
        return v

    @field_serializer("time_delta")
    def _serialize_time_delta(self, v: timedelta):
        return int(v.total_seconds() * 1000)

    class Settings:
        name = "datasets"
        use_state_management = True
        indexes = [
            [("symbol", 1), ("time", 1)],
        ]



class DatasetEmbedding:
    def __init__(self):
        self.text_model = SentenceTransformer('all-MiniLM-L6-v2')  # 384 dimensions
    
    def create_embedding(self, doc: Dataset) -> np.ndarray:
        # 1. Biến đổi thô
        is_buy_f = 1.0 if doc.is_buy else 0.0

        # 2. Tạo vector thô
        raw_vec = [doc.price_delta, doc.volume, doc.time_delta, is_buy_f]

        # 3. Chuẩn hóa (nếu có scaler)
        if scaler is not None:
            vec = scaler.transform([raw_vec])[0]
        else:
            vec = raw_vec  # cảnh báo: không chuẩn hóa sẽ ảnh hưởng độ chính xác

        return vec.tolist()