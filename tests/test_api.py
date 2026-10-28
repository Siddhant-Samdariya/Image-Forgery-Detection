"""
Integration Tests for FastAPI Endpoints
"""

import sys
from pathlib import Path
import io
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from starlette.testclient import TestClient
from app.main import app

def create_test_image_bytes(width=200, height=150, color=(100, 150, 200)) -> bytes:
    img = Image.new("RGB", (width, height), color=color)
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG")
    return buffer.getvalue()

def run_all_tests():
    with TestClient(app) as client:
        # 1. Health
        res = client.get("/api/health")
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["status"] == "operational"
        assert "models_loaded" in data
        print("[PASS] Health check passed")

        # 2. Models
        res = client.get("/api/models")
        assert res.status_code == 200, res.text
        data = res.json()
        assert "models" in data
        assert data["models"]["copy_move"]["is_loaded"] is True
        assert data["models"]["inpainting"]["is_loaded"] is True
        assert data["models"]["splicing"]["status"] == "planned"
        print("[PASS] Models registry query passed")

        # 3. Metadata
        img_bytes = create_test_image_bytes()
        res = client.post(
            "/api/analyze/metadata",
            files={"file": ("test_sample.jpg", img_bytes, "image/jpeg")}
        )
        assert res.status_code == 200, res.text
        data = res.json()
        assert "sha256" in data
        assert "dimensions" in data
        assert "200 × 150 px" in data["dimensions"]
        print("[PASS] Metadata extraction passed")

        # 4. Copy-Move Analysis
        res = client.post(
            "/api/analyze/copy-move?threshold=0.5",
            files={"file": ("test_sample.jpg", img_bytes, "image/jpeg")}
        )
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["available"] is True
        assert "donor" in data
        assert "probe" in data
        assert "composite_overlay" in data
        print("[PASS] Copy-move analysis passed")

        # 5. Inpainting Analysis
        res = client.post(
            "/api/analyze/inpainting?threshold=0.5",
            files={"file": ("test_sample.jpg", img_bytes, "image/jpeg")}
        )
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["available"] is True
        assert "coverage_pct" in data
        assert "mask_overlay_png" in data
        print("[PASS] Inpainting analysis passed")

        # 6. Combined Full Analysis
        res = client.post(
            "/api/analyze/all?threshold=0.5",
            files={"file": ("test_sample.jpg", img_bytes, "image/jpeg")}
        )
        assert res.status_code == 200, res.text
        data = res.json()
        assert "id" in data
        assert "overallResult" in data
        assert "findings" in data
        assert "copy_move" in data
        assert "inpainting" in data
        assert "metadata" in data
        print("[PASS] Combined multi-model analysis passed")

        # 7. PDF Report Generation
        pdf_res = client.post("/api/report/pdf", json=data)
        assert pdf_res.status_code == 200, pdf_res.text
        assert pdf_res.headers["content-type"] == "application/pdf"
        assert len(pdf_res.content) > 1000
        assert pdf_res.content.startswith(b"%PDF")
        print("[PASS] Server-side PDF generation passed")

if __name__ == "__main__":
    run_all_tests()
    print("\nALL API INTEGRATION TESTS PASSED SUCCESSFULLY!")
