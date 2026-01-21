from datetime import timezone
from beanie import init_beanie
from pydantic import MongoDsn
from colorama import Fore
from pymongo import AsyncMongoClient

from app.utils import log
from app.core.config import settings
from app.core.security import get_password_hash
from app.models import User, gather_documents
from app.enums import UserRole, UserStatus


def insert_credentials_to_mongodsn(uri: MongoDsn, username: str, password: str, database_name: str) -> str:
    uri_str = str(uri)  # Chuyển đổi MongoDsn thành chuỗi
    if not uri_str.startswith("mongodb://"):
        raise ValueError("Invalid MongoDB URI") 
    
    # Chèn username và password vào URI
    return uri_str.replace("mongodb://", f"mongodb://{username}:{password}@", 1) + f"?authSource={database_name}&authMechanism=SCRAM-SHA-256"



class DB:
    """
    Chứa thông tin các trạng thái kết nối các database 
    """
    mongo_client: AsyncMongoClient = None
    init_mongo_done = False


db = DB()


async def init() -> None:
    secured_uri = str(settings.MONGODB_URI)

    client = AsyncMongoClient(secured_uri, tz_aware=True, tzinfo=timezone.utc)
    
    document_models = gather_documents()

    await init_beanie(
        database=getattr(client, settings.MONGODB_DB_NAME), #client.db_name, #
        document_models=document_models,  # type: ignore[arg-type]
    )

    db.init_mongo_done = True
    db.mongo_client = client
    log.info(f"{Fore.GREEN} ✔️ init_beanie done {secured_uri}")
    for model in document_models:
        name: str = model.get_pymongo_collection().name
        if name.startswith("liquidation"):
            await model.get_pymongo_collection().insert_one({"_init": True})
            await model.get_pymongo_collection().delete_one({"_init": True})


    # tạo user admin nếu chưa có 
    if not await User.get_by_username(username=settings.FIRST_SUPERUSER):
        # Xóa collection cũ để tránh conflict với enum mới
        await User.get_pymongo_collection().drop()
        await User(
            username=settings.FIRST_SUPERUSER,
            email=settings.FIRST_SUPERUSER_EMAIL,
            hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
            is_superuser=True,
            roles=[UserRole.ADMIN, UserRole.SUPER_ADMIN],
            status=UserStatus.ACTIVE,
        ).insert()
