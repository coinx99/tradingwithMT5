import asyncio
from typing import AsyncGenerator
import strawberry


@strawberry.type
class UserSubscription:
    @strawberry.subscription
    async def user_activity(self) -> AsyncGenerator[str]:
        """Ví dụ subscription giả lập thông báo."""
        # Giả sử mỗi 2 giây gửi thông báo
        for i in range(3):
            yield f"User activity event {i}"
            await asyncio.sleep(2)
