"""
DEFACTO Inpainting & Object-Removal Detection Service
Executes deep U-Net ResNet-34 inference for single-channel inpainting mask segmentation.
"""

import time
from typing import Dict, Any, Optional
import numpy as np
import torch
from PIL import Image

from app.core.config import settings
from app.services.model_registry import model_registry
from app.services.image_preprocessing import preprocess_for_inference, unpad_and_rescale_mask
from app.services.visualization_service import (
    mask_to_base64_png,
    generate_composite_overlay,
    extract_hotspots_from_mask
)

class InpaintingService:
    def __init__(self):
        pass

    def analyze(
        self,
        img: Image.Image,
        threshold: float = None
    ) -> Dict[str, Any]:
        start_time = time.time()
        th = threshold if threshold is not None else settings.DEFAULT_THRESHOLD
        
        # Check model readiness
        model = model_registry.get_model("inpainting")
        if model is None:
            return {
                "available": False,
                "error": "DEFACTO Inpainting model is not loaded. Checkpoint missing or failed to initialize.",
                "duration_ms": round((time.time() - start_time) * 1000, 2)
            }
            
        # 1. Preprocess input
        tensor, meta = preprocess_for_inference(img, target_size=settings.IMAGE_SIZE)
        tensor = tensor.to(model_registry.device)
        
        # 2. Run inference in inference_mode
        with torch.inference_mode():
            raw_logits = model(tensor) # Shape: (1, 1, 512, 512)
            probs = torch.sigmoid(raw_logits).squeeze().cpu().numpy() # Shape: (512, 512)
            
        # 3. Unpad and resize mask back to native image dimensions
        inpaint_mask = unpad_and_rescale_mask(probs, meta)
        
        total_pixels = inpaint_mask.size
        active_pixels = int(np.sum(inpaint_mask >= th))
        coverage_pct = round((active_pixels / total_pixels) * 100, 3)
        max_confidence = round(float(np.max(inpaint_mask)), 4)
        
        # Minimum pixel threshold (0.05% of frame or 64 px)
        min_pixels = max(64, int(total_pixels * 0.0005))
        detected = active_pixels >= min_pixels
        
        # Extract hotspots
        hotspots = extract_hotspots_from_mask(
            inpaint_mask,
            label="Inpainted / Object Removed Region",
            threshold=th
        )
        
        # Generate visual overlays
        inpaint_png = mask_to_base64_png(inpaint_mask, color_rgb=(245, 40, 60), threshold=th)
        composite_jpeg = generate_composite_overlay(
            orig_img=img,
            inpaint_mask=inpaint_mask,
            threshold=th
        )
        
        duration_ms = round((time.time() - start_time) * 1000, 2)
        
        return {
            "available": True,
            "model_name": "DEFACTO Inpainting Detection (U-Net ResNet-34)",
            "detected": detected,
            "threshold": th,
            "coverage_pct": coverage_pct,
            "max_confidence": max_confidence,
            "active_pixels": active_pixels,
            "mask_overlay_png": inpaint_png,
            "composite_overlay": composite_jpeg,
            "hotspots": hotspots,
            "duration_ms": duration_ms,
            "benchmark_reference": {
                "dataset": "DEFACTO Inpainting Benchmark",
                "task": "Pixel-level segmentation of semantic fills and inpainting boundary artifacts.",
                "known_limitations": "Very smooth or homogenous context fills may yield diffuse boundary probabilities."
            }
        }

inpainting_service = InpaintingService()
