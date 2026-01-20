from enum import Enum
from typing import Any, List, Literal, Tuple, TypedDict


TIME_FORMAT = "%Y-%m-%d %H:%M:%S"


class PaginationDict(TypedDict):
    page: int
    per_page: int
    total: int
    results: List[Any]

MarketType = Literal["spot", "future"]

class MarketTypeEnum(Enum):
    spot = "spot"
    future = "future"

PriceVolume = Tuple[float, float]  # (price, volume): Một cặp giá và khối lượng
"""
(price, volume): Một cặp giá và khối lượng
"""

class ProcessStatusEnum(Enum):
    created = "created"
    running = "running"
    completed = "completed"
    stopped = "stopped"
    error = "error"
    failed = "failed"


