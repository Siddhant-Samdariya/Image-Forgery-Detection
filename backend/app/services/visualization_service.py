"""
Forensic Visualization & Image Overlay Service
Generates forensic masks, color composites, and transparent overlays.
"""

import io
import base64
from typing import Dict, Any, List, Tuple
import numpy as np
from PIL import Image
import cv2

def mask_to_base64_png(mask_2d: np.ndarray, color_rgb: Tuple[int, int, int] = (255, 255, 255), threshold: float = 0.5) -> str:
    """
    Converts a 2D float probability mask [0, 1] into a transparent RGBA PNG base64 string.
    Pixels above threshold are colored with color_rgb and alpha proportional to confidence.
    """
    h, w = mask_2d.shape
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    
    # Active region
    active = mask_2d >= threshold
    rgba[active, 0] = color_rgb[0]
    rgba[active, 1] = color_rgb[1]
    rgba[active, 2] = color_rgb[2]
    
    # Alpha scaled from 120 to 230 based on confidence
    alpha_vals = np.clip(mask_2d * 230, 0, 230).astype(np.uint8)
    rgba[active, 3] = alpha_vals[active]
    
    img = Image.fromarray(rgba, mode="RGBA")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64}"

def generate_heatmap_base64(prob_mask: np.ndarray) -> str:
    """
    Generates a Jet/Turbo color heatmap base64 data URL from a probability map.
    """
    # Scale 0-1 to 0-255 uint8
    norm = np.clip(prob_mask * 255, 0, 255).astype(np.uint8)
    # Apply colormap
    colormap = cv2.applyColorMap(norm, cv2.COLORMAP_JET)
    colormap_rgb = cv2.cvtColor(colormap, cv2.COLOR_BGR2RGB)
    
    img = Image.fromarray(colormap_rgb, mode="RGB")
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=85)
    b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"

def generate_composite_overlay(
    orig_img: Image.Image,
    donor_mask: np.ndarray = None,
    probe_mask: np.ndarray = None,
    inpaint_mask: np.ndarray = None,
    threshold: float = 0.5
) -> str:
    """
    Composites original image with detected forensic overlays,
    highlighting donor (cyan), probe (amber), and inpainting (crimson).
    """
    img_np = np.array(orig_img.convert("RGB"), dtype=np.uint8)
    h, w, _ = img_np.shape
    
    overlay = img_np.copy()
    
    if donor_mask is not None and np.any(donor_mask >= threshold):
        active = donor_mask >= threshold
        overlay[active] = (overlay[active] * 0.45 + np.array([0, 210, 255]) * 0.55).astype(np.uint8)
        
    if probe_mask is not None and np.any(probe_mask >= threshold):
        active = probe_mask >= threshold
        overlay[active] = (overlay[active] * 0.45 + np.array([255, 130, 0]) * 0.55).astype(np.uint8)
        
    if inpaint_mask is not None and np.any(inpaint_mask >= threshold):
        active = inpaint_mask >= threshold
        overlay[active] = (overlay[active] * 0.45 + np.array([245, 40, 60]) * 0.55).astype(np.uint8)
        
    out_img = Image.fromarray(overlay, mode="RGB")
    buffer = io.BytesIO()
    out_img.save(buffer, format="JPEG", quality=88)
    b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"

def extract_hotspots_from_mask(mask: np.ndarray, label: str, threshold: float = 0.5, min_area_pixels: int = 50) -> List[Dict[str, Any]]:
    """
    Extracts connected component bounding boxes (hotspots) from a binary probability mask.
    Coordinates are expressed in percentage [0-100] for responsive frontend display.
    """
    h, w = mask.shape
    binary = (mask >= threshold).astype(np.uint8)
    
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    hotspots = []
    
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < min_area_pixels:
            continue
            
        x, y, bw, bh = cv2.boundingRect(cnt)
        
        # Calculate local max confidence in this region
        region_prob = mask[y : y + bh, x : x + bw]
        local_max = float(np.max(region_prob)) if region_prob.size > 0 else 0.0
        
        hotspots.append({
            "x": round((x / w) * 100, 2),
            "y": round((y / h) * 100, 2),
            "width": round((bw / w) * 100, 2),
            "height": round((bh / h) * 100, 2),
            "pixel_bbox": {"x": int(x), "y": int(y), "w": int(bw), "h": int(bh)},
            "area_pixels": int(area),
            "max_confidence": round(local_max, 4),
            "label": label
        })
        
    return hotspots
