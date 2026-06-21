from fastapi import APIRouter

from app.api.v1 import health, rag, recommendations, rehab_snapshot, resources, sessions, sources

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(recommendations.router, prefix="/sessions", tags=["recommendations"])
api_router.include_router(resources.router, prefix="/resources", tags=["resources"])
api_router.include_router(rag.router, prefix="/rag", tags=["rag"])
api_router.include_router(sources.router, prefix="/sources", tags=["sources"])
api_router.include_router(rehab_snapshot.router, prefix="/rehab-snapshot", tags=["rehab-snapshot"])
