export const SAMPLE_CASES = [
  {
    id: "CASE-2026-8821",
    filename: "street_press_london.jpg",
    previewUrl: "/samples/street_press_london.jpg",
    ingestedDate: "2026-09-25 10:42:15 UTC",
    overallResult: "TAMPERED", // 'AUTHENTIC' | 'SUSPICIOUS' | 'TAMPERED' | 'SYNTHETIC'
    confidence: 0.912,
    detectionType: "Localized Splicing & Compression Anomaly",
    fileSize: "7.42 MB (7,781,376 bytes)",
    dimensions: "4032 × 2688 px",
    megapixels: "10.84 MP",
    colorSpace: "sRGB IEC61966-2.1",
    bitDepth: "24-bit RGB (4:2:0 YCbCr)",
    cameraHardware: "Leica Q2 • 28mm f/1.7",
    exposure: "1/500s • f/2.8 • ISO 200",
    sha256: "8f3c7e42d991b17a42b930d6741aa2bf97f8c148e1009cfbb32e0a24b71e1948",
    exifStatus: "EXIF v2.32 Present (Modified Timestamp Mismatch)",

    findings: [
      {
        id: "F-01",
        finding: "Compression anomaly",
        category: "Quantization & DQT",
        severity: "Medium",
        confidence: 0.82,
        status: "Detected",
        description: "A localized region around X: 1420 Y: 0890 exhibits a secondary DQT quantization matrix mismatch compared to background sensor baseline."
      },
      {
        id: "F-02",
        finding: "Pixel inconsistency",
        category: "Luma Derivative",
        severity: "High",
        confidence: 0.94,
        status: "Detected",
        description: "Pixel-level edge variance along spliced object contours shows abnormal high-frequency phase alignment."
      },
      {
        id: "F-03",
        finding: "Copy-move pattern",
        category: "Keypoint Matching",
        severity: "Low",
        confidence: 0.21,
        status: "Not detected",
        description: "SIFT/ORB feature keypoint matching did not locate duplicated patch clones elsewhere in the frame."
      },
      {
        id: "F-04",
        finding: "Metadata anomaly",
        category: "Header Integrity",
        severity: "Low",
        confidence: 0.18,
        status: "Not detected",
        description: "Baseline ExifTool header parses clean without structural truncation."
      },
      {
        id: "F-05",
        finding: "Diffusion & GAN Footprint",
        category: "Spectral FFT",
        severity: "Low",
        confidence: 0.04,
        status: "Not detected",
        description: "Fourier transform does not display synthetic upsampling checkerboard grid spikes."
      }
    ],

    whyFlagged: [
      {
        title: "Compression Inconsistency",
        subtitle: "DQT Quantization Matrix Delta",
        explanation: "The central portion of the image was re-compressed using a lower quality factor (Q75) than the primary frame (Q92). This strongly indicates an external element inserted post-capture."
      },
      {
        title: "Pixel Inconsistency & Boundary Discontinuity",
        subtitle: "Gradient Phase Discontinuity",
        explanation: "Spatial derivative heatmaps reveal sharp, unnatural variance spikes along the bounding perimeter of the foreground subject, typical of manual cutout paste operations."
      },
      {
        title: "Sensor Noise Mismatch (PRNU Residual)",
        subtitle: "Photo-Response Non-Uniformity Variance",
        explanation: "Extracted high-frequency noise fields demonstrate consistent sensor PRNU across 88% of the frame, but the flagged region exhibits near-zero sensor grain signature."
      }
    ],

    exifData: {
      "Make": "Leica Camera AG",
      "Model": "Leica Q2",
      "LensModel": "Summilux 1:1.7/28mm ASPH.",
      "Software": "Libjpeg-turbo / Adobe Photoshop 25.2 (Macintosh)",
      "DateTimeOriginal": "2026:08:14 14:22:04",
      "ModifyDate": "2026:08:14 15:04:18 (42 min delta)",
      "FocalLength": "28 mm",
      "FNumber": "f/2.8",
      "ExposureTime": "1/500 sec",
      "ISO": "200",
      "ColorSpace": "sRGB",
      "ExifImageWidth": 4032,
      "ExifImageHeight": 2688,
      "Orientation": "Top-Left (Normal)",
      "Compression": "JPEG (old-style)",
      "ResolutionUnit": "inches",
      "XResolution": 300,
      "YResolution": 300
    },

    hotspots: [
      { x: 38, y: 32, width: 24, height: 35, label: "Primary Splicing Zone (Q75 Delta)" },
      { x: 62, y: 45, width: 15, height: 20, label: "Boundary Boundary Discontinuity" }
    ]
  },

  {
    id: "CASE-2026-9042",
    filename: "ai_synthetic_portrait.jpg",
    previewUrl: "/samples/ai_synthetic_portrait.jpg",
    ingestedDate: "2026-09-24 18:11:02 UTC",
    overallResult: "SYNTHETIC",
    confidence: 0.968,
    detectionType: "Latent Diffusion Synthetic Footprint (SDXL / Midjourney v6)",
    fileSize: "2.30 MB (2,410,512 bytes)",
    dimensions: "2048 × 1536 px",
    megapixels: "3.15 MP",
    colorSpace: "sRGB IEC61966-2.1",
    bitDepth: "24-bit RGB",
    cameraHardware: "None (Absence of Physical Sensor Signature)",
    exposure: "N/A (Synthetic Generation)",
    sha256: "e4d7a81903bc184f09281a7409f8c102a94f8812c3b4a5d6e7f8a9b0c1d2e3f4",
    exifStatus: "Stripped / No Hardware EXIF Data",

    findings: [
      {
        id: "F-01",
        finding: "Diffusion Frequency Artifact",
        category: "Spectral FFT",
        severity: "Critical",
        confidence: 0.97,
        status: "Detected",
        description: "2D Fast Fourier Transform exhibits characteristic grid power peaks at 64px and 128px latent spatial frequencies."
      },
      {
        id: "F-02",
        finding: "PRNU Sensor Fingerprint",
        category: "Physical Sensor",
        severity: "Critical",
        confidence: 0.99,
        status: "Missing",
        description: "Zero photo-response non-uniformity detected. Background noise is synthetic Gaussian white noise."
      },
      {
        id: "F-03",
        finding: "Biometric & Iris Symmetry",
        category: "Anatomic Audit",
        severity: "High",
        confidence: 0.89,
        status: "Detected",
        description: "Reflective specular highlights in left vs right pupils show non-coincident light source vectors."
      },
      {
        id: "F-04",
        finding: "EXIF & Camera Hardware Header",
        category: "Header Integrity",
        severity: "High",
        confidence: 0.95,
        status: "Anomaly",
        description: "Complete omission of camera maker notes, lens metadata, and Bayer matrix color filter parameters."
      }
    ],

    whyFlagged: [
      {
        title: "Latent Upsampling Fourier Peaks",
        subtitle: "2D FFT Power Spectrum Spike",
        explanation: "Synthetic generative diffusion networks rely on transposed convolution and latent space upsampling, leaving subtle periodic frequency spikes in the 2D Fourier domain."
      },
      {
        title: "Total Absence of Physical Camera PRNU",
        subtitle: "Sensor Pattern Noise Extraction",
        explanation: "Every silicon camera sensor leaves a unique micro-imperfection noise fingerprint (PRNU). This image shows mathematically random synthetic noise instead of hardware sensor noise."
      },
      {
        title: "Pupillary Catchlight Vector Divergence",
        subtitle: "Illumination Geometry Audit",
        explanation: "Analysis of specular reflections inside the subject's eyes reveals impossible dual-geometry illuminant positions that do not correspond to any single physical studio lighting layout."
      }
    ],

    exifData: {
      "FileFormat": "JPEG",
      "ColorSpace": "sRGB",
      "Software": "CAPI Synthetic Ingest / Python PIL 10.2",
      "CameraMake": "MISSING",
      "CameraModel": "MISSING",
      "ExifVersion": "NOT PRESENT",
      "HardwarePRNU": "0.00% (No Silicon Pattern)"
    },

    hotspots: [
      { x: 45, y: 28, width: 20, height: 18, label: "Iris Specular Reflection Anomaly" },
      { x: 20, y: 70, width: 60, height: 25, label: "Latent Diffusion Noise Uniformity" }
    ]
  }
];

export const PIPELINE_STEPS = [
  { id: "01", name: "Colorspace & Luma Normalization", desc: "Histogram alignment & gamma drift calibration" },
  { id: "02", name: "Quantization & DQT Matrix Integrity", desc: "Libjpeg standard curve vs. vendor encoder matches" },
  { id: "03", name: "Error Level Analysis (ELA)", desc: "Resave variance delta at 75%, 85%, 95% compressions" },
  { id: "04", name: "Wavelet & PRNU Sensor Residual", desc: "Spatial noise extraction & photo-response pattern" },
  { id: "05", name: "Diffusion & GAN Artifact Detection", desc: "Fourier frequency spike & checkerboard artifact audit" }
];
