#!/usr/bin/env python3
"""
Script to test enum serialization in GraphQL
"""
import asyncio
import json
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.user import User
from app.schemas.user import UserType
from app.enums.user import UserRole

async def test_enum_serialization():
    # Initialize MongoDB connection
    client = AsyncIOMotorClient("mongodb://localhost:27017/")
    await init_beanie(database=client.trading, document_models=[User])
    
    # Get admin user
    admin = await User.find_one({"email": "admin@test.com"})
    if admin:
        print(f"Admin roles: {admin.roles}")
        print(f"Role type: {type(admin.roles[0])}")
        print(f"Role value: {admin.roles[0].value}")
        print(f"str(Role): {str(admin.roles[0])}")
        
        # Create UserType to see how it serializes
        user_type = UserType(
            id=str(admin.id),
            email=admin.email,
            principalId=admin.principalId,
            username=admin.username,
            displayName=admin.displayName,
            avatar=admin.avatar,
            bio=admin.bio,
            roles=admin.roles,
            status=admin.status,
            walletAddresses=admin.walletAddresses,
            primaryWallet=admin.primaryWallet,
            isEmailVerified=admin.isEmailVerified,
            twoFactorEnabled=admin.twoFactorEnabled,
            theme=admin.theme,
            language=admin.language,
            sellerDescription=admin.sellerDescription,
            isVerifiedSeller=admin.isVerifiedSeller,
            totalSales=admin.totalSales,
            totalEarnings=admin.totalEarnings,
            rating=admin.rating,
            reviewCount=admin.reviewCount,
            stakedAmount=admin.stakedAmount,
            stakingExpiry=admin.stakingExpiry,
            lastLoginAt=admin.lastLoginAt,
            lastLoginIp=admin.lastLoginIp,
            created_at=admin.created_at,
            updated_at=admin.updated_at,
            api_key=admin.api_key
        )
        
        print(f"UserType roles: {user_type.roles}")
        print(f"UserType role type: {type(user_type.roles[0])}")
        
        # Test Strawberry serialization
        import strawberry
        from strawberry.schema import config
        
        @strawberry.type
        class TestType:
            roles: list[UserRole]
            
        test_obj = TestType(roles=admin.roles)
        print(f"Strawberry roles: {test_obj.roles}")

if __name__ == "__main__":
    asyncio.run(test_enum_serialization())
