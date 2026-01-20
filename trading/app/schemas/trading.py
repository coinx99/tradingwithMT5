import strawberry
from typing import List, Literal, Tuple
from datetime import datetime

Symbol=str
Price=float
Volume=float
PriceVolumes = List[Tuple[Price, Volume]]  # [giá, khối lượng]

# Enum cho MarketType
MarketType= Literal['spot',"future"]


@strawberry.type
class TradingType:
    symbol: str
    time: datetime
    last_price: float
    buys: PriceVolumes
    sells: PriceVolumes
