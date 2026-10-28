"""
Unit Tests for Model Loading, Inference, and Fallbacks
"""

import sys
from pathlib import Path
import torch

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.services.model_registry import ModelRegistry
from app.core.config import settings

def test_model_registry_loading():
    registry = ModelRegistry.get_instance()
    registry.load_all_models()
    statuses = registry.get_statuses()
    
    assert "copy_move" in statuses
    assert "inpainting" in statuses
    assert "splicing" in statuses
    assert "ai_diffusion" in statuses
    
    # Verify loaded states
    assert statuses["copy_move"]["is_loaded"] is True
    assert statuses["inpainting"]["is_loaded"] is True
    assert statuses["splicing"]["is_loaded"] is False
    assert statuses["splicing"]["status"] == "planned"
    
    # Test inference on Copy-Move
    cm_model = registry.get_model("copy_move")
    assert cm_model is not None
    dummy = torch.randn(1, 3, 512, 512, device=registry.device)
    with torch.inference_mode():
        cm_out = cm_model(dummy)
    assert cm_out.shape == (1, 2, 512, 512)
    
    # Test inference on Inpainting
    inp_model = registry.get_model("inpainting")
    assert inp_model is not None
    with torch.inference_mode():
        inp_out = inp_model(dummy)
    assert inp_out.shape == (1, 1, 512, 512)

def test_missing_checkpoint_fallback():
    # Test that pointing to non-existent checkpoint does not crash
    temp_registry = ModelRegistry()
    saved_path = settings.COPY_MOVE_WEIGHTS
    try:
        settings.COPY_MOVE_WEIGHTS = Path("non_existent_weights.pth")
        temp_registry._load_copy_move()
        status = temp_registry.statuses["copy_move"]
        assert status["is_loaded"] is False
        assert status["status"] == "checkpoint_missing"
    finally:
        settings.COPY_MOVE_WEIGHTS = saved_path

if __name__ == "__main__":
    test_model_registry_loading()
    test_missing_checkpoint_fallback()
    print("ALL MODEL REGISTRY TESTS PASSED!")
