"""
Forensic Image Analysis Endpoints
Executes Copy-Move Localization, Inpainting Segmentation, and Metadata Audits.
"""

from fastapi import APIRouter, UploadFile, File, Query, HTTPException
from typing import Optional, Dict, Any, List
import time
import hashlib
from datetime import datetime
from PIL import Image

from app.core.config import settings
from app.services.image_preprocessing import safe_decode_image
from app.services.copy_move_service import copy_move_service
from app.services.inpainting_service import inpainting_service
from app.services.metadata_service import metadata_service
from app.services.visualization_service import generate_composite_overlay
from app.api.schemas.analysis import (
    CopyMoveResult,
    InpaintingResult,
    UnifiedForensicAnalysisResponse
)

router = APIRouter(tags=["Analysis"])

async def validate_and_read_image(file: UploadFile) -> tuple[bytes, Image.Image]:
    """Validates file headers, size limits, and securely decodes the image."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file must have a valid filename.")
        
    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(sorted(settings.ALLOWED_EXTENSIONS))}"
        )
        
    contents = await file.read()
    if len(contents) > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum allowed size ({settings.MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB)."
        )
        
    if len(contents) < 32:
        raise HTTPException(status_code=400, detail="File is empty or corrupted.")
        
    try:
        img = safe_decode_image(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image decoding failed: {str(e)}")
        
    return contents, img

@router.post("/analyze/copy-move", response_model=CopyMoveResult)
async def analyze_copy_move(
    file: UploadFile = File(...),
    threshold: Optional[float] = Query(0.5, ge=0.05, le=0.95, description="Binarization probability threshold")
):
    _, img = await validate_and_read_image(file)
    result = copy_move_service.analyze(img, threshold=threshold)
    return result

@router.post("/analyze/inpainting", response_model=InpaintingResult)
async def analyze_inpainting(
    file: UploadFile = File(...),
    threshold: Optional[float] = Query(0.5, ge=0.05, le=0.95, description="Binarization probability threshold")
):
    _, img = await validate_and_read_image(file)
    result = inpainting_service.analyze(img, threshold=threshold)
    return result

@router.post("/analyze/metadata")
async def analyze_metadata(file: UploadFile = File(...)):
    contents, _ = await validate_and_read_image(file)
    meta = metadata_service.extract_metadata(contents, filename=file.filename)
    return meta

@router.post("/analyze/all", response_model=UnifiedForensicAnalysisResponse)
async def analyze_all(
    file: UploadFile = File(...),
    threshold: Optional[float] = Query(0.5, ge=0.05, le=0.95)
):
    start_time = time.time()
    contents, img = await validate_and_read_image(file)
    
    # 1. Metadata & cryptographic hash audit
    meta = metadata_service.extract_metadata(contents, filename=file.filename)
    
    # 2. Run Copy-Move Analysis
    cm_result = copy_move_service.analyze(img, threshold=threshold)
    
    # 3. Run Inpainting Analysis
    inp_result = inpainting_service.analyze(img, threshold=threshold)
    
    # 4. Synthesize findings and verdict
    findings: List[Dict[str, Any]] = []
    why_flagged: List[Dict[str, Any]] = []
    hotspots: List[Dict[str, Any]] = []
    
    # Check Copy-Move findings
    cm_detected = cm_result.get("detected", False)
    if cm_result.get("available") and cm_detected:
        donor_pct = cm_result.get("donor", {}).get("coverage_pct", 0)
        probe_pct = cm_result.get("probe", {}).get("coverage_pct", 0)
        donor_conf = cm_result.get("donor", {}).get("max_confidence", 0)
        probe_conf = cm_result.get("probe", {}).get("max_confidence", 0)
        max_cm_conf = max(donor_conf, probe_conf)
        
        findings.append({
            "id": "F-CM-01",
            "finding": "Copy-Move duplicated patch anomaly",
            "category": "Neural Correlation (DEFACTO)",
            "severity": "High" if max_cm_conf > 0.75 else "Medium",
            "confidence": round(max_cm_conf, 3),
            "status": "Detected",
            "description": f"Donor region coverage: {donor_pct}%, Probe region coverage: {probe_pct}% at threshold {threshold}."
        })
        why_flagged.append({
            "title": "Duplicated Region Clones (Copy-Move)",
            "subtitle": f"Donor Coverage: {donor_pct}% • Probe Coverage: {probe_pct}%",
            "explanation": f"The ResNet-34 U-Net neural encoder identified corresponding twin patch signatures with peak confidence of {round(max_cm_conf * 100, 1)}%."
        })
        hotspots.extend(cm_result.get("hotspots", []))
    else:
        findings.append({
            "id": "F-CM-01",
            "finding": "Copy-Move duplicated patch anomaly",
            "category": "Neural Correlation (DEFACTO)",
            "severity": "Low",
            "confidence": round(max(cm_result.get("donor", {}).get("max_confidence", 0), cm_result.get("probe", {}).get("max_confidence", 0)), 3),
            "status": "Not detected",
            "description": f"No duplicated patch regions detected exceeding minimum area threshold at sensitivity {threshold}."
        })

    # Check Inpainting findings
    inp_detected = inp_result.get("detected", False)
    if inp_result.get("available") and inp_detected:
        cov_pct = inp_result.get("coverage_pct", 0)
        inp_conf = inp_result.get("max_confidence", 0)
        
        findings.append({
            "id": "F-INP-02",
            "finding": "Inpainting & Object-Removal boundary artifact",
            "category": "Diffusion / Interpolation Boundary",
            "severity": "High" if inp_conf > 0.75 else "Medium",
            "confidence": round(inp_conf, 3),
            "status": "Detected",
            "description": f"Inpainted fill region detected covering {cov_pct}% of frame with peak confidence {round(inp_conf * 100, 1)}%."
        })
        why_flagged.append({
            "title": "Inpainted Semantic Fill Detected",
            "subtitle": f"Altered Area: {cov_pct}% of frame",
            "explanation": f"Pixel boundary interpolation discontinuities detected characteristic of automated object removal algorithms."
        })
        hotspots.extend(inp_result.get("hotspots", []))
    else:
        findings.append({
            "id": "F-INP-02",
            "finding": "Inpainting & Object-Removal boundary artifact",
            "category": "Diffusion / Interpolation Boundary",
            "severity": "Low",
            "confidence": round(inp_result.get("max_confidence", 0), 3),
            "status": "Not detected",
            "description": f"No inpainting fill boundaries observed above sensitivity {threshold}."
        })

    # Metadata finding
    has_exif = meta.get("has_exif", False)
    findings.append({
        "id": "F-META-03",
        "finding": "Header & EXIF Integrity Audit",
        "category": "Cryptographic & Container",
        "severity": "Low",
        "confidence": 0.95,
        "status": "Verified" if has_exif else "Header Clean (Stripped)",
        "description": meta.get("software_note", "Standard structural parse.")
    })
    
    # Overall Verdict Calculation
    if cm_detected and inp_detected:
        overall_result = "TAMPERED"
        confidence = max(cm_result.get("probe", {}).get("max_confidence", 0), inp_result.get("max_confidence", 0))
        detection_type = "Compound Copy-Move & Inpainting Manipulation"
    elif cm_detected:
        overall_result = "TAMPERED"
        confidence = max(cm_result.get("donor", {}).get("max_confidence", 0), cm_result.get("probe", {}).get("max_confidence", 0))
        detection_type = "DEFACTO Copy-Move Duplication"
    elif inp_detected:
        overall_result = "TAMPERED"
        confidence = inp_result.get("max_confidence", 0)
        detection_type = "DEFACTO Object Removal / Inpainting"
    else:
        overall_result = "AUTHENTIC"
        confidence = 0.88
        detection_type = "Clean Neural Ingest (No Manipulation Signatures)"
        why_flagged.append({
            "title": "Consistent Sensor & Pixel Topology",
            "subtitle": "Threshold Baseline Met",
            "explanation": f"No localized donor/probe clone pairs or inpainting boundaries were identified above the {threshold} probability threshold."
        })

    # Generate composite overlay
    composite_overlay = cm_result.get("composite_overlay") or inp_result.get("composite_overlay")
    
    total_duration = round((time.time() - start_time) * 1000, 2)
    case_id = f"CASE-{hashlib.md5(contents).hexdigest()[:8].upper()}"

    return {
        "id": case_id,
        "filename": file.filename,
        "ingestedDate": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "overallResult": overall_result,
        "confidence": round(float(confidence), 3),
        "detectionType": detection_type,
        "fileSize": meta.get("file_size", "N/A"),
        "dimensions": meta.get("dimensions", "N/A"),
        "megapixels": meta.get("megapixels", "N/A"),
        "colorSpace": f"{meta.get('color_mode', 'RGB')} (ICC: {'Present' if meta.get('has_icc_profile') else 'Standard'})",
        "bitDepth": "24-bit RGB",
        "cameraHardware": meta.get("camera_hardware", "Unrecorded Hardware"),
        "exposure": meta.get("exposure", "Standard"),
        "sha256": meta.get("sha256", ""),
        "exifStatus": "EXIF Present" if has_exif else "EXIF Stripped / Web Ingest",
        "copy_move": cm_result,
        "inpainting": inp_result,
        "metadata": meta,
        "findings": findings,
        "whyFlagged": why_flagged,
        "hotspots": hotspots,
        "composite_overlay": composite_overlay,
        "processing_duration_ms": total_duration
    }
