"""
User enums for backend
Shared with frontend through shared-types package
"""
from enum import Enum


class UserRole(str, Enum):
    USER = "user"
    SELLER = "seller"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"
