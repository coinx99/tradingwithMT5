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
    account_id: str
    password: Optional[str] = None  # Plain text, will be encrypted if provided
    path: Optional[str] = None


@strawberry.type
class SavedAccountType:
    """Type for saved MT5 account (without sensitive data)"""
    id: str
    login: int
    server: str
    path: Optional[str]
    is_active: bool
    last_connected: Optional[str]
    created_at: str
    updated_at: str
