"""
Forensic Dossier PDF Export Route
"""

from fastapi import APIRouter, Response, HTTPException, Body
from typing import Dict, Any
from app.services.report_service import report_service

router = APIRouter(tags=["Report"])

@router.post("/report/pdf")
async def export_pdf_report(payload: Dict[str, Any] = Body(...)):
    """
    Generates and downloads a courtroom-grade digital authenticity PDF dossier.
    """
    try:
        pdf_bytes = report_service.generate_pdf_report(payload)
        case_id = payload.get("id", "CASE-AUDIT")
        filename = f"Forensic_Report_{case_id}.pdf"
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate forensic PDF dossier: {str(e)}")
