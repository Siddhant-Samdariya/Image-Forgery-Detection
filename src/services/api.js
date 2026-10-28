import { SAMPLE_CASES } from '../data/mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const FORCE_MOCK = import.meta.env.VITE_ENABLE_MOCK_API === 'true';

/**
 * Health check to verify backend engine status.
 */
export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) return { status: 'offline', error: res.statusText };
    return await res.json();
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}

/**
 * Fetches neural forensic models registry & availability status.
 */
export async function fetchModels() {
  try {
    const res = await fetch(`${API_BASE_URL}/models`);
    if (!res.ok) throw new Error("Failed to fetch models");
    return await res.json();
  } catch (err) {
    console.warn("Using offline model statuses:", err.message);
    return {
      active_device: "Offline / Disconnected",
      total_models: 4,
      loaded_models: 0,
      models: {
        copy_move: {
          id: "copy_move",
          name: "DEFACTO Copy-Move Localization",
          architecture: "U-Net with ResNet-34 Encoder (2 Channels)",
          is_loaded: false,
          status: "backend_unreachable"
        },
        inpainting: {
          id: "inpainting",
          name: "DEFACTO Inpainting Detection",
          architecture: "U-Net with ResNet-34 Encoder (1 Channel)",
          is_loaded: false,
          status: "backend_unreachable"
        },
        splicing: {
          id: "splicing",
          name: "DEFACTO Splicing Localization",
          architecture: "Multi-stream Encoder-Decoder",
          is_loaded: false,
          status: "planned"
        },
        ai_diffusion: {
          id: "ai_diffusion",
          name: "Synthetic AI Diffusion / GAN Footprint",
          architecture: "Spectral ResNet-50 Classifier",
          is_loaded: false,
          status: "planned"
        }
      }
    };
  }
}

/**
 * Normalizes backend response or mock data into a unified forensic report structure.
 */
export function normalizeForensicResult(raw, originalFile = null) {
  if (!raw) return null;

  const preview = originalFile instanceof File 
    ? URL.createObjectURL(originalFile) 
    : raw.previewUrl || raw.image_url || '/samples/street_press_london.jpg';

  return {
    id: raw.id || raw.image_id || `CASE-${Date.now().toString().slice(-4)}`,
    filename: raw.filename || (originalFile ? originalFile.name : "evidence_capture.jpg"),
    previewUrl: preview,
    composite_overlay: raw.composite_overlay || null,
    ingestedDate: raw.ingestedDate || new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
    overallResult: (raw.overallResult || raw.overall_result || 'AUTHENTIC').toUpperCase(),
    confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.85,
    detectionType: raw.detectionType || "Standard Multi-Method Inspection",
    fileSize: raw.fileSize || (originalFile ? `${(originalFile.size / (1024 * 1024)).toFixed(2)} MB` : "6.85 MB"),
    dimensions: raw.dimensions || "Native Dimensions",
    megapixels: raw.megapixels || "N/A",
    colorSpace: raw.colorSpace || "sRGB",
    bitDepth: raw.bitDepth || "24-bit RGB",
    cameraHardware: raw.cameraHardware || "Hardware Unrecorded",
    exposure: raw.exposure || "Standard",
    sha256: raw.sha256 || raw.hash || "Pending Digest",
    exifStatus: raw.exifStatus || "EXIF Parsed",
    processing_duration_ms: raw.processing_duration_ms || raw.duration_ms || 450,

    copy_move: raw.copy_move || null,
    inpainting: raw.inpainting || null,
    metadata: raw.metadata || {},
    findings: raw.findings || [],
    whyFlagged: raw.whyFlagged || [],
    hotspots: raw.hotspots || []
  };
}

/**
 * Executes forensic analysis against the Python FastAPI backend with PyTorch inference.
 */
export async function analyzeImage(fileOrPreset, options = {}, progressCallback) {
  const method = options.method || 'all'; // 'all' | 'copy_move' | 'inpainting' | 'metadata'
  const threshold = typeof options.threshold === 'number' ? options.threshold : 0.5;

  const stages = [
    { step: 1, label: "Cryptographic SHA-256 & Structure Ingest" },
    { step: 2, label: "Aspect-Ratio Preserving Resize & 512×512 Letterbox Padding" },
    { step: 3, label: method === 'inpainting' ? "DEFACTO Inpainting U-Net ResNet-34 Inference" : "DEFACTO Copy-Move U-Net ResNet-34 Inference" },
    { step: 4, label: "Threshold Binarization & Contour Hotspot Extraction" },
    { step: 5, label: "Evidence Dossier Synthesis & Artifact Generation" }
  ];

  for (const stage of stages) {
    if (progressCallback) progressCallback(stage);
    await new Promise(r => setTimeout(r, 120));
  }

  // If mock mode is forced and not a file
  if (FORCE_MOCK && !(fileOrPreset instanceof File)) {
    const match = SAMPLE_CASES.find(c => c.id === fileOrPreset?.id) || SAMPLE_CASES[0];
    return normalizeForensicResult(match);
  }

  // Prepare file upload
  let fileToUpload;
  if (fileOrPreset instanceof File) {
    fileToUpload = fileOrPreset;
  } else if (fileOrPreset?.previewUrl) {
    try {
      const resp = await fetch(fileOrPreset.previewUrl);
      const blob = await resp.blob();
      fileToUpload = new File([blob], fileOrPreset.filename || "sample.jpg", { type: blob.type || "image/jpeg" });
    } catch {
      fileToUpload = null;
    }
  }

  if (!fileToUpload) {
    // Fallback if preset fetch failed
    return normalizeForensicResult(SAMPLE_CASES[0]);
  }

  const formData = new FormData();
  formData.append('file', fileToUpload);

  // Map method to endpoint
  let endpoint = '/analyze/all';
  if (method === 'copy_move') endpoint = '/analyze/copy-move';
  else if (method === 'inpainting') endpoint = '/analyze/inpainting';
  else if (method === 'metadata') endpoint = '/analyze/metadata';

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}?threshold=${threshold}`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errJson.detail || `Server error ${res.status}`);
    }

    const data = await res.json();
    return normalizeForensicResult(data, fileToUpload);
  } catch (err) {
    console.error("Backend analysis failed, falling back to offline demo case:", err);
    // Return sample case marked as offline demo with error notice
    const fallback = SAMPLE_CASES[0];
    return {
      ...normalizeForensicResult(fallback, fileToUpload),
      isOfflineFallback: true,
      offlineError: err.message
    };
  }
}

/**
 * Downloads courtroom-grade forensic PDF report directly from backend.
 */
export async function downloadReportPdf(caseData) {
  try {
    const res = await fetch(`${API_BASE_URL}/report/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(caseData)
    });

    if (!res.ok) {
      throw new Error(`PDF generation failed: ${res.statusText}`);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Forensic_Report_${caseData.id || 'EVIDENCE'}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return true;
  } catch (err) {
    console.error("PDF download failed:", err);
    throw err;
  }
}
