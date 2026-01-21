#!/usr/bin/env python3
"""
Script to test JWT decode
"""
from jose import jwt
from app.core.config import settings

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjI2Mzk4MjkyNTQsInN1YiI6IjY5NmY4NjA5NGQyNTg2YmRhYWNlNzRiYyJ9.l57qkTsiApS9B4fjubhr9u0DR4PbUszJr6Zw8XQHuLE"

try:
    # Try with secret key as string
    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=["HS256"],
    )
    print("JWT decode successful (string key):")
    print(f"Payload: {payload}")
except Exception as e:
    print(f"JWT decode failed (string key): {e}")
    try:
        # Try with encoded secret key
        payload = jwt.decode(
            token,
            settings.SECRET_KEY.encode(),
            algorithms=["HS256"],
        )
        print("JWT decode successful (encoded key):")
        print(f"Payload: {payload}")
    except Exception as e2:
        print(f"JWT decode failed (encoded key): {e2}")
        print(f"Secret key: {settings.SECRET_KEY}")
        print(f"Secret key type: {type(settings.SECRET_KEY)}")
