import strawberry
from strawberry.types import Info
from typing import Optional, List
from datetime import datetime

from app.utils.log import log
from app.schemas.settings import TradingSettingsType
from app.schemas.trading import TradingType
from app.models.trading import Trading
from app.models.settings import Settings, setting_name


@strawberry.type
class TradingQuery:
    @strawberry.field
    async def trades(
        self, 
    ) -> Optional[List[TradingType]]:
        """
        Lấy danh sách trades
        """
        docs = await Trading.find_all()
        
        if not docs:
            return None
        
        return [TradingType(
            symbol=doc.symbol,
            time=doc.time,
            last_price=doc.last_price,
            buys=doc.buys,
            sells=doc.sells
        ) for doc in docs]
    
    @strawberry.field
    async def get_settings(self, info: Info) -> TradingSettingsType:
        """
        Lấy settings hiện tại của trading service.
        Không cần quyền admin.
        
        Returns:
            TradingSettingsType: Settings hiện tại
        """
        current_settings = await Settings.find_by_name(name=setting_name)
        
        if not current_settings:
            raise Exception(f"Settings '{setting_name}' không tồn tại")
        
        return TradingSettingsType(
            name=current_settings.name,
        )
