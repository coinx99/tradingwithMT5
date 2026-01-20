import strawberry
from strawberry.types import Info
from typing import Optional
from colorama import Fore
import os

from app.schemas.dataset import DatasetType
from app.schemas.settings import DatasetSettingsInput, DatasetSettingsType
from app.models.settings import Settings, setting_name
from app.routes.deps import require_superuser
from app.utils.log import log


@strawberry.type
class DatasetMutation:
    @strawberry.mutation
    @require_superuser
    async def update_dataset_settings(
        self,
        info: Info,
        settings_input: DatasetSettingsInput
    ) -> DatasetSettingsType:
        """
        Cập nhật settings của Dataset service.
        Chỉ admin mới có quyền thực hiện.
        
        Args:
            settings_input: Các thông số cần cập nhật
            
        Returns:
            DatasetSettingsType: Settings sau khi cập nhật
        """
        # Lấy settings hiện tại
        current_settings = await Settings.find_by_name(name=setting_name)
        
        if not current_settings:
            raise Exception(f"Settings '{setting_name}' không tồn tại")
        
        # Cập nhật các field nếu được cung cấp
        updated = False 
        # Lưu vào database nếu có thay đổi
        if updated:
            await current_settings.save()
            log.info(f"{Fore.GREEN}✅ Đã lưu settings vào database")
        else:
            log.info(f"{Fore.YELLOW}⚠️ Không có thay đổi nào")
        
        # Trả về settings đã cập nhật
        return DatasetSettingsType(
            name=current_settings.name,
        )

    @strawberry.mutation
    @require_superuser
    async def restart_dataset_service(self, info: Info) -> bool:
        """
        Restart dataset service.
        Chỉ admin mới có quyền thực hiện.
        Service sẽ tắt và Docker sẽ tự động khởi động lại.
        
        Returns:
            bool: True nếu lệnh restart được thực thi
        """
        log.info(f"{Fore.YELLOW}🔄 Admin yêu cầu restart dataset service...")
        log.info(f"{Fore.RED}⚠️ Service sẽ tắt trong 1 giây...")
        
        # Sử dụng os._exit(1) để tắt service
        # Docker với restart policy sẽ tự động khởi động lại
        import asyncio
        
        async def delayed_exit():
            await asyncio.sleep(1)
            log.info(f"{Fore.RED}🛑 Đang tắt service...")
            os._exit(1)
        
        # Tạo task để tắt sau 1 giây
        asyncio.create_task(delayed_exit())
        
        return True