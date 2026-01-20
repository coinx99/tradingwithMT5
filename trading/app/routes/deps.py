import functools
from typing import Callable, Optional, cast
from beanie import PydanticObjectId
from fastapi import Depends, status
from fastapi.exceptions import HTTPException
from fastapi.security import APIKeyQuery, OAuth2PasswordBearer
from graphql import GraphQLError
from jose import jwt
from pydantic import ValidationError
from strawberry import Info

from app import schemas
from app.core import security
from app.core.config import settings
from app.models import User



bearer_token = OAuth2PasswordBearer(
    tokenUrl=f"/api/{settings.API_V1_STR}/auth/access-token",
    auto_error=False,
)
api_key_query = APIKeyQuery(name="api_key", auto_error=False)


async def authenticate_bearer_token(token: str) -> Optional[User]:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[security.ALGORITHM],
        )
        data = schemas.AuthTokenPayload(**payload)
    except (jwt.JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        ) from None
    else:
        return await User.get(cast(PydanticObjectId, data.sub))


async def get_current_user(
    api_key: Optional[str] = Depends(api_key_query),
    token: Optional[str] = Depends(bearer_token),
) -> User:
    """Gets the current user from the database."""
    if api_key:  # API Key has priority over Bearer token 
        user = await User.get_by_api_key(api_key=api_key)
    elif token:
        user = await authenticate_bearer_token(token)
    else:
        # This is the exception that is raised by the Depends() call
        # when the user is not authenticated and auto_error is True.
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authenticated",
        )
    if not user:
        if api_key:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid API key",
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Gets the current active user from the database."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    return current_user


def get_current_active_superuser(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Gets the current active superuser from the database."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    return current_user


class AuthError(GraphQLError):
    def __init__(self, message: str):
        super().__init__(message)


async def auth_super_user(token: str):
    user = await authenticate_bearer_token(token)
    # raise AuthError("Invalid or expired token")
    if not user:
        raise AuthError("Invalid or expired token")
    if not user.is_active:
        raise AuthError("User is inactive")
    if not user.is_superuser:
        raise AuthError("User is not a superuser")
    return user


def require_superuser(func: Callable):
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        # Info nằm ở cuối hoặc đầu args tùy cách khai báo
        info = None
        for a in args:
            if isinstance(a, Info):
                info = a
                break
        if info is None:
            info = kwargs.get("info")
        if info is None:
            raise AuthError("Missing GraphQL context")

        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        await auth_super_user(token)
        return await func(*args, **kwargs)
    return wrapper