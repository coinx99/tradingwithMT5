from typing import Any
import strawberry
from strawberry.fastapi import GraphQLRouter

from app.routes.trading import TradingQuery, TradingMutation, TradingSubscription
from app.routes.users import UserQuery, UserMutation, UserSubscription
from app.routes.mt5 import MT5Query, MT5Mutation, MT5Subscription
from app.routes.mt5.account_management import AccountManagement

# strawberry GraphQL

@strawberry.type
class Query(TradingQuery, UserQuery, MT5Query, AccountManagement):
    @strawberry.field
    def ping(self) -> str:
        return "pong"


@strawberry.type
class Mutation(TradingMutation, UserMutation, MT5Mutation, AccountManagement):
    pass


@strawberry.type
class Subscription(TradingSubscription, UserSubscription, MT5Subscription):
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

