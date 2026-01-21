import strawberry

from .query import MT5Query
from .mutation import MT5Mutation
from .subscription import MT5Subscription

# Combine all types into single schema
MT5Schema = strawberry.Schema(
    query=MT5Query,
    mutation=MT5Mutation,
    subscription=MT5Subscription
)


