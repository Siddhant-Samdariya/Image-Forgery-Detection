"""
Forensic Metadata, Hash & EXIF Inspection Service
Extracts cryptographic file digests, header structures, and EXIF parameters.
"""

import hashlib
import io
from typing import Dict, Any, Optional
from PIL import Image, ExifTags

class MetadataService:
    def __init__(self):
        pass

    def extract_metadata(self, image_bytes: bytes, filename: str = "evidence.jpg") -> Dict[str, Any]:
        """
        Extracts structural, cryptographic, and EXIF metadata from raw image bytes.
        """
        # Cryptographic SHA-256 and MD5
        sha256 = hashlib.sha256(image_bytes).hexdigest()
        md5 = hashlib.md5(image_bytes).hexdigest()
        file_size_bytes = len(image_bytes)
        file_size_mb = round(file_size_bytes / (1024 * 1024), 2)
        
        # Open with Pillow for format analysis
        try:
            img = Image.open(io.BytesIO(image_bytes))
            format_name = img.format or "UNKNOWN"
            mode = img.mode
            width, height = img.size
            megapixels = round((width * height) / 1_000_000, 2)
            has_icc = bool(img.info.get("icc_profile"))
            dpi = img.info.get("dpi")
            dpi_str = f"{dpi[0]} × {dpi[1]}" if dpi and isinstance(dpi, tuple) else "Standard / Unspecified"
        except Exception as e:
            return {
                "filename": filename,
                "file_size": f"{file_size_mb} MB ({file_size_bytes:,} bytes)",
                "sha256": sha256,
                "error": f"Unable to parse image structure: {str(e)}"
            }
            
        # Parse EXIF tags
        exif_raw = {}
        gps_info = {}
        has_exif = False
        
        try:
            raw_exif = img.getexif()
            if raw_exif:
                for tag_id, val in raw_exif.items():
                    tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                    
                    # Check for GPS info (Tag ID 34853)
                    if tag_id == 34853 or tag_name == "GPSInfo":
                        has_exif = True
                        if hasattr(val, "items"):
                            for g_id, g_val in val.items():
                                g_name = ExifTags.GPSTAGS.get(g_id, str(g_id))
                                gps_info[g_name] = str(g_val)
                    else:
                        # Clean binary or non-serializable values
                        if isinstance(val, bytes):
                            if len(val) > 64:
                                val_str = f"Binary payload ({len(val)} bytes)"
                            else:
                                try:
                                    val_str = val.decode("utf-8", errors="ignore").strip()
                                except Exception:
                                    val_str = val.hex()
                        else:
                            val_str = str(val).strip()
                            
                        if val_str:
                            exif_raw[tag_name] = val_str
                            has_exif = True
        except Exception:
            pass

        # Interpret specific camera and forensic fields
        camera_make = exif_raw.get("Make", "Unknown / Not recorded")
        camera_model = exif_raw.get("Model", "Unknown / Not recorded")
        software_tag = exif_raw.get("Software", "Not recorded (Stock / Native capture or stripped)")
        date_original = exif_raw.get("DateTimeOriginal") or exif_raw.get("DateTime", "Not recorded")
        lens_model = exif_raw.get("LensModel", "Standard Optics")
        exposure_time = exif_raw.get("ExposureTime", "N/A")
        f_number = exif_raw.get("FNumber", "N/A")
        iso_speed = exif_raw.get("ISOSpeedRatings") or exif_raw.get("ISO", "N/A")
        
        # Exposure summary string
        exposure_summary = f"{exposure_time}s • f/{f_number} • ISO {iso_speed}" if exposure_time != "N/A" else "Standard exposure data unrecorded"
        
        # Evidentiary integrity statement
        if has_exif and ("Adobe" in software_tag or "Photoshop" in software_tag or "GIMP" in software_tag):
            software_note = f"Warning: Software tag indicates post-processing editor ('{software_tag}')."
        elif has_exif:
            software_note = "Standard capture EXIF headers present."
        else:
            software_note = "No EXIF header detected. Common in messaging apps (WhatsApp, Discord, Telegram) or web uploads that strip metadata."

        return {
            "filename": filename,
            "sha256": sha256,
            "md5": md5,
            "file_size": f"{file_size_mb} MB ({file_size_bytes:,} bytes)",
            "dimensions": f"{width} × {height} px",
            "megapixels": f"{megapixels} MP",
            "format": format_name,
            "color_mode": mode,
            "has_icc_profile": has_icc,
            "dpi": dpi_str,
            "has_exif": has_exif,
            "camera_hardware": f"{camera_make} {camera_model}".strip() if camera_make != "Unknown / Not recorded" else "Hardware Unspecified",
            "software": software_tag,
            "capture_date": date_original,
            "exposure": exposure_summary,
            "lens": lens_model,
            "gps_recorded": bool(gps_info),
            "gps_coordinates": gps_info if gps_info else None,
            "raw_exif_tags": exif_raw,
            "forensic_notice": (
                "Technical Notice: The presence or absence of EXIF metadata is not definitive proof of authenticity. "
                "Metadata can be naturally stripped by social platforms or manually forged with basic tools. "
                "Always cross-reference with deep pixel-level model inferences."
            ),
            "software_note": software_note
        }

metadata_service = MetadataService()
