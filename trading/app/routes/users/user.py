import asyncio
from typing import AsyncGenerator, List, Optional
import strawberry
from strawberry.types import Info

from app.core.security import create_access_token
from app.schemas.user import AuthPayload, UpdateUserInput, UserType
from app.models.user import User
from app.routes.deps import get_current_user, require_superuser
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
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            created_at=user.created_at,
            api_key=user.api_key
        )

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



@strawberry.type
class UserMutation:
    @strawberry.mutation
    async def register_user(
        self, username: str, email: str, password: str
    ) -> UserType:
        """Đăng ký user mới."""
        from app.core.security import get_password_hash

        user = User(
            username=username.lower(),
            email=email.lower(),
            hashed_password=get_password_hash(password),
        )
        await user.insert()
        return UserType(
            id=str(user.id),
            username=user.username,
            email=user.email,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
        )

    @strawberry.mutation
    @require_superuser
    async def deactivate_user(self, info: Info, username: str) -> bool:
        """Chỉ superuser mới có thể deactivate user."""
        user = await User.get_by_username(username=username)
        if not user:
            return False
        user.is_active = False
        await user.save()
        return True

    @strawberry.mutation
    async def login(self, username: str, password: str) -> AuthPayload:
        """Kiểm tra username/password và trả về JWT."""
        log.info(f"{username}, {password}")
        user = await User.authenticate(username=username, password=password)
        if not user:
            raise ValueError("Invalid username or password")
        token = create_access_token(subject=str(user.id))
        return AuthPayload(access_token=token)

    @strawberry.mutation(name="updateUser")
    async def update_user(self, info: Info, input: UpdateUserInput) -> UserType:
        """
        Cập nhật thông tin user hiện tại.
        Trả về object UserType để frontend có dữ liệu mới ngay.
        """
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        api_key = request.query_params.get("api_key")

        user = await get_current_user(token=token, api_key=api_key)
        if not user:
            raise Exception("User not authenticated")

        # Cập nhật dữ liệu
        if input.email is not None:
            user.email = input.email

        await user.save()

        return UserType(
            id=str(user.id),
            username=user.username,
            email=user.email,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            created_at=user.created_at,
            api_key=user.api_key
        )


@strawberry.type
class UserSubscription:
    @strawberry.subscription
    async def user_activity(self) -> AsyncGenerator[str]:
        """Ví dụ subscription giả lập thông báo."""
        # Giả sử mỗi 2 giây gửi thông báo
        for i in range(3):
            yield f"User activity event {i}"
            await asyncio.sleep(2)
