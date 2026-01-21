from typing import List, Optional
import strawberry
from strawberry.types import Info

from app.schemas.user import UserType, User
from app.models.user import User
from app.routes.deps import require_superuser
from app.utils import log



@strawberry.type
class UserQuery:
    @strawberry.field 
    async def me(self, info: Info) -> Optional[UserType]:
        """Trả về thông tin người dùng hiện tại dựa trên token/api_key."""
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        api_key = request.query_params.get("api_key")
        # Gọi hàm get_current_user từ deps.py
        from app.routes.deps import get_current_user
        user = await get_current_user(api_key=api_key, token=token)
        if not user:
            return None
        await user.save()

        return UserType(
            id=str(user.id),
            username=user.username,
            email=user.email,
            displayName=user.displayName,
            bio=user.bio,
            avatar=user.avatar,
            theme=user.theme,
            language=user.language,
            roles=user.roles,
            status=user.status,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            created_at=user.created_at,
            api_key=user.api_key
        )

    @strawberry.field
    async def user(self, info: Info, id: strawberry.ID) -> Optional[UserType]:
        """Lấy thông tin user theo ID."""
        # Kiểm tra quyền - chỉ superuser mới xem được user khác
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        api_key = request.query_params.get("api_key")
        from app.routes.deps import get_current_user
        current_user = await get_current_user(api_key=api_key, token=token)
        
        if not current_user or not current_user.is_superuser:
            raise ValueError("Bạn không có quyền xem thông tin user")
        
        user = await User.get(id)
        if not user:
            return None
            
        return UserType(
            id=str(user.id),
            username=user.username,
            email=user.email,
            displayName=user.displayName,
            bio=user.bio,
            avatar=user.avatar,
            theme=user.theme,
            language=user.language,
            sellerDescription=user.sellerDescription,
            roles=user.roles,
            status=user.status,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            created_at=user.created_at,
            api_key=user.api_key
        )

    @strawberry.field
    async def users(self, info: Info, limit: int = 10, offset: int = 0) -> List[UserType]:
        """Lấy danh sách users với phân trang."""
        # Kiểm tra quyền - chỉ superuser mới xem được
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        api_key = request.query_params.get("api_key")
        from app.routes.deps import get_current_user
        current_user = await get_current_user(api_key=api_key, token=token)
        
        if not current_user or not current_user.is_superuser:
            raise ValueError("Bạn không có quyền xem danh sách users")
        
        users = await User.find_all().skip(offset).limit(limit).to_list()
        return [
            UserType(
                id=str(u.id),
                username=u.username,
                email=u.email,
                displayName=u.displayName,
                bio=u.bio,
                avatar=u.avatar,
                theme=u.theme,
                language=u.language,
                sellerDescription=u.sellerDescription,
                roles=u.roles,
                status=u.status,
                is_active=u.is_active,
                is_superuser=u.is_superuser,
                created_at=u.created_at,
                api_key=u.api_key
            )
            for u in users
        ]

    @strawberry.field
    @require_superuser
    async def all_users(self, info: Info) -> List[UserType]:
        """Chỉ superuser mới xem được toàn bộ user."""
        users = await User.find_all().to_list()
        return [
            UserType(
                id=str(u.id),
                username=u.username,
                email=u.email,
                is_active=u.is_active,
                is_superuser=u.is_superuser,
            )
            for u in users
        ]

