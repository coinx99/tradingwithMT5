
from datetime import datetime
from typing import List, Tuple
from beanie import Document

PriceVolumes = List[Tuple[float, float]]  # [giá, khối lượng]

class Trading(Document):
    symbol: str
    time: datetime
    last_price: float
    buys: PriceVolumes = []
    sells: PriceVolumes = []
    
    class Settings:
        name = "trading"