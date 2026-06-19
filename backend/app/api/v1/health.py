from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter()


@router.get("")
def read_health():
    settings = get_settings()

    return {
        "success": True,
        "message": "CareBridge API is healthy",
        "data": {
            "service": "carebridge-api",
            "status": "ok",
            "version": settings.app_version,
        },
    }
