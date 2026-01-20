from typing import Any
import strawberry
from strawberry.fastapi import GraphQLRouter

from app.routes.trading.query import TradingQuery
from app.routes.trading.mutation import TradingMutation
from app.routes.trading.subscription import TradingSubscription

# strawberry GraphQL

@strawberry.type
class Query(TradingQuery):
    @strawberry.field
    def ping(self) -> str:
        return "pong"


@strawberry.type
class Mutation(TradingMutation):
    pass


@strawberry.type
class Subscription(TradingSubscription):
    pass



async def context_getter(request: Any = None, **kwargs):
    if request is None:
        request = kwargs.get("request")
    return {"request": request}

# Tạo schema
graphql_schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    subscription=Subscription
)

# Tạo GraphQL Router với context
# graphql_app = GraphQLRouter(graphql_schema, context_getter=context_getter)
graphql_app = GraphQLRouter(graphql_schema)

