from fastapi import APIRouter

from app.api.v1 import health, recommendations, resources, sessions

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(recommendations.router, prefix="/sessions", tags=["recommendations"])
api_router.include_router(resources.router, prefix="/resources", tags=["resources"])
