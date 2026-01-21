from typing import List, Optional
import strawberry
from strawberry.types import Info

from app.services.mt5_service import mt5_service
from app.models.mt5 import Position, Trade, MT5Connection
from app.routes.deps import get_current_user
from app.utils.log import log

from .mutation import PositionType, TradeType, MT5ConnectionType


@strawberry.type
class MT5Query:
    @strawberry.field
    async def mt5_connection(self, info: Info) -> Optional[MT5ConnectionType]:
        """Get MT5 connection status"""
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        api_key = request.query_params.get("api_key")

        current_user = await get_current_user(token=token, api_key=api_key)
        if not current_user:
            raise Exception("User not authenticated")

        connection = await mt5_service.get_connection_status(str(current_user.id))
        
        if connection:
            return MT5ConnectionType(
                id=str(connection.id),
                account_login=connection.account_login,
                server=connection.server,
                is_connected=connection.is_connected,
                last_ping=connection.last_ping.isoformat() if connection.last_ping else None,
                error_message=connection.error_message,
                created_at=connection.created_at.isoformat()
            )
        return None

    @strawberry.field
    async def positions(self, info: Info) -> List[PositionType]:
        """Get all open positions"""
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        api_key = request.query_params.get("api_key")

        current_user = await get_current_user(token=token, api_key=api_key)
        if not current_user:
            raise Exception("User not authenticated")

        positions = await mt5_service.get_positions(str(current_user.id))
        
        return [
            PositionType(
                id=str(position.id),
                symbol=position.symbol,
                volume=position.volume,
                type=position.type,
                price_open=position.price_open,
                price_current=position.price_current,
                profit=position.profit,
                ticket_id=position.ticket_id,
                magic=position.magic,
                created_at=position.created_at.isoformat(),
                updated_at=position.updated_at.isoformat()
            )
            for position in positions
        ]

    @strawberry.field
    async def trading_history(self, info: Info) -> List[TradeType]:
        """Get trading history"""
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        api_key = request.query_params.get("api_key")

        current_user = await get_current_user(token=token, api_key=api_key)
        if not current_user:
            raise Exception("User not authenticated")

        trades = await Trade.find({"user_id": str(current_user.id)}).to_list()
        
        return [
            TradeType(
                id=str(trade.id),
                symbol=trade.symbol,
                volume=trade.volume,
                type=trade.type,
                price=trade.price,
                profit=trade.profit,
                commission=trade.commission,
                swap=trade.swap,
                ticket_id=trade.ticket_id,
                magic=trade.magic,
                open_time=trade.open_time.isoformat(),
                close_time=trade.close_time.isoformat() if trade.close_time else None
            )
            for trade in trades
        ]
