from datetime import datetime, timezone
from typing import List, Optional

from beanie import Document, Indexed, init_beanie
from pydantic import EmailStr, Field
from pydantic_core import ValidationError

from app.core.security import get_password_hash, verify_password, create_api_key
from app.enums import UserRole, UserStatus


class User(Document):
    username: Indexed(str, unique=True)  # type: ignore[valid-type]
    email: Indexed(EmailStr, unique=True)  # type: ignore[valid-type]
    hashed_password: str
    is_active: bool = True
    is_superuser: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))
    api_key: str = Field(default_factory=create_api_key)
    
    # Additional fields for frontend compatibility
    principalId: Optional[str] = None
    displayName: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    roles: List[UserRole] = Field(default_factory=list)
    status: UserStatus = UserStatus.ACTIVE
    walletAddresses: List[str] = Field(default_factory=list)
    primaryWallet: Optional[str] = None
    isEmailVerified: bool = False
    twoFactorEnabled: bool = False
    theme: Optional[str] = None
    language: Optional[str] = None
    sellerDescription: Optional[str] = None
    isVerifiedSeller: bool = False
    totalSales: float = 0
    totalEarnings: float = 0
    rating: float = 0
    reviewCount: int = 0
    stakedAmount: float = 0
    stakingExpiry: Optional[datetime] = None
    lastLoginAt: Optional[datetime] = None
    lastLoginIp: Optional[str] = None

    @classmethod
    async def get_by_username(cls, *, username: str) -> Optional["User"]:
        # Because all usernames are converted to lowercase at user creation,
        # make the given 'username' parameter also lowercase.
        if not username:
            return None
        return await cls.find_one(cls.username == username.lower())

    @classmethod
    async def get_by_email(cls, *, email: str) -> Optional["User"]:
        if not email:
            return None
        return await cls.find_one(cls.email == email.lower())

    @classmethod
    async def get_by_api_key(cls, *, api_key: str) -> Optional["User"]:
        return await cls.find_one(cls.api_key == api_key.lower())

    @classmethod
    async def authenticate(
        cls,
        *,
        username: str,
        password: str,
    ) -> Optional["User"]:
        if not username:
            return None
        # Try username first
        user = await cls.get_by_username(username=username)
        if not user:
            # Try email if username fails
            user = await cls.get_by_email(email=username)
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user

    class Settings:
        name = "users"
        use_state_management = True
