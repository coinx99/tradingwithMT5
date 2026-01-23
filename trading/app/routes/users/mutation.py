import strawberry
from strawberry.types import Info

from app.core.security import create_access_token
from app.schemas.user import AuthPayload, LoginResponse, UpdateUserInput, AdminUpdateUserInput, CreateUserInput, ChangePasswordInput, UserType, LoginInput, User
from app.models.user import User
from app.routes.deps import get_current_user, require_superuser
from app.utils import log




@strawberry.type
class UserMutation:
    @strawberry.mutation(name="register")
    async def register_user(
        self, input: CreateUserInput
    ) -> AuthPayload:
        """Đăng ký user mới."""
        from app.core.security import get_password_hash

        # Check if user already exists
        existing_user = await User.find_one({"email": input.email})
        if existing_user:
            raise ValueError("Email already registered")
        
        existing_user = await User.find_one({"username": input.username})
        if existing_user:
            raise ValueError("Username already taken")

        user = User(
            username=input.username.lower(),
            email=input.email.lower(),
            displayName=input.displayName,
            hashed_password=get_password_hash(input.password),
        )
        await user.insert()
        
        token = create_access_token(subject=str(user.id))
        
        return AuthPayload(
            access_token=token, 
            refresh_token=None, 
            user=UserType(
                id=str(user.id),
                username=user.username,
                email=user.email,
                displayName=user.displayName,
                roles=user.roles,
                is_active=user.is_active,
                is_superuser=user.is_superuser,
                created_at=user.created_at,
                api_key=user.api_key
            )
        )

    @strawberry.mutation
    @require_superuser
    async def deactivate_user(self, info: Info, username: str) -> bool:
        """Chỉ superuser mới có thể deactivate user."""
        user = await User.get_by_username(username=username)
        if not user:
            return False
        user.is_active = False
        await user.save()
        return True

    @strawberry.mutation
    async def login(self, input: LoginInput) -> LoginResponse:
        """Kiểm tra username/password và trả về JWT."""
        log.info(f"Login attempt: username={input.username or input.email}")
        
        try:
            user = await User.authenticate(username=input.username or input.email, password=input.password)
            
            if not user:
                log.warning(f"Login failed: Invalid credentials for {input.username or input.email}")
                return LoginResponse(
                    success=False,
                    message="Invalid username or password",
                    access_token=None,
                    refresh_token=None,
                    user=None
                )
            
            # Check if user is active
            if not user.is_active:
                log.warning(f"Login failed: Inactive user {input.username or input.email}")
                return LoginResponse(
                    success=False,
                    message="Account is disabled",
                    access_token=None,
                    refresh_token=None,
                    user=None
                )
            
            token = create_access_token(subject=str(user.id))
            log.info(f"Login successful: {user.username}")
            
            return LoginResponse(
                success=True,
                message="Login successful",
                access_token=token,
                refresh_token=None,
                user=UserType(
                    id=str(user.id),
                    username=user.username,
                    email=user.email,
                    displayName=user.displayName,
                    roles=user.roles,
                    is_active=user.is_active,
                    is_superuser=user.is_superuser,
                    created_at=user.created_at,
                    api_key=user.api_key
                )
            )
            
        except Exception as e:
            log.error(f"Login error for {input.username or input.email}: {str(e)}")
            return LoginResponse(
                success=False,
                message="An error occurred during login",
                access_token=None,
                refresh_token=None,
                user=None
            )

    @strawberry.mutation(name="updateUser")
    async def update_user(self, info: Info, input: UpdateUserInput) -> UserType:
        """
        Cập nhật thông tin user hiện tại.
        Trả về object UserType để frontend có dữ liệu mới ngay.
        """
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        api_key = request.query_params.get("api_key")

        user = await get_current_user(token=token, api_key=api_key)
        if not user:
            raise Exception("User not authenticated")

        # Cập nhật dữ liệu
        if input.email is not None:
            user.email = input.email
        if input.username is not None:
            user.username = input.username
        if input.displayName is not None:
            user.displayName = input.displayName
        if input.bio is not None:
            user.bio = input.bio
        if input.avatar is not None:
            user.avatar = input.avatar
        if input.theme is not None:
            user.theme = input.theme
        if input.language is not None:
            user.language = input.language

        await user.save()

        return UserType(
            id=str(user.id),
            username=user.username,
            email=user.email,
            displayName=user.displayName,
            bio=user.bio,
            avatar=user.avatar,
            theme=user.theme,
            language=user.language,
            roles=user.roles,
            status=user.status,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            created_at=user.created_at,
            api_key=user.api_key
        )

    @strawberry.mutation(name="adminUpdateUser")
    @require_superuser
    async def admin_update_user(self, info: Info, id: str, input: AdminUpdateUserInput) -> UserType:
        """
        Admin cập nhật thông tin user khác.
        """
        user = await User.get(id)
        if not user:
            raise Exception("User not found")

        # Cập nhật dữ liệu
        if input.email is not None:
            user.email = input.email
        if input.username is not None:
            user.username = input.username
        if input.displayName is not None:
            user.displayName = input.displayName
        if input.bio is not None:
            user.bio = input.bio
        if input.avatar is not None:
            user.avatar = input.avatar
        if input.theme is not None:
            user.theme = input.theme
        if input.language is not None:
            user.language = input.language
        if input.sellerDescription is not None:
            user.sellerDescription = input.sellerDescription
        if input.roles is not None:
            user.roles = input.roles
        if input.status is not None:
            user.status = input.status
        if input.is_active is not None:
            user.is_active = input.is_active
        if input.is_superuser is not None:
            user.is_superuser = input.is_superuser

        await user.save()

        return UserType(
            id=str(user.id),
            username=user.username,
            email=user.email,
            displayName=user.displayName,
            bio=user.bio,
            avatar=user.avatar,
            theme=user.theme,
            language=user.language,
            sellerDescription=user.sellerDescription,
            roles=user.roles,
            status=user.status,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            created_at=user.created_at,
            api_key=user.api_key
        )

    @strawberry.mutation(name="changePassword")
    async def change_password(self, info: Info, input: ChangePasswordInput) -> UserType:
        """
        Đổi mật khẩu user hiện tại.
        """
        request = info.context["request"]
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        api_key = request.query_params.get("api_key")

        user = await get_current_user(token=token, api_key=api_key)
        if not user:
            raise Exception("User not authenticated")

        # Verify current password
        from app.core.security import verify_password
        if not verify_password(input.currentPassword, user.hashed_password):
            raise ValueError("Current password is incorrect")

        # Update password
        from app.core.security import get_password_hash
        user.hashed_password = get_password_hash(input.newPassword)
        await user.save()

        return UserType(
            id=str(user.id),
            username=user.username,
            email=user.email,
            displayName=user.displayName,
            bio=user.bio,
            avatar=user.avatar,
            theme=user.theme,
            language=user.language,
            roles=user.roles,
            status=user.status,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            created_at=user.created_at,
            api_key=user.api_key
        )

