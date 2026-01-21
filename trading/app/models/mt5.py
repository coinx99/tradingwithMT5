from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from beanie import Document, Indexed
from pymongo import IndexModel
import json
import base64
from cryptography.fernet import Fernet


class MT5Account(BaseModel):
    """MT5 Account credentials"""
    login: str
    password: str
    server: str = Field(default="MetaQuotes-Demo")  # Default MT5 demo server
    path: str = Field(default="")  # MT5 terminal path


class Position(Document):
    """Trading Position Model"""
    symbol: str = Indexed()
    volume: float
    type: str  # BUY/SELL
    price_open: float
    price_current: float = 0.0
    profit: float = 0.0
    user_id: str = Indexed()
    ticket_id: Optional[str] = None
    magic: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "positions"
        

class Order(Document):
    """Trading Order Model"""
    symbol: str = Indexed()
    volume: float
    type: str  # BUY/SELL
    price: float
    sl: Optional[float] = None
    tp: Optional[float] = None
    status: str = "PENDING"  # PENDING/FILLED/CANCELLED
    user_id: str = Indexed()
    ticket_id: Optional[str] = None
    magic: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    filled_at: Optional[datetime] = None
    
    class Settings:
        name = "orders"


class Trade(Document):
    """Trade History Model"""
    symbol: str = Indexed()
    volume: float
    type: str  # BUY/SELL
    price: float
    profit: float
    commission: float
    swap: float
    user_id: str = Indexed()
    ticket_id: Optional[str] = None
    magic: Optional[int] = None
    open_time: datetime
    close_time: Optional[datetime] = None
    
    class Settings:
        name = "trades"


class MT5Connection(Document):
    """MT5 Connection Status"""
    user_id: str = Indexed()
    account_login: str
    server: str
    is_connected: bool = False
    last_ping: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "mt5_connections"
        use_state_management = True
        indexes = [
            IndexModel([("server", 1), ("account_login", 1)], unique=True),
        ]
