import strawberry
from strawberry.types import Info
from app.schemas.trading import TradingType

@strawberry.type
class TradingSubscription:
    @strawberry.subscription
    async def tradings(self, info: Info) -> TradingType:
        return TradingType()
