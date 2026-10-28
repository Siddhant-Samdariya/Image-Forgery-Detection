"""
Forensic Report PDF Generation Service using ReportLab
Generates evidentiary, courtroom-grade digital authenticity PDF dossiers.
"""

import io
from datetime import datetime
from typing import Dict, Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether
)

class ReportService:
    def __init__(self):
        pass

    def generate_pdf_report(self, analysis_data: Dict[str, Any]) -> bytes:
        """
        Builds a comprehensive forensic PDF report buffer from analysis results.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        
        styles = getSampleStyleSheet()
        
        # Forensic Custom Styles
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=colors.HexColor("#0f172a")
        )
        
        subtitle_style = ParagraphStyle(
            "DocSubTitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#64748b")
        )
        
        heading_style = ParagraphStyle(
            "SectionHeading",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#1e293b"),
            spaceBefore=10,
            spaceAfter=4
        )
        
        body_style = ParagraphStyle(
            "Body",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11.5,
            textColor=colors.HexColor("#334155")
        )
        
        mono_style = ParagraphStyle(
            "Mono",
            parent=styles["Normal"],
            fontName="Courier",
            fontSize=7.5,
            leading=10,
            textColor=colors.HexColor("#0f172a")
        )
        
        badge_style = ParagraphStyle(
            "Badge",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=11,
            textColor=colors.white
        )

        elements = []
        
        # 1. Header Banner
        header_data = [
            [
                Paragraph("VERISIGHT DIGITAL FORENSICS & AUTHENTICITY ANALYSIS", title_style),
                Paragraph(f"DOSSIER ID: {analysis_data.get('id', 'CASE-AUDIT')}<br/>DATE: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}", subtitle_style)
            ]
        ]
        t_header = Table(header_data, colWidths=[4.2 * inch, 3.0 * inch])
        t_header.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))
        elements.append(t_header)
        elements.append(Spacer(1, 8))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0f172a"), spaceBefore=4, spaceAfter=12))

        # 2. Executive Assessment Banner
        overall = analysis_data.get("overallResult", "INSPECTED").upper()
        conf = analysis_data.get("confidence", 0.0)
        conf_pct = f"{round(conf * 100, 1)}%"
        
        banner_color = colors.HexColor("#b91c1c") if "TAMPER" in overall else (
            colors.HexColor("#d97706") if "SUSP" in overall else colors.HexColor("#15803d")
        )
        
        assessment_text = f"<b>PRIMARY VERDICT:</b> {overall} &nbsp;|&nbsp; <b>MAX MODEL CONFIDENCE:</b> {conf_pct} &nbsp;|&nbsp; <b>TARGET TASK:</b> {analysis_data.get('detectionType', 'Multi-Model Deep Ingest')}"
        assessment_table = Table([[Paragraph(assessment_text, badge_style)]], colWidths=[7.2 * inch])
        assessment_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), banner_color),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(assessment_table)
        elements.append(Spacer(1, 10))

        # 3. Evidence Payload Telemetry
        elements.append(Paragraph("1. EVIDENCE PAYLOAD TELEMETRY", heading_style))
        meta = analysis_data.get("metadata", {})
        
        telemetry_rows = [
            [Paragraph("<b>Filename:</b>", body_style), Paragraph(str(analysis_data.get("filename", "evidence.jpg")), mono_style),
             Paragraph("<b>Payload Size:</b>", body_style), Paragraph(str(analysis_data.get("fileSize", "N/A")), body_style)],
            [Paragraph("<b>Native Dimensions:</b>", body_style), Paragraph(str(analysis_data.get("dimensions", "N/A")), body_style),
             Paragraph("<b>Megapixels:</b>", body_style), Paragraph(str(analysis_data.get("megapixels", "N/A")), body_style)],
            [Paragraph("<b>Color Space:</b>", body_style), Paragraph(str(analysis_data.get("colorSpace", "sRGB")), body_style),
             Paragraph("<b>Camera Hardware:</b>", body_style), Paragraph(str(analysis_data.get("cameraHardware", "Unrecorded")), body_style)],
            [Paragraph("<b>SHA-256 Digest:</b>", body_style), Paragraph(str(analysis_data.get("sha256", "N/A")), mono_style), "", ""]
        ]
        
        t_telemetry = Table(telemetry_rows, colWidths=[1.4 * inch, 2.2 * inch, 1.4 * inch, 2.2 * inch])
        t_telemetry.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('SPAN', (1, 3), (3, 3)),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t_telemetry)
        elements.append(Spacer(1, 10))

        # 4. Neural Forensic Methods Executed
        elements.append(Paragraph("2. DEEP NEURAL METHODS EXECUTED", heading_style))
        methods_rows = [
            [
                Paragraph("<b>Pipeline Method</b>", body_style),
                Paragraph("<b>Model Architecture</b>", body_style),
                Paragraph("<b>Status / Finding</b>", body_style),
                Paragraph("<b>Coverage / Metric</b>", body_style)
            ]
        ]
        
        # Add copy move row if present
        cm_data = analysis_data.get("copy_move")
        if cm_data and cm_data.get("available"):
            cm_status = "TAMPERING DETECTED" if cm_data.get("detected") else "CLEAN (Below Threshold)"
            cm_cov = f"Donor: {cm_data.get('donor', {}).get('coverage_pct', 0)}% | Probe: {cm_data.get('probe', {}).get('coverage_pct', 0)}%"
            methods_rows.append([
                Paragraph("DEFACTO Copy-Move Localization", body_style),
                Paragraph("U-Net (ResNet-34 Encoder, 2 Channels)", body_style),
                Paragraph(cm_status, body_style),
                Paragraph(cm_cov, body_style)
            ])
            
        # Add inpainting row if present
        inp_data = analysis_data.get("inpainting")
        if inp_data and inp_data.get("available"):
            inp_status = "INPAINTING DETECTED" if inp_data.get("detected") else "CLEAN (Below Threshold)"
            inp_cov = f"Coverage: {inp_data.get('coverage_pct', 0)}% (Max Conf: {inp_data.get('max_confidence', 0)})"
            methods_rows.append([
                Paragraph("DEFACTO Inpainting / Removal", body_style),
                Paragraph("U-Net (ResNet-34 Encoder, 1 Channel)", body_style),
                Paragraph(inp_status, body_style),
                Paragraph(inp_cov, body_style)
            ])
            
        t_methods = Table(methods_rows, colWidths=[2.2 * inch, 2.3 * inch, 1.4 * inch, 1.3 * inch])
        t_methods.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#94a3b8")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t_methods)
        elements.append(Spacer(1, 10))

        # 5. Detected Regions / Hotspots
        hotspots = analysis_data.get("hotspots", [])
        if hotspots:
            elements.append(Paragraph("3. LOCALIZED EVIDENCE HOTSPOTS & BOUNDING REGIONS", heading_style))
            hotspot_rows = [
                [
                    Paragraph("<b>Region Index</b>", body_style),
                    Paragraph("<b>Classification Label</b>", body_style),
                    Paragraph("<b>Position & Dimensions</b>", body_style),
                    Paragraph("<b>Peak Confidence</b>", body_style)
                ]
            ]
            for i, h in enumerate(hotspots[:6], 1):
                pos_str = f"X: {h.get('x', 0)}%, Y: {h.get('y', 0)}% ({h.get('width', 0)}% × {h.get('height', 0)}%)"
                hotspot_rows.append([
                    Paragraph(f"ROI-{i:02d}", mono_style),
                    Paragraph(str(h.get("label", "Suspected Manipulation")), body_style),
                    Paragraph(pos_str, body_style),
                    Paragraph(f"{round(h.get('max_confidence', 0) * 100, 1)}%", body_style)
                ])
                
            t_hotspots = Table(hotspot_rows, colWidths=[1.1 * inch, 2.7 * inch, 2.2 * inch, 1.2 * inch])
            t_hotspots.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
                ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ]))
            elements.append(t_hotspots)
            elements.append(Spacer(1, 10))

        # 6. Evidentiary Limitations & Technical Disclaimer
        elements.append(KeepTogether([
            Paragraph("4. SCIENTIFIC LIMITATIONS & EVIDENTIARY INTERPRETATION", heading_style),
            Paragraph(
                "<b>Notice on Neural Inference:</b> Neural segmentation models produce statistical likelihood maps based on learned patterns from training corpora (DEFACTO dataset). A predicted segmentation mask is strong evidentiary indication of manipulation, but does NOT constitute standalone absolute mathematical proof. False positives may occur along high-frequency textures, specular highlights, and aggressive JPEG compression borders. Conversely, an empty prediction mask does not definitively prove authenticity, as sophisticated multi-generation resaving or tiny clone patches (<1% image area) may escape detection thresholds.",
                body_style
            ),
            Spacer(1, 4),
            Paragraph(
                "<b>Notice on Metadata:</b> EXIF headers and metadata records can be effortlessly altered, stripped, or spoofed by consumer software and social web applications. Metadata integrity should only be evaluated in conjunction with raw sensor noise characteristics (PRNU) and pixel-level deep segmentation.",
                body_style
            ),
            Spacer(1, 8),
            HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#94a3b8"), spaceBefore=4, spaceAfter=6),
            Paragraph("VERISIGHT FORENSICS PLATFORM • GENERATED AUTOMATICALLY BY SECURE SERVER-SIDE ENGINE • FOR EVALUATION & INVESTIGATIVE PURPOSES", subtitle_style)
        ]))

        doc.build(elements)
        return buffer.getvalue()

report_service = ReportService()
