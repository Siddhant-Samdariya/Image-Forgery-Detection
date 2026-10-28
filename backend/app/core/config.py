import os
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Set

# Resolve base directories safely
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
WORKSPACE_ROOT = BACKEND_DIR.parent

@dataclass
class Settings:
    PROJECT_NAME: str = "Digital Image Forensics & Authenticity Analysis Engine"
    API_V1_STR: str = "/api"
    VERSION: str = "4.2.1"
    
    # Model Weights Paths
    COPY_MOVE_WEIGHTS: Path = field(default_factory=lambda: Path(os.getenv(
        "COPY_MOVE_WEIGHTS",
        str(WORKSPACE_ROOT / "models" / "Copy Move Detection" / "defacto_best_epoch23.pth")
    )))
    INPAINTING_WEIGHTS: Path = field(default_factory=lambda: Path(os.getenv(
        "INPAINTING_WEIGHTS",
        str(WORKSPACE_ROOT / "models" / "In-painting detection" / "defacto_unet_r34" / "unet_r34_best.pth")
    )))
    
    # Device
    FORCE_CPU: bool = field(default_factory=lambda: os.getenv("FORCE_CPU", "false").lower() in ("true", "1"))
    
    # Preprocessing
    IMAGE_SIZE: int = 512
    DEFAULT_THRESHOLD: float = 0.5
    
    # Security & Upload constraints
    MAX_FILE_SIZE_BYTES: int = 50 * 1024 * 1024  # 50 MB
    ALLOWED_EXTENSIONS: Set[str] = field(default_factory=lambda: {
        ".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff", ".tif"
    })
    ALLOWED_MIME_TYPES: Set[str] = field(default_factory=lambda: {
        "image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff", "image/x-ms-bmp"
    })
    
    # CORS
    CORS_ORIGINS: List[str] = field(default_factory=lambda: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ])

settings = Settings()
