"""
DEFACTO Copy-Move Localization Service
Executes deep U-Net ResNet-34 inference for dual-channel donor & probe segmentation.
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

class CopyMoveService:
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
        model = model_registry.get_model("copy_move")
        if model is None:
            return {
                "available": False,
                "error": "DEFACTO Copy-Move model is not loaded. Checkpoint missing or failed to initialize.",
                "duration_ms": round((time.time() - start_time) * 1000, 2)
            }
            
        # 1. Preprocess input
        tensor, meta = preprocess_for_inference(img, target_size=settings.IMAGE_SIZE)
        tensor = tensor.to(model_registry.device)
        
        # 2. Run inference in inference_mode
        with torch.inference_mode():
            raw_logits = model(tensor) # Shape: (1, 2, 512, 512)
            probs = torch.sigmoid(raw_logits).squeeze(0).cpu().numpy() # Shape: (2, 512, 512)
            
        donor_512 = probs[0]
        probe_512 = probs[1]
        
        # 3. Unpad and resize masks back to native image dimensions
        donor_mask = unpad_and_rescale_mask(donor_512, meta)
        probe_mask = unpad_and_rescale_mask(probe_512, meta)
        
        total_pixels = donor_mask.size
        donor_active_pixels = int(np.sum(donor_mask >= th))
        probe_active_pixels = int(np.sum(probe_mask >= th))
        
        donor_coverage_pct = round((donor_active_pixels / total_pixels) * 100, 3)
        probe_coverage_pct = round((probe_active_pixels / total_pixels) * 100, 3)
        
        donor_max = round(float(np.max(donor_mask)), 4)
        probe_max = round(float(np.max(probe_mask)), 4)
        
        # Minimum pixel threshold (0.05% of frame or 64 px) to eliminate minor random noise speckles
        min_pixels = max(64, int(total_pixels * 0.0005))
        donor_detected = donor_active_pixels >= min_pixels
        probe_detected = probe_active_pixels >= min_pixels
        overall_detected = donor_detected or probe_detected
        
        # Extract hotspots
        donor_hotspots = extract_hotspots_from_mask(donor_mask, label="Donor (Copied Source)", threshold=th)
        probe_hotspots = extract_hotspots_from_mask(probe_mask, label="Probe (Cloned Target)", threshold=th)
        all_hotspots = donor_hotspots + probe_hotspots
        
        # Generate visual overlays
        donor_png = mask_to_base64_png(donor_mask, color_rgb=(0, 210, 255), threshold=th)
        probe_png = mask_to_base64_png(probe_mask, color_rgb=(255, 130, 0), threshold=th)
        composite_jpeg = generate_composite_overlay(
            orig_img=img,
            donor_mask=donor_mask,
            probe_mask=probe_mask,
            threshold=th
        )
        
        duration_ms = round((time.time() - start_time) * 1000, 2)
        
        return {
            "available": True,
            "model_name": "DEFACTO Copy-Move Localization (U-Net ResNet-34)",
            "detected": overall_detected,
            "threshold": th,
            "donor": {
                "detected": donor_detected,
                "coverage_pct": donor_coverage_pct,
                "max_confidence": donor_max,
                "active_pixels": donor_active_pixels,
                "mask_overlay_png": donor_png
            },
            "probe": {
                "detected": probe_detected,
                "coverage_pct": probe_coverage_pct,
                "max_confidence": probe_max,
                "active_pixels": probe_active_pixels,
                "mask_overlay_png": probe_png
            },
            "composite_overlay": composite_jpeg,
            "hotspots": all_hotspots,
            "duration_ms": duration_ms,
            "benchmark_reference": {
                "test_recall": "58.32% (at threshold 0.5)",
                "donor_dice": "0.4605",
                "probe_dice": "0.5432",
                "evaluation_basis": "Tested against DEFACTO copy-move forged set. Low scores expected on tiny or recompressed clones."
            }
        }

copy_move_service = CopyMoveService()
