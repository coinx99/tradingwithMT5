import re
from datetime import datetime
from typing import Optional, List
# from app.enums import UserRole, UserStatus
# Using local enum definitions instead

from pydantic import BaseModel,StringConstraints,EmailStr


class ConstrainedUsername(StringConstraints):
    min_length = 3
    max_length = 64
    regex = re.compile(r"^[A-Za-z0-9-_.]+$")
    to_lower = True
    strip_whitespace = True


# Shared properties between user models
class UserBase(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: bool = True
    is_superuser: bool = False


# Properties to receive on user creation
class UserCreate(UserBase):
    username: ConstrainedUsername
    email: EmailStr
    password: str


# Properties to receive on user update
class UserUpdate(UserBase):
    password: Optional[str] = None


class UserInDBBase(UserBase):
    created_at: datetime
    api_key: str

    class Config:
        from_attributes = True


# Properties to return via API
class User(UserInDBBase):
    pass


# Properties stored in DB
class UserInDB(UserInDBBase):
    hashed_password: str


# GraphQL 
import strawberry

@strawberry.type
class AuthPayload:
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: Optional["UserType"] = None


@strawberry.type
class UserType:
    id: strawberry.ID
    displayName: Optional[str] = None
    username: str
    email: str
    roles: List[str] = strawberry.field(default_factory=list)
    principalId: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    status: str = "active"
    walletAddresses: List[str] = strawberry.field(default_factory=list)
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
    stakingExpiry: Optional[str] = None
    lastLoginAt: Optional[str] = None
    lastLoginIp: Optional[str] = None
    updated_at: Optional[str] = None
    is_active: bool
    is_superuser: Optional[bool]
    created_at: datetime
    api_key: Optional[str]

# GraphQL User type for frontend compatibility
@strawberry.type
class User(UserType):
    pass


@strawberry.input
class LoginInput:
    username: Optional[str] = None
    email: Optional[str] = None
    password: str


@strawberry.input
class UpdateUserInput:
    email: Optional[str] = None
    username: Optional[str] = None
    displayName: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None
    theme: Optional[str] = None
    language: Optional[str] = None

@strawberry.input
class AdminUpdateUserInput:
    email: Optional[str] = None
    username: Optional[str] = None
    displayName: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None
    theme: Optional[str] = None
    language: Optional[str] = None
    sellerDescription: Optional[str] = None
    roles: Optional[List[str]] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None

@strawberry.input
class CreateUserInput:
    username: str
    email: str
    password: str
    displayName: Optional[str] = None

@strawberry.input
class ChangePasswordInput:
    currentPassword: str
    newPassword: str