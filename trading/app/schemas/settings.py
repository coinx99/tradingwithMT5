import strawberry
from typing import List, Optional

@strawberry.input
class DatasetSettingsInput:
    """Input type để cập nhật settings của dataset service"""
    name: str


@strawberry.type
class DatasetSettingsType:
    """Type để trả về settings của dataset service"""
    name: str
    # Thêm các field khác nếu cần
    # Ví dụ: timeframe, active_symbols, v.v.
