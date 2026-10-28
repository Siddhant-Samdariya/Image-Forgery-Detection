"""
Model Registry & Availability Endpoints
"""

from fastapi import APIRouter
from app.services.model_registry import model_registry

router = APIRouter(tags=["Models"])

@router.get("/models")
def get_model_registry():
    statuses = model_registry.get_statuses()
    loaded_count = sum(1 for m in statuses.values() if m.get("is_loaded"))
    
    return {
        "models": statuses,
        "active_device": str(model_registry.device),
        "total_models": len(statuses),
        "loaded_models": loaded_count
    }
