import asyncio
import json
import logging
import base64
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import subprocess
import os
from cryptography.fernet import Fernet

from app.core.config import settings
from app.models.mt5 import MT5Connection, Position, Order, Trade
from app.utils.log import log

logger = logging.getLogger(__name__)

try:
    import MetaTrader5 as mt5  # type: ignore
except Exception:
    mt5 = None

# Import at end to avoid circular dependency
def get_mt5_subscription():
    from app.routes.mt5.subscription import MT5Subscription
    return MT5Subscription


class MT5Service:
    """Service for managing MT5 connections and operations"""
    
    def __init__(self):
        self.connections: Dict[str, Dict] = {}  # user_id -> connection_info
        # Generate proper 32-byte Fernet key
        import base64
        from cryptography.fernet import Fernet
        key = Fernet.generate_key()
        self.cipher = Fernet(key)
        self._mt5_lock = asyncio.Lock()
        self._active_user_id: Optional[str] = None
        self._polling_task: Optional[asyncio.Task] = None
        self._should_poll = False

    def _ensure_mt5_available(self) -> None:
        if mt5 is None:
            raise RuntimeError(
                "MetaTrader5 Python package is not available in this environment. "
                "On Windows it typically requires 64-bit Python 3.11 (or older) + installed MT5 terminal."
            )
    
    async def check_existing_login(self) -> Optional[Dict[str, Any]]:
        """Check if MT5 is already logged in with an existing account"""
        try:
            self._ensure_mt5_available()
            
            # Try to initialize without login
            async with self._mt5_lock:
                init_ok = await asyncio.to_thread(mt5.initialize)
                if not init_ok:
                    return None
                
                # Check if already logged in
                account_info = await asyncio.to_thread(mt5.account_info)
                if account_info is None:
                    await asyncio.to_thread(mt5.shutdown)
                    return None
                
                # Get terminal info
                terminal_info = await asyncio.to_thread(mt5.terminal_info)
                
                await asyncio.to_thread(mt5.shutdown)
                
                return {
                    "login": int(getattr(account_info, "login", 0)),
                    "server": str(getattr(account_info, "server", "")),
                    "company": str(getattr(account_info, "company", "")),
                    "name": str(getattr(account_info, "name", "")),
                    "balance": float(getattr(account_info, "balance", 0.0)),
                    "equity": float(getattr(account_info, "equity", 0.0)),
                    "margin": float(getattr(account_info, "margin", 0.0)),
                    "free_margin": float(getattr(account_info, "margin_free", 0.0)),
                    "margin_level": float(getattr(account_info, "margin_level", 0.0)),
                    "leverage": int(getattr(account_info, "leverage", 1)),
                    "terminal_path": str(getattr(terminal_info, "path", "")) if terminal_info else "",
                }
        except Exception as e:
            log.error(f"Failed to check existing MT5 login: {e}")
            return None
    
    async def create_connection_record(self, user_id: str, login: str, server: str, terminal_path: str = "") -> MT5Connection:
        """Create a connection record for existing MT5 login"""
        connection = MT5Connection(
            user_id=user_id,
            account_login=login,
            server=server,
            is_connected=True,
            last_ping=datetime.now(timezone.utc),
            error_message=None,
        )
        await connection.insert()
        return connection
    
    async def adopt_existing_login(self, user_id: str) -> MT5Connection:
        """Adopt existing MT5 login and set as active user"""
        try:
            # Check if there's an existing login in MT5 terminal
            existing_data = await self.check_existing_login()
            if not existing_data:
                raise Exception("No existing MT5 login found")
            
            # Set this user as active in MT5 service
            self._active_user_id = user_id
            
            # Create or update connection record
            connection = await self.create_connection_record(
                user_id=user_id,
                login=str(existing_data["login"]),
                server=existing_data["server"],
                terminal_path=existing_data.get("terminal_path", "")
            )
            
            return connection
        except Exception as e:
            log.error(f"Failed to adopt existing MT5 login: {e}")
            raise Exception(str(e))
    
    async def start_polling(self, user_id: str):
        """Start background polling for MT5 data updates"""
        if self._polling_task and not self._polling_task.done():
            return
        
        self._should_poll = True
        self._polling_task = asyncio.create_task(self._poll_mt5_data(user_id))
        log.info(f"Started MT5 data polling for user {user_id}")
    
    async def stop_polling(self):
        """Stop background polling"""
        self._should_poll = False
        if self._polling_task:
            self._polling_task.cancel()
            try:
                await self._polling_task
            except asyncio.CancelledError:
                pass
        log.info("Stopped MT5 data polling")
    
    async def _poll_mt5_data(self, user_id: str):
        """Background task to poll MT5 data and publish updates"""
        MT5Subscription = get_mt5_subscription()
        
        while self._should_poll:
            try:
                if await self._is_connected(user_id):
                    # Poll positions
                    positions = await self.get_live_positions(user_id)
                    if positions:
                        await MT5Subscription.publish_positions_update(user_id, positions)
                    
                    # Poll orders
                    orders = await self.get_live_orders(user_id)
                    if orders:
                        await MT5Subscription.publish_orders_update(user_id, orders)
                    
                    # Poll account info
                    account_info = await self.get_live_account_info(user_id)
                    if account_info:
                        await MT5Subscription.publish_account_update(user_id, account_info)
                
                # Wait 5 seconds before next poll
                await asyncio.sleep(5)
            except Exception as e:
                log.error(f"Error in MT5 polling: {e}")
                await asyncio.sleep(5)
    
    def encrypt_credentials(self, login: str, password: str) -> str:
        """Encrypt MT5 credentials for storage"""
        credentials = f"{login}:{password}"
        encrypted = self.cipher.encrypt(credentials.encode())
        return base64.b64encode(encrypted).decode()
    
    def decrypt_credentials(self, encrypted_credentials: str) -> tuple[str, str]:
        """Decrypt MT5 credentials from storage"""
        try:
            encrypted = base64.b64decode(encrypted_credentials.encode())
            decrypted = self.cipher.decrypt(encrypted).decode()
            login, password = decrypted.split(':', 1)
            return login, password
        except Exception as e:
            log.error(f"Failed to decrypt credentials: {e}")
            raise ValueError("Invalid credentials format")
    
    async def connect_mt5(
        self,
        user_id: str,
        login: str,
        password: str,
        server: str,
        path: Optional[str] = None,
    ) -> bool:
        """Connect to MT5 terminal"""
        connection: Optional[MT5Connection] = None
        try:
            self._ensure_mt5_available()

            encrypted_credentials = self.encrypt_credentials(login, password)

            existing = await MT5Connection.find_one({"user_id": user_id})
            if existing:
                connection = existing
                connection.account_login = login
                connection.server = server
                connection.is_connected = False
                connection.error_message = None
                await connection.save()
            else:
                connection = MT5Connection(
                    user_id=user_id,
                    account_login=login,
                    server=server,
                    is_connected=False,
                )
                await connection.insert()

            async with self._mt5_lock:
                if self._active_user_id is not None and self._active_user_id != user_id:
                    raise RuntimeError("MT5 terminal is already in use by another user session")

                mt5_path = path or getattr(settings, "MT5_TERMINAL_PATH", "") or self._get_mt5_path()

                init_ok = await asyncio.to_thread(mt5.initialize, mt5_path if mt5_path else None)
                if not init_ok:
                    raise RuntimeError(f"MT5 initialize failed: {mt5.last_error()}")

                login_ok = await asyncio.to_thread(mt5.login, int(login), password, server)
                if not login_ok:
                    await asyncio.to_thread(mt5.shutdown)
                    raise RuntimeError(f"MT5 login failed: {mt5.last_error()}")

                acc = await asyncio.to_thread(mt5.account_info)
                if acc is None:
                    await asyncio.to_thread(mt5.shutdown)
                    raise RuntimeError(f"MT5 account_info failed: {mt5.last_error()}")

                self._active_user_id = user_id

            log.info(f"MT5 connected for user {user_id} with login {login}")

            connection.is_connected = True
            connection.last_ping = datetime.now(timezone.utc)
            await connection.save()

            self.connections[user_id] = {
                "login": login,
                "server": server,
                "connected_at": datetime.now(timezone.utc),
                "encrypted_credentials": encrypted_credentials,
            }

            log.info(f"MT5 connected for user {user_id}")
            return True

        except Exception as e:
            log.error(f"Failed to connect MT5 for user {login}  {password} {e}")
            if connection:
                connection.is_connected = False
                connection.error_message = str(e)
                await connection.save()
            return False
    
    async def disconnect_mt5(self, user_id: str) -> bool:
        """Disconnect from MT5 terminal"""
        try:
            if mt5 is not None:
                async with self._mt5_lock:
                    if self._active_user_id == user_id:
                        await asyncio.to_thread(mt5.shutdown)
                        self._active_user_id = None

            # Update connection status
            connection = await MT5Connection.find_one({"user_id": user_id})
            if connection:
                connection.is_connected = False
                await connection.save()
            
            # Remove from active connections
            if user_id in self.connections:
                del self.connections[user_id]
            
            log.info(f"MT5 disconnected for user {user_id}")
            return True
            
        except Exception as e:
            log.error(f"Failed to disconnect MT5 for user {user_id}: {e}")
            return False
    
    async def get_live_account_info(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Read current account info from MT5 terminal"""
        try:
            self._ensure_mt5_available()
            if not await self._is_connected(user_id):
                return None

            async with self._mt5_lock:
                if self._active_user_id != user_id:
                    return None
                acc = await asyncio.to_thread(mt5.account_info)

            if acc is None:
                return None
            # log.info(acc)
            # AccountInfo(
            #     login=272918370, 
            #     trade_mode=0, 
            #     leverage=2000000000, 
            #     limit_orders=1024, 
            #     margin_so_mode=0, 
            #     trade_allowed=True, 
            #     trade_expert=True, 
            #     margin_mode=2, 
            #     currency_digits=2, 
            #     fifo_close=False,
            #     balance=38.45,
            #     credit=0.0,
            #     profit=-7.36, 
            #     equity=31.09, 
            #     margin=4.51, 
            #     margin_free=26.58, 
            #     margin_level=689.3569844789357, 
            #     margin_so_call=60.0, 
            #     margin_so_so=0.0, 
            #     margin_initial=0.0, 
            #     margin_maintenance=0.0, 
            #     assets=0.0, 
            #     liabilities=0.0, 
            #     commission_blocked=0.0, 
            #     name='Standard', 
            #     server='Exness-MT5Trial14', 
            #     currency='USD', 
            #     company='Exness Technologies Ltd'
            # )

            await MT5Connection.find_one({"user_id": user_id}).update(
                {"$set": {"last_ping": datetime.now(timezone.utc)}},
            )

            return {
                "login": int(getattr(acc, "login", 0)),
                "server": str(getattr(acc, "server", "")),
                "name": str(getattr(acc, "name", "")),
                "company": str(getattr(acc, "company", "")),
                "currency": str(getattr(acc, "currency", "")),
                "balance": float(getattr(acc, "balance", 0.0)),
                "credit": float(getattr(acc, "credit", 0.0)),
                "profit": float(getattr(acc, "profit", 0.0)),
                "equity": float(getattr(acc, "equity", 0.0)),
                "margin": float(getattr(acc, "margin", 0.0)),
                "margin_free": float(getattr(acc, "margin_free", 0.0)),
                "margin_level": float(getattr(acc, "margin_level", 0.0)),
                "margin_so_call": float(getattr(acc, "margin_so_call", 0.0)),
                "margin_so_so": float(getattr(acc, "margin_so_so", 0.0)),
                "leverage": int(getattr(acc, "leverage", 0)),
                "trade_mode": int(getattr(acc, "trade_mode", 0)),
                "limit_orders": int(getattr(acc, "limit_orders", 0)),
                "margin_so_mode": int(getattr(acc, "margin_so_mode", 0)),
                "trade_allowed": bool(getattr(acc, "trade_allowed", False)),
                "trade_expert": bool(getattr(acc, "trade_expert", False)),
                "margin_mode": int(getattr(acc, "margin_mode", 0)),
                "currency_digits": int(getattr(acc, "currency_digits", 0)),
                "fifo_close": bool(getattr(acc, "fifo_close", False)),
            }
        except Exception as e:
            log.error(f"Failed to get MT5 account info for user {user_id}: {e}")
            return None

    async def get_live_positions(self, user_id: str) -> List[Dict[str, Any]]:
        """Read current open positions directly from MT5 terminal"""
        try:
            self._ensure_mt5_available()
            if not await self._is_connected(user_id):
                return []

            async with self._mt5_lock:
                if self._active_user_id != user_id:
                    return []
                positions = await asyncio.to_thread(mt5.positions_get)

            if not positions:
                return []

            await MT5Connection.find_one({"user_id": user_id}).update(
                {"$set": {"last_ping": datetime.now(timezone.utc)}},
            )

            result: List[Dict[str, Any]] = []
            for p in positions:
                result.append(
                    {
                        "ticket": str(getattr(p, "ticket", 0)),
                        "symbol": str(getattr(p, "symbol", "")),
                        "volume": float(getattr(p, "volume", 0.0)),
                        "type": int(getattr(p, "type", 0)),
                        "price_open": float(getattr(p, "price_open", 0.0)),
                        "price_current": float(getattr(p, "price_current", 0.0)),
                        "profit": float(getattr(p, "profit", 0.0)),
                        "magic": int(getattr(p, "magic", 0)),
                        "sl": float(getattr(p, "sl", 0.0)),
                        "tp": float(getattr(p, "tp", 0.0)),
                    }
                )
            
            # Publish real-time update
            MT5Subscription = get_mt5_subscription()
            await MT5Subscription.publish_positions_update(user_id, result)
            
            return result
        except Exception as e:
            log.error(f"Failed to get MT5 positions for user {user_id}: {e}")
            return []

    async def get_live_orders(self, user_id: str) -> List[Dict[str, Any]]:
        """Read current pending orders directly from MT5 terminal"""
        try:
            self._ensure_mt5_available()
            if not await self._is_connected(user_id):
                return []

            async with self._mt5_lock:
                if self._active_user_id != user_id:
                    return []
                orders = await asyncio.to_thread(mt5.orders_get)

            if not orders:
                return []

            await MT5Connection.find_one({"user_id": user_id}).update(
                {"$set": {"last_ping": datetime.now(timezone.utc)}},
            )

            result: List[Dict[str, Any]] = []
            for o in orders:
                result.append(
                    {
                        "ticket": str(getattr(o, "ticket", 0)),
                        "symbol": str(getattr(o, "symbol", "")),
                        "volume_current": float(getattr(o, "volume_current", 0.0)),
                        "type": int(getattr(o, "type", 0)),
                        "price_open": float(getattr(o, "price_open", 0.0)),
                        "sl": float(getattr(o, "sl", 0.0)),
                        "tp": float(getattr(o, "tp", 0.0)),
                        "magic": int(getattr(o, "magic", 0)),
                        "state": int(getattr(o, "state", 0)),
                    }
                )
            
            # Publish real-time update
            MT5Subscription = get_mt5_subscription()
            await MT5Subscription.publish_orders_update(user_id, result)
            
            return result
        except Exception as e:
            log.error(f"Failed to get MT5 orders for user {user_id}: {e}")
            return []
    
    async def place_order(self, user_id: str, order_data: Dict[str, Any]) -> Optional[Order]:
        """Place order through MT5"""
        try:
            if not await self._is_connected(user_id):
                raise Exception("MT5 not connected")
            
            # Create order record
            order = Order(
                symbol=order_data["symbol"],
                volume=order_data["volume"],
                type=order_data["type"],
                price=order_data["price"],
                sl=order_data.get("sl"),
                tp=order_data.get("tp"),
                user_id=user_id,
                ticket_id=order_data.get("ticket_id"),
                magic=order_data.get("magic")
            )
            await order.insert()
            
            # TODO: Send actual order to MT5 terminal
            # For now, simulate order placement
            await asyncio.sleep(1)
            
            # Update order status
            order.status = "FILLED"
            order.filled_at = datetime.now(timezone.utc)
            await order.save()
            
            log.info(f"Order placed for user {user_id}: {order.symbol}")
            return order
            
        except Exception as e:
            log.error(f"Failed to place order for user {user_id}: {e}")
            return None
    
    async def close_position(self, user_id: str, position_id: str) -> bool:
        """Close position through MT5"""
        try:
            self._ensure_mt5_available()
            if not await self._is_connected(user_id):
                raise Exception("MT5 not connected")
            
            async with self._mt5_lock:
                if self._active_user_id != user_id:
                    raise Exception("MT5 not connected for this user")
                
                # Check if AutoTrading is enabled
                terminal_info = await asyncio.to_thread(mt5.terminal_info)
                if not terminal_info.trade_allowed:
                    raise Exception("AutoTrading is disabled in MT5 terminal. Please enable AutoTrading in MT5 settings: Go to MT5 terminal -> Tools -> Options -> Expert Advisors -> Enable 'Allow algorithmic trading'")
                
                # Get position from MT5 terminal
                positions = await asyncio.to_thread(mt5.positions_get)
                target_position = None
                for p in positions:
                    if str(getattr(p, "ticket", 0)) == position_id:
                        target_position = p
                        break
                
                if not target_position:
                    raise Exception("Position not found in MT5 terminal")
                
                # Close position on MT5 terminal
                result = await asyncio.to_thread(
                    mt5.order_send, 
                    {
                        "action": mt5.TRADE_ACTION_DEAL,
                        "symbol": getattr(target_position, "symbol"),
                        "volume": getattr(target_position, "volume"),
                        "type": mt5.ORDER_TYPE_SELL if getattr(target_position, "type") == mt5.POSITION_TYPE_BUY else mt5.ORDER_TYPE_BUY,
                        "position": int(position_id),
                        "price": getattr(target_position, "price_current"),
                        "deviation": 20,
                        "magic": getattr(target_position, "magic", 0),
                        "comment": "Close position",
                        "type_time": mt5.ORDER_TIME_GTC,
                        "type_filling": mt5.ORDER_FILLING_IOC,
                    }
                )
                
                if result.retcode != mt5.TRADE_RETCODE_DONE:
                    error_msg = f"MT5 close failed: {result.comment}"
                    if "AutoTrading disabled" in result.comment:
                        error_msg += "\n\nTo fix: Go to MT5 terminal -> Tools -> Options -> Expert Advisors -> Enable 'Allow algorithmic trading'"
                    raise Exception(error_msg)
                
                # Create trade record
                trade = Trade(
                    symbol=getattr(target_position, "symbol"),
                    volume=getattr(target_position, "volume"),
                    type="BUY" if getattr(target_position, "type") == mt5.POSITION_TYPE_SELL else "SELL",
                    price=getattr(target_position, "price_current"),
                    profit=getattr(target_position, "profit"),
                    commission=0.0,  # TODO: Get from result
                    swap=0.0,  # TODO: Get from result
                    user_id=user_id,
                    ticket_id=position_id,
                    magic=getattr(target_position, "magic", 0),
                    open_time=datetime.now(timezone.utc),  # TODO: Get actual open time
                    close_time=datetime.now(timezone.utc)
                )
                await trade.insert()
            
            log.info(f"Position {position_id} closed for user {user_id}")
            return True
            
        except Exception as e:
            # Don't log here - let mutation handle logging to avoid duplicates
            raise Exception(e)
    
    async def get_positions(self, user_id: str) -> List[Position]:
        """Get all positions for user"""
        try:
            if not await self._is_connected(user_id):
                return []
            
            positions = await Position.find({"user_id": user_id}).to_list()
            
            # TODO: Sync with actual MT5 positions
            # For now, return stored positions
            
            return positions
            
        except Exception as e:
            log.error(f"Failed to get positions for user {user_id}: {e}")
            return []
    
    async def get_connection_status(self, user_id: str) -> Optional[MT5Connection]:
        """Get MT5 connection status for user"""
        try:
            connection = await MT5Connection.find_one({"user_id": user_id})
            return connection
        except Exception as e:
            log.error(f"Failed to get connection status for user {user_id}: {e}")
            return None
    
    async def _is_connected(self, user_id: str) -> bool:
        """Check if user is connected to MT5"""
        # First check if this user is the active session
        if self._active_user_id != user_id:
            return False
        
        # Then check database connection record
        connection = await self.get_connection_status(user_id)
        return connection.is_connected if connection else False
    
    def _get_mt5_path(self) -> Optional[str]:
        """Get MT5 terminal path"""
        # Common MT5 installation paths
        possible_paths = [
            r"C:\Program Files\MetaTrader 5\terminal64.exe",
            r"C:\Program Files (x86)\MetaTrader 5\terminal64.exe",
            os.path.expanduser("~/mt5/terminal64.exe"),
            "/usr/bin/mt5/terminal64.exe"  # Linux path
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                return path
        
        return None


# Global MT5 service instance
mt5_service = MT5Service()
