import uvicorn
from app.core.config import settings


def run_server() -> None:
    """Run the uvicorn server."""
    uvicorn.run(
        "app.main:app",
        host=settings.UVICORN_HOST,
        port=settings.UVICORN_PORT,
        reload=False,  # Always disable reload for performance
        access_log=False,  # Disable access logs for performance
    )


if __name__ == "__main__":
    run_server()
