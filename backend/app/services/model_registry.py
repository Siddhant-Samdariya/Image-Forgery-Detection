"""
Model Registry & Lifecycle Manager for Digital Image Forensics Models
"""

import logging
from typing import Dict, Any, Optional
from pathlib import Path
import torch
import segmentation_models_pytorch as smp

from app.core.config import settings

logger = logging.getLogger("forensics.model_registry")

class ModelRegistry:
    _instance: Optional["ModelRegistry"] = None
    
    def __init__(self):
        self.device = torch.device(
            "cuda" if torch.cuda.is_available() and not settings.FORCE_CPU else "cpu"
        )
        self.models: Dict[str, Any] = {}
        self.statuses: Dict[str, Dict[str, Any]] = {}
        self._initialize_metadata()
        
    @classmethod
    def get_instance(cls) -> "ModelRegistry":
        if cls._instance is None:
            cls._instance = ModelRegistry()
        return cls._instance

    def _initialize_metadata(self):
        """Register known forensic models, their metadata, and status specifications."""
        self.statuses = {
            "copy_move": {
                "id": "copy_move",
                "name": "DEFACTO Copy-Move Localization",
                "task": "Two-channel pixel-level donor & probe mask segmentation",
                "architecture": "U-Net with pretrained ResNet-34 encoder (2 channels)",
                "input_specs": "512×512 RGB, letterbox padded, ImageNet normalized",
                "output_specs": "Channel 0: Donor (copied-from), Channel 1: Probe (copied-to)",
                "checkpoint_path": str(settings.COPY_MOVE_WEIGHTS),
                "is_loaded": False,
                "status": "pending_load",
                "metrics_reference": {
                    "benchmark_dataset": "DEFACTO Copy-Move Test Subset",
                    "evaluation_note": "Evaluated on known forged instances (not balanced authentic/forged test).",
                    "image_level_recall": "58.32% (at threshold 0.5)",
                    "donor_dice": "0.4605",
                    "probe_dice": "0.5432",
                    "known_limitations": "Tiny clone patches (<1% image area) and heavy JPEG recompression are challenging."
                }
            },
            "inpainting": {
                "id": "inpainting",
                "name": "DEFACTO Inpainting / Object-Removal Detection",
                "task": "Single-channel pixel-level inpainting manipulation mask segmentation",
                "architecture": "U-Net with pretrained ResNet-34 encoder (1 channel)",
                "input_specs": "512×512 RGB, letterbox padded, ImageNet normalized",
                "output_specs": "Channel 0: Inpainting / Object-removal probability mask",
                "checkpoint_path": str(settings.INPAINTING_WEIGHTS),
                "is_loaded": False,
                "status": "pending_load",
                "metrics_reference": {
                    "benchmark_dataset": "DEFACTO Inpainting Test Subset",
                    "evaluation_note": "Pixel-level segmentation of diffusion/inpainting fill boundaries.",
                    "known_limitations": "Blurry context fills or small edge-inpainted seams may produce diffuse probabilities."
                }
            },
            "splicing": {
                "id": "splicing",
                "name": "DEFACTO Splicing Localization",
                "task": "External object insertion & boundary anomaly detection",
                "architecture": "Multi-stream Encoder-Decoder (Planned)",
                "input_specs": "512×512 RGB",
                "output_specs": "Single-channel insertion mask",
                "checkpoint_path": None,
                "is_loaded": False,
                "status": "planned",
                "metrics_reference": {
                    "benchmark_dataset": "Pending Training",
                    "evaluation_note": "Model under active research / integration roadmap."
                }
            },
            "ai_diffusion": {
                "id": "ai_diffusion",
                "name": "Synthetic AI Diffusion / GAN Footprint Detection",
                "task": "Frequency artifact & spectrum checkerboard pattern audit",
                "architecture": "Spectral ResNet-50 Classifier (Planned)",
                "input_specs": "Full resolution RGB FFT spectrum",
                "output_specs": "Synthetic probability score [0.0 - 1.0]",
                "checkpoint_path": None,
                "is_loaded": False,
                "status": "planned",
                "metrics_reference": {
                    "benchmark_dataset": "Pending Training",
                    "evaluation_note": "Model under active research / integration roadmap."
                }
            }
        }

    def load_all_models(self):
        """Loads and warms up active models once at startup."""
        logger.info(f"Forensic Model Registry initializing on device: {self.device}")
        
        # 1. Load Copy-Move Model
        self._load_copy_move()
        
        # 2. Load Inpainting Model
        self._load_inpainting()
        
    def _load_copy_move(self):
        ckpt_path = settings.COPY_MOVE_WEIGHTS
        meta = self.statuses["copy_move"]
        
        if not ckpt_path.exists():
            meta["is_loaded"] = False
            meta["status"] = "checkpoint_missing"
            meta["error"] = f"Checkpoint file not found at {ckpt_path}"
            logger.warning(f"Copy-Move checkpoint missing at {ckpt_path}")
            return

        try:
            model = smp.Unet(
                encoder_name="resnet34",
                encoder_weights=None,
                in_channels=3,
                classes=2
            )
            checkpoint = torch.load(ckpt_path, map_location=self.device, weights_only=False)
            
            # Extract state_dict cleanly
            if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
                state_dict = checkpoint["model_state_dict"]
            elif isinstance(checkpoint, dict) and "state_dict" in checkpoint:
                state_dict = checkpoint["state_dict"]
            else:
                state_dict = checkpoint
                
            model.load_state_dict(state_dict, strict=True)
            model.to(self.device)
            model.eval()
            
            # Warm-up inference
            with torch.inference_mode():
                dummy = torch.zeros(1, 3, 512, 512, device=self.device)
                _ = model(dummy)
                
            self.models["copy_move"] = model
            meta["is_loaded"] = True
            meta["status"] = "operational"
            meta["device"] = str(self.device)
            logger.info("Successfully loaded DEFACTO Copy-Move Localization model.")
        except Exception as e:
            meta["is_loaded"] = False
            meta["status"] = "load_failed"
            meta["error"] = str(e)
            logger.error(f"Failed to load Copy-Move model: {e}")

    def _load_inpainting(self):
        ckpt_path = settings.INPAINTING_WEIGHTS
        meta = self.statuses["inpainting"]
        
        if not ckpt_path.exists():
            meta["is_loaded"] = False
            meta["status"] = "checkpoint_missing"
            meta["error"] = f"Checkpoint file not found at {ckpt_path}"
            logger.warning(f"Inpainting checkpoint missing at {ckpt_path}")
            return

        try:
            model = smp.Unet(
                encoder_name="resnet34",
                encoder_weights=None,
                in_channels=3,
                classes=1
            )
            checkpoint = torch.load(ckpt_path, map_location=self.device, weights_only=False)
            
            # Extract state_dict cleanly
            if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
                state_dict = checkpoint["model_state_dict"]
            elif isinstance(checkpoint, dict) and "state_dict" in checkpoint:
                state_dict = checkpoint["state_dict"]
            else:
                state_dict = checkpoint
                
            model.load_state_dict(state_dict, strict=True)
            model.to(self.device)
            model.eval()
            
            # Warm-up inference
            with torch.inference_mode():
                dummy = torch.zeros(1, 3, 512, 512, device=self.device)
                _ = model(dummy)
                
            self.models["inpainting"] = model
            meta["is_loaded"] = True
            meta["status"] = "operational"
            meta["device"] = str(self.device)
            logger.info("Successfully loaded DEFACTO Inpainting / Object-Removal model.")
        except Exception as e:
            meta["is_loaded"] = False
            meta["status"] = "load_failed"
            meta["error"] = str(e)
            logger.error(f"Failed to load Inpainting model: {e}")

    def get_model(self, model_id: str) -> Optional[torch.nn.Module]:
        return self.models.get(model_id)

    def get_statuses(self) -> Dict[str, Any]:
        return self.statuses

model_registry = ModelRegistry.get_instance()
