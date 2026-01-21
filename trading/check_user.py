#!/usr/bin/env python3
"""
Script to check if admin user exists in database
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.user import User

async def check_users():
    # Initialize MongoDB connection
    client = AsyncIOMotorClient("mongodb://localhost:27017/")
    await init_beanie(database=client.trading, document_models=[User])
    
    # Check all users
    users = await User.find_all().to_list()
    print(f"Found {len(users)} users:")
    for user in users:
        print(f"- {user.email} ({user.username}) - roles: {user.roles}")
    
    # Check admin specifically
    admin = await User.find_one({"email": "admin@test.com"})
    if admin:
        print(f"\nAdmin user found: {admin.email}")
        print(f"Username: {admin.username}")
        print(f"Roles: {admin.roles}")
        print(f"Is active: {admin.is_active}")
    else:
        print("\nAdmin user not found!")

if __name__ == "__main__":
    asyncio.run(check_users())
