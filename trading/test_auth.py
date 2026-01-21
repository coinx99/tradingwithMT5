#!/usr/bin/env python3
"""
Script to test authentication directly
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.user import User
from app.core.security import verify_password

async def test_auth():
    # Initialize MongoDB connection
    client = AsyncIOMotorClient("mongodb://localhost:27017/")
    await init_beanie(database=client.trading, document_models=[User])
    
    # Get admin user
    admin = await User.find_one({"email": "admin@test.com"})
    if admin:
        print(f"Admin user found: {admin.email}")
        print(f"Username: {admin.username}")
        print(f"Hashed password: {admin.hashed_password}")
        print(f"Is active: {admin.is_active}")
        
        # Test password verification
        is_valid = verify_password("admin123", admin.hashed_password)
        print(f"Password verification result: {is_valid}")
        
        # Test authenticate method
        auth_user = await User.authenticate(username="admin", password="admin123")
        print(f"Auth with username: {auth_user.email if auth_user else None}")
        
        auth_user_email = await User.authenticate(username="admin@test.com", password="admin123")
        print(f"Auth with email: {auth_user_email.email if auth_user_email else None}")
    else:
        print("Admin user not found!")

if __name__ == "__main__":
    asyncio.run(test_auth())
