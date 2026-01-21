import asyncio
from typing import Dict, Any, AsyncGenerator
import strawberry
from strawberry.types import Info

from app.services.mt5_service import mt5_service
from app.routes.deps import get_current_user
from app.utils.log import log


@strawberry.type
class MT5SubscriptionInternal:
    """MT5 real-time data subscriptions"""
    
    _subscribers: Dict[str, Any] = strawberry.field(default_factory=dict)
    
    @classmethod
    async def publish_positions_update(cls, user_id: str, positions: list):
        """Publish positions update to subscribed clients"""
        message = {
            "type": "positions_update",
            "user_id": user_id,
            "data": positions
        }
        await cls._publish_to_subscribers(user_id, message)
    
    @classmethod
    async def publish_orders_update(cls, user_id: str, orders: list):
        """Publish orders update to subscribed clients"""
        message = {
            "type": "orders_update", 
            "user_id": user_id,
            "data": orders
        }
        await cls._publish_to_subscribers(user_id, message)
    
    @classmethod
    async def publish_account_update(cls, user_id: str, account_info: dict):
        """Publish account info update to subscribed clients"""
        message = {
            "type": "account_update",
            "user_id": user_id,
            "data": account_info
        }
        await cls._publish_to_subscribers(user_id, message)
    
    @classmethod
    async def _publish_to_subscribers(cls, user_id: str, message: dict):
        """Publish message to all subscribers for a user"""
        for subscriber_id, subscriber in cls._subscribers.items():
            if subscriber.get("user_id") == user_id:
                try:
                    await subscriber["queue"].put(message)
                except Exception as e:
                    log.error(f"Failed to publish to subscriber {subscriber_id}: {e}")


@strawberry.type
class Subscription:
    @strawberry.subscription
    async def mt5_positions_updates(self, info: Info) -> AsyncGenerator[MT5PositionUpdate, None]:
        """Subscribe to real-time MT5 positions updates"""
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        api_key = request.query_params.get("api_key")

        current_user = await get_current_user(token=token, api_key=api_key)
        if not current_user:
            raise Exception("User not authenticated")

        user_id = str(current_user.id)
        subscriber_id = f"positions_{user_id}_{id(asyncio.current_task())}"
        
        # Create queue for this subscriber
        queue = asyncio.Queue()
        
        # Store subscriber
        MT5SubscriptionInternal._subscribers[subscriber_id] = {
            "user_id": user_id,
            "queue": queue,
            "type": "positions"
        }
        
        try:
            while True:
                message = await queue.get()
                if message.get("type") == "positions_update":
                    positions = message.get("data", [])
                    for pos in positions:
                        yield MT5PositionUpdate(
                            ticket=str(pos.get("ticket", 0)),
                            symbol=str(pos.get("symbol", "")),
                            volume=float(pos.get("volume", 0.0)),
                            type=int(pos.get("type", 0)),
                            price_open=float(pos.get("price_open", 0.0)),
                            price_current=float(pos.get("price_current", 0.0)),
                            profit=float(pos.get("profit", 0.0)),
                            magic=int(pos.get("magic", 0)),
                            sl=float(pos.get("sl", 0.0)),
                            tp=float(pos.get("tp", 0.0)),
                        )
        except Exception as e:
            log.error(f"Error in positions subscription: {e}")
        finally:
            # Clean up subscriber
            MT5SubscriptionInternal._subscribers.pop(subscriber_id, None)
    
    @strawberry.subscription
    async def mt5_orders_updates(self, info: Info) -> AsyncGenerator[MT5OrderUpdate, None]:
        """Subscribe to real-time MT5 orders updates"""
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        api_key = request.query_params.get("api_key")

        current_user = await get_current_user(token=token, api_key=api_key)
        if not current_user:
            raise Exception("User not authenticated")

        user_id = str(current_user.id)
        subscriber_id = f"orders_{user_id}_{id(asyncio.current_task())}"
        
        # Create queue for this subscriber
        queue = asyncio.Queue()
        
        # Store subscriber
        MT5SubscriptionInternal._subscribers[subscriber_id] = {
            "user_id": user_id,
            "queue": queue,
            "type": "orders"
        }
        
        try:
            while True:
                message = await queue.get()
                if message.get("type") == "orders_update":
                    orders = message.get("data", [])
                    for order in orders:
                        yield MT5OrderUpdate(
                            ticket=str(order.get("ticket", 0)),
                            symbol=str(order.get("symbol", "")),
                            volume_current=float(order.get("volume_current", 0.0)),
                            type=int(order.get("type", 0)),
                            price_open=float(order.get("price_open", 0.0)),
                            sl=float(order.get("sl", 0.0)),
                            tp=float(order.get("tp", 0.0)),
                            magic=int(order.get("magic", 0)),
                            state=int(order.get("state", 0)),
                        )
        except Exception as e:
            log.error(f"Error in orders subscription: {e}")
        finally:
            # Clean up subscriber
            MT5SubscriptionInternal._subscribers.pop(subscriber_id, None)
    
    @strawberry.subscription
    async def mt5_account_updates(self, info: Info) -> AsyncGenerator[MT5AccountUpdate, None]:
        """Subscribe to real-time MT5 account info updates"""
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        api_key = request.query_params.get("api_key")

        current_user = await get_current_user(token=token, api_key=api_key)
        if not current_user:
            raise Exception("User not authenticated")

        user_id = str(current_user.id)
        subscriber_id = f"account_{user_id}_{id(asyncio.current_task())}"
        
        # Create queue for this subscriber
        queue = asyncio.Queue()
        
        # Store subscriber
        MT5SubscriptionInternal._subscribers[subscriber_id] = {
            "user_id": user_id,
            "queue": queue,
            "type": "account"
        }
        
        try:
            while True:
                message = await queue.get()
                if message.get("type") == "account_update":
                    data = message.get("data", {})
                    yield MT5AccountUpdate(
                        login=int(data.get("login", 0)),
                        server=str(data.get("server", "")),
                        name=str(data.get("name", "")),
                        company=str(data.get("company", "")),
                        currency=str(data.get("currency", "")),
                        balance=float(data.get("balance", 0.0)),
                        equity=float(data.get("equity", 0.0)),
                        margin=float(data.get("margin", 0.0)),
                        margin_free=float(data.get("margin_free", 0.0)),
                        leverage=int(data.get("leverage", 1)),
                    )
        except Exception as e:
            log.error(f"Error in account subscription: {e}")
        finally:
            # Clean up subscriber
            MT5SubscriptionInternal._subscribers.pop(subscriber_id, None)
