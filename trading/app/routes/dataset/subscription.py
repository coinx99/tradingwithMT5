import strawberry
from strawberry.types import Info
from app.schemas.dataset import DatasetType

@strawberry.type
class DatasetSubscription:
    @strawberry.subscription
    async def dataset(self, info: Info) -> DatasetType:
        return DatasetType()
