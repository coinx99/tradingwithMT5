import os
from typing import List
from pathlib import Path

from colorama import Fore
from pydantic import EmailStr, MongoDsn
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

from app import __version__
from app.core.enums import LogLevel
from app.utils.types import MarketTypeEnum
from app.utils.log import log
from app.utils.timeframe import Timeframe

# Simple environment loading - just load .env if exists
def load_env_file():
    """Simple .env file loading"""
    # Lấy đường dẫn thư mục hiện tại
    current_directory = os.getcwd()
    env_file = Path(current_directory + "/.env")

    if env_file.exists():
        load_dotenv(env_file)
        log.info(f"✅ Loaded {Fore.YELLOW}{env_file}{Fore.RESET}")
    else:
        log.info(f"🚨 No {Fore.YELLOW}{env_file}{Fore.RESET} file found, using environment variables")

# Load environment on import
load_env_file()

# This adds support for 'mongodb+srv' connection schemas when using e.g. MongoDB Atlas
# MongoDsn.allowed_schemes.add("mongodb+srv")


class Settings(BaseSettings):
    # compose stack
    SERVER_NAME: str = "s1"

    # Application
    PROJECT_NAME: str = "tradingwithMT5"
    PROJECT_VERSION: str = __version__
    API_V1_STR: str = "v1"
    DEBUG: bool = False  # Production mode by default
    # CORS_ORIGINS is a JSON-formatted list of origins
    CORS_ORIGINS: List[str] = ["*"]
    USE_CORRELATION_ID: bool = False  # Disable for performance

    UVICORN_HOST: str = "0.0.0.0"  # Default host
    UVICORN_PORT: int = 8080  # Default port

    # Logging
    LOG_LEVEL: str = LogLevel.INFO
    LOG_JSON_FORMAT: bool = False  # Use colored logs by default

    # MongoDB
    MONGODB_URI: MongoDsn = "mongodb://localhost:27017/"  # type: ignore[assignment]
    MONGODB_DB_NAME: str = "fastapp"

    # Superuser
    FIRST_SUPERUSER: str = "admin"
    FIRST_SUPERUSER_EMAIL: EmailStr = "admin@example.com"  # type: ignore[assignment]
    FIRST_SUPERUSER_PASSWORD: str = "admin123"

    # Authentication
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    SECRET_KEY: str = "SECRET_KEY"

    # URLs
    URL_IDENT_LENGTH: int = 7

    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""

    MT5_TERMINAL_PATH: str = ""

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = False  # Disable for performance

    class Config:
        # Place your .env file under this path
        env_file = ".env"
        env_prefix = "FASTAPP_"
        case_sensitive = True


# Missing named arguments are filled with environment variables
settings = Settings()  # type: ignore[call-arg]
