import React, { useState, useEffect } from 'react';
import { Upload, ArrowRight, Sliders } from 'lucide-react';
import { SAMPLE_CASES } from '../data/mockData';
import { fetchModels } from '../services/api';

export function UploadArea({ onStartAnalysis, selectedCase, setSelectedCase }) {
  const [dragActive, setDragActive] = useState(false);
  const [customFile, setCustomFile] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('all'); // 'all' | 'copy_move' | 'inpainting' | 'metadata'
  const [threshold, setThreshold] = useState(0.5);
  const [modelRegistry, setModelRegistry] = useState(null);

  const activeCase = selectedCase || SAMPLE_CASES[0];

  useEffect(() => {
    let mounted = true;
    fetchModels().then(data => {
      if (mounted) {
        setModelRegistry(data);
        setLoadingModels(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setCustomFile(file);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCustomFile(file);
    }
  };

  const handleTriggerAnalysis = () => {
    const payload = customFile || activeCase;
    onStartAnalysis(payload, { method: selectedMethod, threshold });
  };

  const currentFilename = customFile ? customFile.name : activeCase.filename;
  const currentSize = customFile ? `${(customFile.size / (1024 * 1024)).toFixed(2)} MB` : activeCase.fileSize;
  const previewSrc = customFile ? URL.createObjectURL(customFile) : activeCase.previewUrl;

  const cmStatus = modelRegistry?.models?.copy_move?.is_loaded;
  const inpStatus = modelRegistry?.models?.inpainting?.is_loaded;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Evidence Intake & Ingestion</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Submit image evidence for neural tampering localization, segmentation, and cryptographic verification.
          </p>
        </div>

        {/* Live Model Status Badges */}
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs border ${
            cmStatus 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cmStatus ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>Copy-Move Model: {cmStatus ? 'Loaded' : 'Connecting'}</span>
          </span>

          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs border ${
            inpStatus 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${inpStatus ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>Inpainting Model: {inpStatus ? 'Loaded' : 'Connecting'}</span>
          </span>
        </div>
      </div>

      {/* Main Dropzone / Staging Box */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border border-dashed rounded-xs p-8 text-center transition-all ${
          dragActive
            ? 'border-cyan-500 bg-cyan-500/5 dark:bg-cyan-950/20'
            : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-400 dark:hover:border-slate-700'
        }`}
      >
        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
          Drop image here or <label className="text-cyan-600 dark:text-cyan-400 font-semibold underline cursor-pointer">browse files<input type="file" className="hidden" accept="image/*" onChange={handleFileInput} /></label>
        </div>
        <div className="text-xs text-slate-500 mt-1 font-mono">
          JPEG • PNG • WEBP • TIFF • BMP (Up to 50MB)
        </div>
      </div>

      {/* Quick Sample Presets */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500">
        <span className="uppercase tracking-wider text-[11px]">Or load benchmark presets:</span>
        {SAMPLE_CASES.map((c) => (
          <button
            key={c.id}
            onClick={() => { setCustomFile(null); setSelectedCase(c); }}
            className={`px-2.5 py-1 rounded-xs border transition-colors ${
              activeCase.id === c.id && !customFile
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 font-semibold'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {c.filename}
          </button>
        ))}
      </div>

      {/* Forensic Pipeline Configuration */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xs p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
              Forensic Pipeline Settings
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Target Device: {modelRegistry?.active_device || "CPU"}</span>
        </div>

        {/* Method Selection Radio Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          <label className={`p-3.5 border rounded-xs cursor-pointer flex flex-col justify-between transition-all ${
            selectedMethod === 'all'
              ? 'border-cyan-500 bg-cyan-500/5 dark:bg-cyan-950/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                  Full Evidentiary Audit (Multi-Model)
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Runs Copy-Move (Donor/Probe) + Inpainting + Metadata verification concurrently.
                </div>
              </div>
              <input
                type="radio"
                name="analysisMethod"
                value="all"
                checked={selectedMethod === 'all'}
                onChange={() => setSelectedMethod('all')}
                className="mt-0.5 text-cyan-600"
              />
            </div>
            <div className="mt-2 text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
              [Recommended Forensic Protocol]
            </div>
          </label>

          <label className={`p-3.5 border rounded-xs cursor-pointer flex flex-col justify-between transition-all ${
            selectedMethod === 'copy_move'
              ? 'border-cyan-500 bg-cyan-500/5 dark:bg-cyan-950/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                  DEFACTO Copy-Move Localization
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Deep U-Net ResNet-34 separating cloned source (Donor) and pasted target (Probe).
                </div>
              </div>
              <input
                type="radio"
                name="analysisMethod"
                value="copy_move"
                checked={selectedMethod === 'copy_move'}
                onChange={() => setSelectedMethod('copy_move')}
                className="mt-0.5 text-cyan-600"
              />
            </div>
            <div className="mt-2 text-[10px] font-mono text-slate-400">
              2 Output Segmentation Channels
            </div>
          </label>

          <label className={`p-3.5 border rounded-xs cursor-pointer flex flex-col justify-between transition-all ${
            selectedMethod === 'inpainting'
              ? 'border-cyan-500 bg-cyan-500/5 dark:bg-cyan-950/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                  DEFACTO Inpainting / Object Removal
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Deep U-Net ResNet-34 segmenting boundary artifacts from fill/removal tools.
                </div>
              </div>
              <input
                type="radio"
                name="analysisMethod"
                value="inpainting"
                checked={selectedMethod === 'inpainting'}
                onChange={() => setSelectedMethod('inpainting')}
                className="mt-0.5 text-cyan-600"
              />
            </div>
            <div className="mt-2 text-[10px] font-mono text-slate-400">
              1 Output Segmentation Channel
            </div>
          </label>

          <label className={`p-3.5 border rounded-xs cursor-pointer flex flex-col justify-between transition-all ${
            selectedMethod === 'metadata'
              ? 'border-cyan-500 bg-cyan-500/5 dark:bg-cyan-950/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                  Metadata & Cryptographic Hash Only
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Fast inspection of EXIF tags, camera hardware, software signatures, and SHA-256 digest.
                </div>
              </div>
              <input
                type="radio"
                name="analysisMethod"
                value="metadata"
                checked={selectedMethod === 'metadata'}
                onChange={() => setSelectedMethod('metadata')}
                className="mt-0.5 text-cyan-600"
              />
            </div>
            <div className="mt-2 text-[10px] font-mono text-slate-400">
              Lightweight Header Parse
            </div>
          </label>

        </div>

        {/* Sensitivity / Binarization Threshold Slider */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-600 dark:text-slate-300 font-semibold">
              Binarization Probability Threshold: <span className="text-cyan-600 dark:text-cyan-400">{threshold.toFixed(2)}</span>
            </span>
            <span className="text-slate-400 text-[11px]">
              Default: 0.50 (DEFACTO Benchmark Standard)
            </span>
          </div>
          <input
            type="range"
            min="0.10"
            max="0.90"
            step="0.05"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-full accent-cyan-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>0.10 (High Sensitivity / Permissive)</span>
            <span>0.50 (Calibrated Baseline)</span>
            <span>0.90 (High Specificity / Conservative)</span>
          </div>
        </div>
      </div>

      {/* Staged File Preview & Dominant Action */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4">
        <div className="flex items-center justify-between font-mono text-xs text-slate-500">
          <span>Staged Evidence Payload</span>
          <span>{currentFilename} ({currentSize})</span>
        </div>

        <div className="bg-slate-950 rounded-xs border border-slate-800 max-h-[380px] overflow-hidden flex items-center justify-center p-2 relative">
          <img
            src={previewSrc}
            alt="Staged evidence preview"
            className="max-h-[340px] object-contain"
          />
          <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-xs border border-slate-700 text-slate-300 text-[10px] font-mono px-2 py-1 rounded-xs">
            Ready for Neural Ingestion
          </div>
        </div>

        <button
          onClick={handleTriggerAnalysis}
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-sm rounded-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Run Forensic Analysis</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
