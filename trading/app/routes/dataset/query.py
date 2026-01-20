import strawberry
from strawberry.types import Info
from typing import Optional, List
from datetime import datetime

from app.utils.log import log
from app.schemas.settings import DatasetSettingsType
from app.schemas.dataset import DatasetType
from app.models.dataset import Dataset
from app.models.settings import Settings, setting_name


@strawberry.type
class DatasetQuery:
    @strawberry.field
    async def dataset(
        self, 
        symbol: str,
        time: datetime
    ) -> Optional[DatasetType]:
        """
        Tìm một dataset document theo symbol và time chính xác.
        
        Args:
            symbol: Symbol cần tìm (vd: BTCUSDT)
            time: Thời gian chính xác cần tìm
            
        Returns:
            DatasetType hoặc None nếu không tìm thấy
        """
        doc = await Dataset.find_by_symbol_and_time(symbol, time)
        
        if not doc:
            return None
        
        return DatasetType(
            symbol=doc.symbol,
            time=doc.time,
            last_price=doc.last_price,
            buys=doc.buys,
            sells=doc.sells
        )
    
    @strawberry.field
    async def dataset_nearest(
        self,
        symbol: str,
        time: datetime
    ) -> Optional[DatasetType]:
        """
        Tìm dataset document gần nhất với time được chỉ định.
        Nếu không có document chính xác tại time đó, sẽ tìm document gần nhất (trước hoặc sau).
        
        Args:
            symbol: Symbol cần tìm (vd: BTCUSDT)
            time: Thời gian tham chiếu
            
        Returns:
            DatasetType của document gần nhất hoặc None nếu không có document nào
        """
        doc = await Dataset.find_nearest_by_symbol_and_time(symbol, time)
        
        if not doc:
            return None
        
        return DatasetType(
            symbol=doc.symbol,
            time=doc.time,
            last_price=doc.last_price,
            buys=doc.buys,
            sells=doc.sells
        )
    
    @strawberry.field
    async def datasets(
        self,
        symbol: str,
        limit: int = 100
    ) -> List[DatasetType]:
        """
        Tìm nhiều dataset documents theo symbol, sắp xếp theo time giảm dần.
        
        Args:
            symbol: Symbol cần tìm (vd: BTCUSDT)
            limit: Số lượng documents tối đa trả về (mặc định 100)
            
        Returns:
            List các DatasetType
        """
        docs = await Dataset.find_by_symbol(symbol, limit)
        
        return [
            DatasetType(
                symbol=doc.symbol,
                time=doc.time,
                last_price=doc.last_price,
                buys=doc.buys,
                sells=doc.sells
            )
            for doc in docs
        ]

    @strawberry.field
    async def get_dataset_settings(self, info: Info) -> DatasetSettingsType:
        """
        Lấy settings hiện tại của dataset service.
        Không cần quyền admin.
        
        Returns:
            DatasetSettingsType: Settings hiện tại
        """
        current_settings = await Settings.find_by_name(name=setting_name)
        
        if not current_settings:
            raise Exception(f"Settings '{setting_name}' không tồn tại")
        
        return DatasetSettingsType(
            name=current_settings.name,
        )
