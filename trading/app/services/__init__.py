import asyncio
from colorama import Fore

from app.db.init_db import db
from app.utils.log import log
from app.utils.timeframe import Timeframe, count_subcandles
from app.core.config import settings
from app.models.settings import Settings, create_settings, load_settings
from app.utils.types import MarketTypeEnum
from .mt5_service import mt5_service



async def run_services():
    """
    Khởi động các services của ứng dụng.
    """
    r = await load_settings()
