from typing import List, Optional
import strawberry
from strawberry.types import Info
from datetime import datetime, timezone

from app.services.mt5_service import mt5_service
from app.models.mt5 import Trade
from app.routes.deps import get_current_user
from app.utils.log import log
from app.schemas.mt5 import MT5AccountInfoType, MT5LiveOrderType, MT5LivePositionType, PositionType, TradeType, MT5ConnectionType


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
    async def mt5_account_info(self, info: Info) -> Optional[MT5AccountInfoType]:
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        api_key = request.query_params.get("api_key")

        current_user = await get_current_user(token=token, api_key=api_key)
        if not current_user:
            raise Exception("User not authenticated")

        data = await mt5_service.get_live_account_info(str(current_user.id))
        if not data:
            return None

        return MT5AccountInfoType(
            login=int(data.get("login", 0)),
            server=str(data.get("server", "")),
            name=str(data.get("name", "")),
            company=str(data.get("company", "")),
            currency=str(data.get("currency", "")),
            balance=float(data.get("balance", 0.0)),
            credit=float(data.get("credit", 0.0)),
            profit=float(data.get("profit", 0.0)),
            equity=float(data.get("equity", 0.0)),
            margin=float(data.get("margin", 0.0)),
            margin_free=float(data.get("margin_free", 0.0)),
            margin_level=float(data.get("margin_level", 0.0)),
            margin_so_call=float(data.get("margin_so_call", 0.0)),
            margin_so_so=float(data.get("margin_so_so", 0.0)),
            leverage=int(data.get("leverage", 0)),
            trade_mode=int(data.get("trade_mode", 0)),
            limit_orders=int(data.get("limit_orders", 0)),
            margin_so_mode=int(data.get("margin_so_mode", 0)),
            trade_allowed=bool(data.get("trade_allowed", False)),
            trade_expert=bool(data.get("trade_expert", False)),
            margin_mode=int(data.get("margin_mode", 0)),
            currency_digits=int(data.get("currency_digits", 0)),
            fifo_close=bool(data.get("fifo_close", False)),
        )

    @strawberry.field
    async def positions(self, info: Info) -> List[PositionType]:
        """Get all open positions"""
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        api_key = request.query_params.get("api_key")

        current_user = await get_current_user(token=token, api_key=api_key)
        if not current_user:
            raise Exception("User not authenticated")

        live_positions = await mt5_service.get_live_positions(str(current_user.id))
        if live_positions:
            now = datetime.now(timezone.utc).isoformat()
            return [
                PositionType(
                    id=str(p.get("ticket", "")),
                    symbol=str(p.get("symbol", "")),
                    volume=float(p.get("volume", 0.0)),
                    type=str(p.get("type", "")),
                    price_open=float(p.get("price_open", 0.0)),
                    price_current=float(p.get("price_current", 0.0)),
                    profit=float(p.get("profit", 0.0)),
                    ticket_id=str(p.get("ticket", "")),
                    magic=int(p.get("magic", 0)),
                    created_at=now,
                    updated_at=now,
                )
                for p in live_positions
            ]

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
                updated_at=position.updated_at.isoformat(),
            )
            for position in positions
        ]

    @strawberry.field
    async def mt5_orders(self, info: Info) -> List[MT5LiveOrderType]:
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        api_key = request.query_params.get("api_key")

        current_user = await get_current_user(token=token, api_key=api_key)
        if not current_user:
            raise Exception("User not authenticated")

        orders = await mt5_service.get_live_orders(str(current_user.id))
        return [
            MT5LiveOrderType(
                ticket=str(o.get("ticket", 0)),
                symbol=str(o.get("symbol", "")),
                volume_current=float(o.get("volume_current", 0.0)),
                type=int(o.get("type", 0)),
                price_open=float(o.get("price_open", 0.0)),
                sl=float(o.get("sl", 0.0)),
                tp=float(o.get("tp", 0.0)),
                magic=int(o.get("magic", 0)),
                state=int(o.get("state", 0)),
            )
            for o in orders
        ]

    @strawberry.field
    async def mt5_positions_live(self, info: Info) -> List[MT5LivePositionType]:
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        api_key = request.query_params.get("api_key")

        current_user = await get_current_user(token=token, api_key=api_key)
        if not current_user:
            raise Exception("User not authenticated")

        positions = await mt5_service.get_live_positions(str(current_user.id))
        return [
            MT5LivePositionType(
                ticket=str(p.get("ticket", 0)),
                symbol=str(p.get("symbol", "")),
                volume=float(p.get("volume", 0.0)),
                type=int(p.get("type", 0)),
                price_open=float(p.get("price_open", 0.0)),
                price_current=float(p.get("price_current", 0.0)),
                profit=float(p.get("profit", 0.0)),
                magic=int(p.get("magic", 0)),
                sl=float(p.get("sl", 0.0)),
                tp=float(p.get("tp", 0.0)),
            )
            for p in positions
        ]

    @strawberry.field
    async def mt5_existing_login(self, info: Info) -> Optional[MT5AccountInfoType]:
        """Check if MT5 is already logged in with an existing account"""
        try:
            data = await mt5_service.check_existing_login()
            if not data:
                return None
            
            return MT5AccountInfoType(
                login=data["login"],
                server=data["server"],
                name=data["name"],
                company=data["company"],
                currency="",  # Not available from terminal_info
                balance=data["balance"],
                credit=0.0,  # Not available from terminal_info
                profit=data.get("profit", 0.0),  # Calculate from balance - equity
                equity=data["equity"],
                margin=data["margin"],
                margin_free=data["free_margin"],
                margin_level=0.0,  # Calculate: equity/margin*100
                margin_so_call=0.0,  # Not available from terminal_info
                margin_so_so=0.0,  # Not available from terminal_info
                leverage=data["leverage"],
                trade_mode=0,  # Not available from terminal_info
                limit_orders=0,  # Not available from terminal_info
                margin_so_mode=0,  # Not available from terminal_info
                trade_allowed=True,  # Not available from terminal_info
                trade_expert=True,  # Not available from terminal_info
                margin_mode=0,  # Not available from terminal_info
                currency_digits=2,  # Not available from terminal_info
                fifo_close=False,  # Not available from terminal_info
            )
        except Exception as e:
            log.error(f"Failed to check existing MT5 login: {e}")
            return None

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
