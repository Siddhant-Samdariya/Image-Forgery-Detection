"""
Health and Diagnostic Endpoints
"""

from fastapi import APIRouter
import time
from app.core.config import settings
from app.services.model_registry import model_registry

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    statuses = model_registry.get_statuses()
    loaded_count = sum(1 for m in statuses.values() if m.get("is_loaded"))
    
    return {
        "status": "operational",
        "engine": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "device": str(model_registry.device),
        "models_loaded": f"{loaded_count}/{len(statuses)}",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    }
