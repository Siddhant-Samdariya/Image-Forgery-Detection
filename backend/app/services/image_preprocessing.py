"""
Image Preprocessing and Transformation Pipeline for Digital Image Forensics
"""

from typing import Tuple, Dict, Any
import numpy as np
import torch
from PIL import Image, ImageOps
import io
import cv2

# ImageNet normalization parameters
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)

def safe_decode_image(image_bytes: bytes) -> Image.Image:
    """
    Safely decode raw image bytes into a PIL RGB Image,
    handling EXIF orientation transposition.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
        # Handle EXIF orientation if present
        img = ImageOps.exif_transpose(img)
        return img.convert("RGB")
    except Exception as e:
        raise ValueError(f"Failed to decode image: {str(e)}")

def preprocess_for_inference(
    img: Image.Image,
    target_size: int = 512
) -> Tuple[torch.Tensor, Dict[str, Any]]:
    """
    Aspect-ratio-preserving resize and letterbox padding to target_size x target_size.
    Scales RGB to [0, 1] and applies ImageNet normalization.
    
    Returns:
        tensor: torch.FloatTensor of shape (1, 3, target_size, target_size)
        meta: Preprocessing metadata for unpadding back to original image dimensions
    """
    orig_w, orig_h = img.size
    
    # Calculate scale factor preserving aspect ratio
    scale = min(target_size / orig_w, target_size / orig_h)
    new_w = max(1, int(round(orig_w * scale)))
    new_h = max(1, int(round(orig_h * scale)))
    
    # Resize with high-quality bilinear interpolation
    resized_img = img.resize((new_w, new_h), Image.Resampling.BILINEAR)
    
    # Calculate padding offsets (centered letterboxing)
    pad_left = (target_size - new_w) // 2
    pad_top = (target_size - new_h) // 2
    pad_right = target_size - new_w - pad_left
    pad_bottom = target_size - new_h - pad_top
    
    # Create canvas with 0 padding
    padded_img = Image.new("RGB", (target_size, target_size), (0, 0, 0))
    padded_img.paste(resized_img, (pad_left, pad_top))
    
    # Convert to numpy float32 in [0, 1]
    np_img = np.array(padded_img, dtype=np.float32) / 255.0
    
    # Apply ImageNet normalization: (x - mean) / std
    norm_img = (np_img - IMAGENET_MEAN) / IMAGENET_STD
    
    # Transpose to Channel-First (H, W, C) -> (C, H, W)
    chw_img = np.transpose(norm_img, (2, 0, 1))
    
    # Convert to PyTorch Tensor with batch dimension (1, 3, H, W)
    tensor = torch.from_numpy(chw_img).unsqueeze(0).float()
    
    meta = {
        "orig_width": orig_w,
        "orig_height": orig_h,
        "scale": scale,
        "new_width": new_w,
        "new_height": new_h,
        "pad_left": pad_left,
        "pad_top": pad_top,
        "pad_right": pad_right,
        "pad_bottom": pad_bottom,
        "target_size": target_size
    }
    
    return tensor, meta

def unpad_and_rescale_mask(
    mask_512: np.ndarray,
    meta: Dict[str, Any]
) -> np.ndarray:
    """
    Reverses letterbox padding and resizes the probability mask
    back to the original image dimensions (orig_height, orig_width).
    
    Args:
        mask_512: 2D numpy array of shape (512, 512), float in [0, 1]
        meta: Preprocessing metadata dictionary
        
    Returns:
        unpadded_mask: 2D numpy array of shape (orig_height, orig_width), float in [0, 1]
    """
    pad_top = meta["pad_top"]
    pad_left = meta["pad_left"]
    new_h = meta["new_height"]
    new_w = meta["new_width"]
    orig_w = meta["orig_width"]
    orig_h = meta["orig_height"]
    
    # Crop out the active region
    valid_region = mask_512[pad_top : pad_top + new_h, pad_left : pad_left + new_w]
    
    # Resize back to original dimensions using linear interpolation
    orig_mask = cv2.resize(
        valid_region,
        (orig_w, orig_h),
        interpolation=cv2.INTER_LINEAR
    )
    
    return np.clip(orig_mask, 0.0, 1.0)
