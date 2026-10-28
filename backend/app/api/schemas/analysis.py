"""
Pydantic Schemas for Forensic Analysis API Contracts
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class BenchmarkMetrics(BaseModel):
    benchmark_dataset: Optional[str] = None
    evaluation_note: Optional[str] = None
    image_level_recall: Optional[str] = None
    donor_dice: Optional[str] = None
    probe_dice: Optional[str] = None
    known_limitations: Optional[str] = None

class ModelInfo(BaseModel):
    id: str
    name: str
    task: str
    architecture: str
    input_specs: str
    output_specs: str
    is_loaded: bool
    status: str
    checkpoint_path: Optional[str] = None
    device: Optional[str] = None
    metrics_reference: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class ModelsRegistryResponse(BaseModel):
    models: Dict[str, ModelInfo]
    active_device: str
    total_models: int
    loaded_models: int

class HotspotROI(BaseModel):
    x: float
    y: float
    width: float
    height: float
    pixel_bbox: Optional[Dict[str, int]] = None
    area_pixels: Optional[int] = None
    max_confidence: float
    label: str

class ChannelResult(BaseModel):
    detected: bool
    coverage_pct: float
    max_confidence: float
    active_pixels: int
    mask_overlay_png: Optional[str] = None

class CopyMoveResult(BaseModel):
    available: bool
    model_name: Optional[str] = None
    detected: bool = False
    threshold: float = 0.5
    donor: Optional[ChannelResult] = None
    probe: Optional[ChannelResult] = None
    composite_overlay: Optional[str] = None
    hotspots: List[HotspotROI] = Field(default_factory=list)
    duration_ms: float = 0.0
    benchmark_reference: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class InpaintingResult(BaseModel):
    available: bool
    model_name: Optional[str] = None
    detected: bool = False
    threshold: float = 0.5
    coverage_pct: float = 0.0
    max_confidence: float = 0.0
    active_pixels: int = 0
    mask_overlay_png: Optional[str] = None
    composite_overlay: Optional[str] = None
    hotspots: List[HotspotROI] = Field(default_factory=list)
    duration_ms: float = 0.0
    benchmark_reference: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class MetadataFinding(BaseModel):
    id: str
    finding: str
    category: str
    severity: str
    confidence: float
    status: str
    description: str

class WhyFlaggedItem(BaseModel):
    title: str
    subtitle: str
    explanation: str

class UnifiedForensicAnalysisResponse(BaseModel):
    id: str
    filename: str
    ingestedDate: str
    overallResult: str  # 'AUTHENTIC' | 'SUSPICIOUS' | 'TAMPERED'
    confidence: float
    detectionType: str
    fileSize: str
    dimensions: str
    megapixels: str
    colorSpace: str
    bitDepth: str
    cameraHardware: str
    exposure: str
    sha256: str
    exifStatus: str
    copy_move: Optional[CopyMoveResult] = None
    inpainting: Optional[InpaintingResult] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    findings: List[MetadataFinding] = Field(default_factory=list)
    whyFlagged: List[WhyFlaggedItem] = Field(default_factory=list)
    hotspots: List[HotspotROI] = Field(default_factory=list)
    composite_overlay: Optional[str] = None
    processing_duration_ms: float = 0.0
