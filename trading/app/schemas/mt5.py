
from typing import Optional
import strawberry

@strawberry.type
class MT5AccountInfoType:
    login: int
    server: str
    name: str
    company: str
    currency: str
    balance: float
    credit: float
    profit: float
    equity: float
    margin: float
    margin_free: float
    margin_level: float
    margin_so_call: float
    margin_so_so: float
    leverage: int
    trade_mode: int
    limit_orders: int
    margin_so_mode: int
    trade_allowed: bool
    trade_expert: bool
    margin_mode: int
    currency_digits: int
    fifo_close: bool


@strawberry.type
class MT5LivePositionType:
    ticket: str
    symbol: str
    volume: float
    type: int
    price_open: float
    price_current: float
    profit: float
    magic: int
    sl: float
    tp: float


@strawberry.type
class MT5LiveOrderType:
    ticket: str
    symbol: str
    volume_current: float
    type: int
    price_open: float
    sl: float
    tp: float
    magic: int
    state: int



@strawberry.input
class MT5AccountInput:
    login: str
    password: str
    server: str = "MetaQuotes-Demo"
    path: Optional[str] = None


@strawberry.input
class OrderInput:
    symbol: str
    volume: float
    type: str  # BUY/SELL
    price: float
    sl: Optional[float] = None
    tp: Optional[float] = None
    ticket_id: Optional[str] = None
    magic: Optional[int] = None


@strawberry.type
class OrderType:
    id: str
    symbol: str
    volume: float
    type: str
    price: float
    sl: Optional[float]
    tp: Optional[float]
    status: str
    ticket_id: Optional[str]
    magic: Optional[int]
    created_at: str
    filled_at: Optional[str]


@strawberry.type
class PositionType:
    id: str
    symbol: str
    volume: float
    type: str
    price_open: float
    price_current: float
    profit: float
    ticket_id: Optional[str]
    magic: Optional[int]
    created_at: str
    updated_at: str


@strawberry.type
class TradeType:
    id: str
    symbol: str
    volume: float
    type: str
    price: float
    profit: float
    commission: float
    swap: float
    ticket_id: Optional[str]
    magic: Optional[int]
    open_time: str
    close_time: Optional[str]


@strawberry.type
class MT5ConnectionType:
    id: str
    account_login: str
    server: str
    is_connected: bool
    last_ping: Optional[str]
    error_message: Optional[str]
    created_at: str


@strawberry.type
class MT5PositionUpdate:
    ticket: str
    symbol: str
    volume: float
    type: int
    price_open: float
    price_current: float
    profit: float
    magic: int
    sl: float
    tp: float


@strawberry.type
class MT5OrderUpdate:
    ticket: str
    symbol: str
    volume_current: float
    type: int
    price_open: float
    sl: float
    tp: float
    magic: int
    state: int


@strawberry.type
class MT5AccountUpdate:
    login: int
    server: str
    name: str
    company: str
    currency: str
    balance: float
    credit: float
    profit: float
    equity: float
    margin: float
    margin_free: float
    margin_level: float
    margin_so_call: float
    margin_so_so: float
    leverage: int
    trade_mode: int
    limit_orders: int
    margin_so_mode: int
    trade_allowed: bool
    trade_expert: bool
    margin_mode: int
    currency_digits: int
    fifo_close: bool

