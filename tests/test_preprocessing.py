"""
Unit Tests for Image Preprocessing and Unpadding
"""

import numpy as np
import torch
from PIL import Image
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.services.image_preprocessing import (
    preprocess_for_inference,
    unpad_and_rescale_mask,
    safe_decode_image
)

def test_preprocess_and_unpad_landscape():
    # Create 800x400 landscape image
    img = Image.new("RGB", (800, 400), color=(128, 64, 32))
    tensor, meta = preprocess_for_inference(img, target_size=512)
    
    # Assert tensor properties
    assert tensor.shape == (1, 3, 512, 512)
    assert meta["orig_width"] == 800
    assert meta["orig_height"] == 400
    assert meta["new_width"] == 512
    assert meta["new_height"] == 256
    assert meta["pad_top"] == 128
    assert meta["pad_left"] == 0
    
    # Simulate a 512x512 mask and test unpadding
    dummy_mask = np.zeros((512, 512), dtype=np.float32)
    # Paint inside active region
    dummy_mask[meta["pad_top"]:meta["pad_top"] + meta["new_height"], :] = 0.85
    
    unpadded = unpad_and_rescale_mask(dummy_mask, meta)
    assert unpadded.shape == (400, 800)
    assert np.allclose(unpadded, 0.85, atol=1e-2)

def test_preprocess_portrait():
    # Create 300x900 portrait image
    img = Image.new("RGB", (300, 900), color=(50, 100, 150))
    tensor, meta = preprocess_for_inference(img, target_size=512)
    
    assert tensor.shape == (1, 3, 512, 512)
    assert meta["orig_width"] == 300
    assert meta["orig_height"] == 900
    assert meta["new_height"] == 512
    assert meta["pad_top"] == 0
    assert meta["pad_left"] > 0
    
    dummy_mask = np.ones((512, 512), dtype=np.float32)
    unpadded = unpad_and_rescale_mask(dummy_mask, meta)
    assert unpadded.shape == (900, 300)

if __name__ == "__main__":
    test_preprocess_and_unpad_landscape()
    test_preprocess_portrait()
    print("ALL PREPROCESSING TESTS PASSED!")
