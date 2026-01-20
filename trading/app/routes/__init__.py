from typing import Any
import strawberry
from strawberry.fastapi import GraphQLRouter

from app.routes.dataset.query import DatasetQuery
from app.routes.dataset.mutation import DatasetMutation
from app.routes.dataset.subscription import DatasetSubscription

# strawberry GraphQL

@strawberry.type
class Query(DatasetQuery):
    @strawberry.field
    def ping(self) -> str:
        return "pong"


@strawberry.type
class Mutation(DatasetMutation):
    pass


@strawberry.type
class Subscription(DatasetSubscription):
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

