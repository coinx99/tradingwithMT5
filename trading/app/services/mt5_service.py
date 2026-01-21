import asyncio
import json
import logging
import base64
from typing import Optional, Dict, Any, List
from datetime import datetime
import subprocess
import os
from cryptography.fernet import Fernet

from app.core.config import settings
from app.models.mt5 import MT5Connection, Position, Order, Trade
from app.utils.log import log

logger = logging.getLogger(__name__)


class MT5Service:
    """Service for managing MT5 connections and operations"""
    
    def __init__(self):
        self.connections: Dict[str, Dict] = {}  # user_id -> connection_info
        # Generate proper 32-byte Fernet key
        import base64
        from cryptography.fernet import Fernet
        key = Fernet.generate_key()
        self.cipher = Fernet(key)
    
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
    
    async def connect_mt5(self, user_id: str, login: str, password: str, server: str) -> bool:
        """Connect to MT5 terminal"""
        try:
            # Store encrypted credentials
            encrypted_credentials = self.encrypt_credentials(login, password)
            
            # For simulation, skip MT5 path check
            # mt5_path = self._get_mt5_path()
            # if not mt5_path:
            #     raise Exception("MT5 terminal not found")
            
            # Create connection record
            connection = MT5Connection(
                user_id=user_id,
                account_login=login,
                server=server,
                is_connected=False
            )
            await connection.insert()
            
            # For now, simulate connection (in real implementation, this would use MT5 API)
            # TODO: Implement actual MT5 Web API integration
            await asyncio.sleep(2)  # Simulate connection time
            
            # Update connection status
            connection.is_connected = True
            connection.last_ping = datetime.utcnow()
            await connection.save()
            
            self.connections[user_id] = {
                "login": login,
                "server": server,
                "connected_at": datetime.utcnow(),
                "encrypted_credentials": encrypted_credentials
            }
            
            log.info(f"MT5 connected for user {user_id}")
            return True
            
        except Exception as e:
            log.error(f"Failed to connect MT5 for user {user_id}: {e}")
            # Update connection with error
            if 'connection' in locals():
                connection.is_connected = False
                connection.error_message = str(e)
                await connection.save()
            return False
    
    async def disconnect_mt5(self, user_id: str) -> bool:
        """Disconnect from MT5 terminal"""
        try:
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
            order.filled_at = datetime.utcnow()
            await order.save()
            
            log.info(f"Order placed for user {user_id}: {order.symbol}")
            return order
            
        except Exception as e:
            log.error(f"Failed to place order for user {user_id}: {e}")
            return None
    
    async def close_position(self, user_id: str, position_id: str) -> bool:
        """Close position through MT5"""
        try:
            if not await self._is_connected(user_id):
                raise Exception("MT5 not connected")
            
            # Find position
            position = await Position.get(position_id)
            if not position or position.user_id != user_id:
                raise Exception("Position not found")
            
            # TODO: Send close command to MT5 terminal
            # For now, simulate position closing
            await asyncio.sleep(1)
            
            # Create trade record
            trade = Trade(
                symbol=position.symbol,
                volume=position.volume,
                type=position.type,
                price=position.price_open,
                profit=position.profit,
                commission=0.0,  # TODO: Get from MT5
                swap=0.0,  # TODO: Get from MT5
                user_id=user_id,
                ticket_id=position.ticket_id,
                magic=position.magic,
                open_time=position.created_at,
                close_time=datetime.utcnow()
            )
            await trade.insert()
            
            # Delete position
            await position.delete()
            
            log.info(f"Position closed for user {user_id}: {position.symbol}")
            return True
            
        except Exception as e:
            log.error(f"Failed to close position for user {user_id}: {e}")
            return False
    
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
