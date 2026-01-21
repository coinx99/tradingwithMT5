#!/usr/bin/env python3
"""
Script to create an admin user for testing
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.user import User
from app.core.security import get_password_hash
from app.enums import UserRole, UserStatus

async def create_admin():
    # Initialize MongoDB connection
    client = AsyncIOMotorClient("mongodb://localhost:27017/")
    await init_beanie(database=client.trading, document_models=[User])
    
    # Check if admin already exists
    existing_admin = await User.find_one({"email": "admin@test.com"})
    if existing_admin:
        print("Admin user already exists")
        return existing_admin
    
    # Create admin user
    admin_user = User(
        username="admin",
        email="admin@test.com",
        hashed_password=get_password_hash("admin123"),
        displayName="Admin User",
        roles=[UserRole.ADMIN, UserRole.SUPER_ADMIN],
        status=UserStatus.ACTIVE,
        isEmailVerified=True,
        is_superuser=True
    )
    
    await admin_user.insert()
    print(f"Created admin user: {admin_user.email} with roles: {admin_user.roles}")
    return admin_user

if __name__ == "__main__":
    asyncio.run(create_admin())
