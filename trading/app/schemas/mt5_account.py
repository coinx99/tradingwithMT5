from typing import List, Optional
import strawberry
from strawberry.types import Info


@strawberry.input
class SaveAccountInput:
    """Input for saving a new MT5 account"""
    login: int
    password: str  # Plain text, will be encrypted
    server: str
    path: Optional[str] = None


@strawberry.input
class UpdateAccountInput:
    """Input for updating an existing MT5 account"""
    accountId: str
    login: Optional[int] = None
    password: Optional[str] = None  # Plain text, will be encrypted if provided
    server: Optional[str] = None
    path: Optional[str] = None


@strawberry.type
class SavedAccountType:
    """Type for saved MT5 account (without sensitive data)"""
    id: str
    login: int
    server: str
    path: Optional[str]
    isActive: bool
    lastConnected: Optional[str]
    createdAt: str
    updatedAt: str
