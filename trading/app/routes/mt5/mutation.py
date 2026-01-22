import asyncio
from typing import List, Optional
import strawberry
from strawberry.types import Info
from datetime import datetime

from app.services.mt5_service import mt5_service
from app.models.mt5 import MT5Connection
from app.routes.deps import get_current_user
from app.utils.log import log
from app.schemas.mt5 import MT5ConnectionType, MT5AccountInput, OrderInput, OrderType
from app.schemas.common import MutationResponse, SuccessResponse, ErrorResponse


@strawberry.type
class MT5Mutation:
    @strawberry.mutation
    async def connect_mt5(self, info: Info, account: MT5AccountInput) -> MT5ConnectionType:
        """Connect to MT5 terminal"""
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        api_key = request.query_params.get("api_key")

        current_user = await get_current_user(token=token, api_key=api_key)
        if not current_user:
            raise Exception("User not authenticated")

        success = await mt5_service.connect_mt5(
            user_id=str(current_user.id),
            login=account.login,
            password=account.password,
            server=account.server,
            path=account.path,
        )

        if success:
            connection = await mt5_service.get_connection_status(str(current_user.id))
            return MT5ConnectionType(
                id=str(connection.id) if connection else "",
                account_login=account.login,
                server=account.server,
                is_connected=True,
                last_ping=connection.last_ping.isoformat() if connection.last_ping else None,
                error_message=None,
                created_at=connection.created_at.isoformat() if connection else ""
            )
        else:
            raise Exception("Failed to connect to MT5")

    @strawberry.mutation
    async def disconnect_mt5(self, info: Info) -> bool:
        """Disconnect from MT5 terminal"""
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        api_key = request.query_params.get("api_key")

        current_user = await get_current_user(token=token, api_key=api_key)
        if not current_user:
            raise Exception("User not authenticated")

        return await mt5_service.disconnect_mt5(str(current_user.id))

    @strawberry.mutation
    async def place_order(self, info: Info, order: OrderInput) -> OrderType:
        """Place order through MT5"""
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        api_key = request.query_params.get("api_key")

        current_user = await get_current_user(token=token, api_key=api_key)
        if not current_user:
            raise Exception("User not authenticated")

        order_data = {
            "symbol": order.symbol,
            "volume": order.volume,
            "type": order.type,
            "price": order.price,
            "sl": order.sl,
            "tp": order.tp,
            "ticket_id": order.ticket_id,
            "magic": order.magic
        }

        placed_order = await mt5_service.place_order(str(current_user.id), order_data)
        
        if placed_order:
            return OrderType(
                id=str(placed_order.id),
                symbol=placed_order.symbol,
                volume=placed_order.volume,
                type=placed_order.type,
                price=placed_order.price,
                sl=placed_order.sl,
                tp=placed_order.tp,
                status=placed_order.status,
                ticket_id=placed_order.ticket_id,
                magic=placed_order.magic,
                created_at=placed_order.created_at.isoformat(),
                filled_at=placed_order.filled_at.isoformat() if placed_order.filled_at else None
            )
        else:
            raise Exception("Failed to place order")

    @strawberry.mutation
    async def adopt_mt5_login(self, info: Info) -> Optional[MT5ConnectionType]:
        """Adopt existing MT5 login as current user connection"""
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        api_key = request.query_params.get("api_key")

        current_user = await get_current_user(token=token, api_key=api_key)
        if not current_user:
            raise Exception("User not authenticated")

        try:
            # Use the new adopt_existing_login method
            connection = await mt5_service.adopt_existing_login(str(current_user.id))
            
            return MT5ConnectionType(
                id=str(connection.id),
                account_login=connection.account_login,
                server=connection.server,
                is_connected=connection.is_connected,
                last_ping=connection.last_ping.isoformat() if connection.last_ping else None,
                error_message=connection.error_message,
                created_at=connection.created_at.isoformat(),
            )
        except Exception as e:
            log.error(f"Failed to adopt MT5 login: {e}")
            raise Exception(str(e))

    @strawberry.mutation
    async def close_position(self, info: Info, position_id: str) -> MutationResponse:
        """Close position through MT5"""
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        api_key = request.query_params.get("api_key")

        current_user = await get_current_user(token=token, api_key=api_key)
        if not current_user:
            return ErrorResponse(
                status="ERROR",
                message="User not authenticated",
                error_code="AUTH_ERROR"
            )

        try:
            success = await mt5_service.close_position(str(current_user.id), position_id)
            if success:
                return SuccessResponse(
                    status="SUCCESS",
                    message=f"Position {position_id} closed successfully",
                    data=position_id
                )
            else:
                return ErrorResponse(
                    status="ERROR",
                    message="Failed to close position",
                    error_code="CLOSE_FAILED"
                )
        except Exception as e:
            # Log once here and return structured error
            log.error(f"Failed to close position for user {current_user.id}: {e}")
            return ErrorResponse(
                status="ERROR",
                message=str(e),
                error_code="MT5_ERROR",
                details=f"Position {position_id} could not be closed"
            )
