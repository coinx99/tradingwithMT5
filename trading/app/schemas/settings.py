import strawberry

@strawberry.input
class TradingSettingsInput:
    """Input type để cập nhật settings của trading service"""
    name: str


@strawberry.type
class TradingSettingsType:
    """Type để trả về settings của trading service"""
    name: str
    # Thêm các field khác nếu cần
    # Ví dụ: timeframe, active_symbols, v.v.
