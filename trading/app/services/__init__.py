import asyncio
from colorama import Fore

from app.db.init_db import db
from app.utils.log import log
from app.utils.timeframe import Timeframe, count_subcandles
from app.core.config import settings, get_market_types, get_timeframes
from app.models.settings import Settings, create_settings, load_settings
from app.utils.types import MarketTypeEnum
from app.services.collect_dataset import CollectDatasetService



async def run_services():
    """
    Khởi động các services của ứng dụng.
    """
    r = await load_settings()

    collect_dataset_service = CollectDatasetService()
    await collect_dataset_service.import_month("BTCUSDT", "spot", 12, 2025)

