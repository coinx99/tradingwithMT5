from datetime import datetime, timezone
from typing import Optional
from pydantic import Field, validator, ConfigDict
from bson import ObjectId
from beanie import Document, Indexed


class SavedMT5Account(Document):
    """Saved MT5 account credentials for quick connection"""
    
    user_id: ObjectId = Indexed()  # Link to user who owns this account
    login: int = Field(..., description="MT5 account number")
    server: str = Field(..., description="MT5 server name")
    encrypted_password: str = Field(..., description="Encrypted MT5 password")
    path: Optional[str] = Field(None, description="Custom MT5 terminal path")
    is_active: bool = Field(False, description="Currently connected status")
    last_connected: Optional[datetime] = Field(None, description="Last successful connection time")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    model_config = ConfigDict(
        collection="saved_mt5_accounts",
        arbitrary_types_allowed=True,  # Allow ObjectId
        indexes=[
            "user_id",
            [("user_id", 1), ("login", 1), ("server", 1)],  # Unique per user
            "is_active",
            "created_at",
        ]
    )
    
    @validator('login')
    def validate_login(cls, v):
        if v <= 0:
            raise ValueError("Login must be a positive number")
        return v
    
    @validator('server')
    def validate_server(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError("Server cannot be empty")
        return v.strip()
    
    @validator('encrypted_password')
    def validate_encrypted_password(cls, v):
        if not v or len(v) == 0:
            raise ValueError("Encrypted password cannot be empty")
        return v
    
    def to_safe_dict(self) -> dict:
        """Convert to dict without sensitive data for API responses"""
        return {
            "id": str(self.id),
            "login": self.login,
            "server": self.server,
            "path": self.path,
            "is_active": self.is_active,
            "last_connected": self.last_connected.isoformat() if self.last_connected else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
