from typing import List, Optional
import strawberry
from strawberry.types import Info
from datetime import datetime, timezone

from app.models.mt5_account import SavedMT5Account
from app.routes.deps import get_current_user
from app.utils.log import log
from app.utils.encryption import encrypt_password, decrypt_password
from app.services.mt5_service import mt5_service
from app.schemas.common import MutationResponse, SuccessResponse, ErrorResponse
from app.schemas.mt5_account import SaveAccountInput, UpdateAccountInput, SavedAccountType


@strawberry.type
class AccountManagement:
    """Account management mutations and queries"""
    
    @strawberry.mutation
    async def save_mt5_account(self, info: Info, account: SaveAccountInput) -> MutationResponse:
        """Save a new MT5 account credentials"""
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        api_key = request.query_params.get("api_key")

        current_user = await get_current_user(token=token, api_key=api_key)
        if not current_user:
            return ErrorResponse(
                status="ERROR",
                message="User not authenticated",
                error_code="AUTH_ERROR"
            )

        try:
            # Check if account already exists for this user
            existing = await SavedMT5Account.find_one({
                "user_id": current_user.id,
                "login": account.login,
                "server": account.server
            })
            
            if existing:
                return ErrorResponse(
                    status="ERROR",
                    message="Account with this login and server already exists",
                    error_code="DUPLICATE_ACCOUNT"
                )

            # Encrypt password
            encrypted_password = encrypt_password(account.password)

            # Create saved account
            saved_account = SavedMT5Account(
                user_id=current_user.id,
                login=account.login,
                server=account.server,
                encrypted_password=encrypted_password,
                path=account.path
            )
            
            await saved_account.insert()
            
            log.info(f"Saved MT5 account {account.login}@{account.server} for user {current_user.id}")
            
            return SuccessResponse(
                status="SUCCESS",
                message="Account saved successfully",
                data=str(saved_account.id)
            )
            
        except Exception as e:
            log.error(f"Failed to save MT5 account: {e}")
            return ErrorResponse(
                status="ERROR",
                message="Failed to save account",
                error_code="SAVE_FAILED",
                details=str(e)
            )

    @strawberry.mutation
    async def update_saved_account(self, info: Info, account: UpdateAccountInput) -> MutationResponse:
        """Update an existing saved MT5 account"""
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        api_key = request.query_params.get("api_key")

        current_user = await get_current_user(token=token, api_key=api_key)
        if not current_user:
            return ErrorResponse(
                status="ERROR",
                message="User not authenticated",
                error_code="AUTH_ERROR"
            )

        try:
            saved_account = await SavedMT5Account.get(account.accountId)
            if not saved_account or saved_account.user_id != current_user.id:
                return ErrorResponse(
                    status="ERROR",
                    message="Account not found",
                    error_code="ACCOUNT_NOT_FOUND"
                )

            # Update fields
            if account.login is not None:
                saved_account.login = account.login
            if account.server is not None:
                saved_account.server = account.server
            if account.password:
                saved_account.encrypted_password = encrypt_password(account.password)
            if account.path is not None:
                saved_account.path = account.path
            
            saved_account.updated_at = datetime.now(timezone.utc)
            await saved_account.save()
            
            log.info(f"Updated MT5 account {saved_account.login}@{saved_account.server} for user {current_user.id}")
            
            return SuccessResponse(
                status="SUCCESS",
                message="Account updated successfully",
                data=str(saved_account.id)
            )
            
        except Exception as e:
            log.error(f"Failed to update MT5 account: {e}")
            return ErrorResponse(
                status="ERROR",
                message="Failed to update account",
                error_code="UPDATE_FAILED",
                details=str(e)
            )

    @strawberry.mutation
    async def delete_saved_account(self, info: Info, account_id: str) -> MutationResponse:
        """Delete a saved MT5 account"""
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        api_key = request.query_params.get("api_key")

        current_user = await get_current_user(token=token, api_key=api_key)
        if not current_user:
            return ErrorResponse(
                status="ERROR",
                message="User not authenticated",
                error_code="AUTH_ERROR"
            )

        try:
            saved_account = await SavedMT5Account.get(account_id)
            if not saved_account or saved_account.user_id != current_user.id:
                return ErrorResponse(
                    status="ERROR",
                    message="Account not found",
                    error_code="ACCOUNT_NOT_FOUND"
                )

            # Disconnect if currently active
            if saved_account.is_active:
                await mt5_service.disconnect_mt5(str(current_user.id))
                
                # Update all accounts for this user to inactive
                await SavedMT5Account.find_many({"user_id": current_user.id}).update(
                    {"$set": {"is_active": False}}
                )

            await saved_account.delete()
            
            log.info(f"Deleted MT5 account {saved_account.login}@{saved_account.server} for user {current_user.id}")
            
            return SuccessResponse(
                status="SUCCESS",
                message="Account deleted successfully"
            )
            
        except Exception as e:
            log.error(f"Failed to delete MT5 account: {e}")
            return ErrorResponse(
                status="ERROR",
                message="Failed to delete account",
                error_code="DELETE_FAILED",
                details=str(e)
            )

    @strawberry.mutation
    async def connect_saved_account(self, info: Info, account_id: str) -> MutationResponse:
        """Connect to a saved MT5 account"""
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        api_key = request.query_params.get("api_key")

        current_user = await get_current_user(token=token, api_key=api_key)
        if not current_user:
            return ErrorResponse(
                status="ERROR",
                message="User not authenticated",
                error_code="AUTH_ERROR"
            )

        try:
            saved_account = await SavedMT5Account.get(account_id)
            if not saved_account or saved_account.user_id != current_user.id:
                return ErrorResponse(
                    status="ERROR",
                    message="Account not found",
                    error_code="ACCOUNT_NOT_FOUND"
                )

            # Decrypt password
            password = decrypt_password(saved_account.encrypted_password)

            # Connect to MT5
            success = await mt5_service.connect_mt5(
                user_id=str(current_user.id),
                login=str(saved_account.login),
                password=password,
                server=saved_account.server,
                path=saved_account.path
            )

            if success:
                # Update account status
                saved_account.is_active = True
                saved_account.last_connected = datetime.now(timezone.utc)
                await saved_account.save()

                # Set all other accounts for this user to inactive
                await SavedMT5Account.find_many({
                    "user_id": current_user.id,
                    "_id": {"$ne": saved_account.id}
                }).update({"$set": {"is_active": False}})

                log.info(f"Connected to MT5 account {saved_account.login}@{saved_account.server} for user {current_user.id}")
                
                return SuccessResponse(
                    status="SUCCESS",
                    message=f"Connected to MT5 account {saved_account.login}@{saved_account.server}",
                    data=str(saved_account.id)
                )
            else:
                return ErrorResponse(
                    status="ERROR",
                    message="Failed to connect to MT5",
                    error_code="CONNECTION_FAILED"
                )
            
        except Exception as e:
            log.error(f"Failed to connect to saved MT5 account: {e}")
            return ErrorResponse(
                status="ERROR",
                message="Failed to connect",
                error_code="CONNECTION_ERROR",
                details=str(e)
            )

    @strawberry.field
    async def saved_mt5_accounts(self, info: Info) -> List[SavedAccountType]:
        """Get all saved MT5 accounts for the current user"""
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        api_key = request.query_params.get("api_key")

        current_user = await get_current_user(token=token, api_key=api_key)
        if not current_user:
            raise Exception("User not authenticated")

        try:
            accounts = await SavedMT5Account.find_many({"user_id": current_user.id}).to_list()
            
            return [
                SavedAccountType(
                    id=str(account.id),
                    login=account.login,
                    server=account.server,
                    path=account.path,
                    isActive=account.is_active,
                    lastConnected=account.last_connected.isoformat() if account.last_connected else None,
                    createdAt=account.created_at.isoformat(),
                    updatedAt=account.updated_at.isoformat(),
                )
                for account in accounts
            ]
            
        except Exception as e:
            log.error(f"Failed to get saved MT5 accounts: {e}")
            return []
