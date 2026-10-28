import React, { useState } from 'react';
import { ResultBanner } from '../components/ResultBanner';
import { ForensicCanvasViewer } from '../components/ForensicCanvasViewer';
import { FindingTable } from '../components/FindingTable';
import { WhyFlaggedSection } from '../components/WhyFlaggedSection';
import { SAMPLE_CASES } from '../data/mockData';
import { downloadReportPdf } from '../services/api';
import { 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  Cpu, 
  Download, 
  AlertTriangle, 
  Info 
} from 'lucide-react';

export function ResultsPage({ currentCase, onOpenStudio, onOpenReport }) {
  const [activeCanvasTab, setActiveCanvasTab] = useState('overlay');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const activeCase = currentCase || SAMPLE_CASES[0];

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      await downloadReportPdf(activeCase);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Could not generate server-side PDF dossier. Please verify the backend service is running.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const copyMoveData = activeCase.copy_move;
  const inpaintingData = activeCase.inpainting;

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      
      {/* 1. Result Header Banner */}
      <ResultBanner
        caseData={activeCase}
        onOpenStudio={onOpenStudio}
        onOpenReport={onOpenReport}
      />

      {/* Offline / Fallback Notice Banner if relevant */}
      {activeCase.isOfflineFallback && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xs flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 font-mono">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Notice: Displaying offline reference dataset because the Python FastAPI backend was unreachable ({activeCase.offlineError}).</span>
          </div>
        </div>
      )}

      {/* 2. Model Execution Telemetry Pillbox */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xs">
          <span className="text-slate-400 text-[10px] uppercase block">Analysis Protocol</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block mt-0.5">
            {activeCase.detectionType}
          </span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xs">
          <span className="text-slate-400 text-[10px] uppercase block">Inference Duration</span>
          <span className="font-semibold text-cyan-600 dark:text-cyan-400 flex items-center gap-1 mt-0.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{activeCase.processing_duration_ms || 320} ms</span>
          </span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xs">
          <span className="text-slate-400 text-[10px] uppercase block">Pixel Dimensions</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
            {activeCase.dimensions} ({activeCase.megapixels})
          </span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-[10px] uppercase block">Courtroom Report</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] block mt-0.5">
              PDF Dossier
            </span>
          </div>
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="px-2.5 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xs text-[11px] hover:bg-slate-800 dark:hover:bg-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>{downloadingPdf ? 'Exporting...' : 'PDF'}</span>
          </button>
        </div>
      </div>

      {/* 3. DOMINANT IMAGE VIEWER (Centerpiece) */}
      <div className="space-y-2">
        <div className="flex justify-between items-center font-mono text-xs text-slate-500 px-1">
          <span>Inspection Canvas • {activeCase.filename}</span>
          <span className="uppercase text-[11px] text-cyan-600 dark:text-cyan-400">Layer: {activeCanvasTab}</span>
        </div>

        <ForensicCanvasViewer
          caseData={activeCase}
          activeMode={activeCanvasTab}
          setActiveMode={setActiveCanvasTab}
        />
      </div>

      {/* 4. Model Output Telemetry & Scientific Calibration Breakdown */}
      {(copyMoveData || inpaintingData) && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xs p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <Cpu className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Active Neural Model Telemetry & Calibration Benchmarks
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Copy-Move Model Telemetry */}
            {copyMoveData && (
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xs space-y-2.5 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-slate-100">DEFACTO Copy-Move Model</span>
                  <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold ${
                    copyMoveData.detected 
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30' 
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {copyMoveData.detected ? 'Tampering Flagged' : 'Clean / Below Threshold'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-cyan-600 dark:text-cyan-400 font-semibold block">Donor (Copied):</span>
                    <span>{copyMoveData.donor?.coverage_pct}% area ({copyMoveData.donor?.active_pixels?.toLocaleString()} px)</span>
                  </div>
                  <div>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold block">Probe (Target):</span>
                    <span>{copyMoveData.probe?.coverage_pct}% area ({copyMoveData.probe?.active_pixels?.toLocaleString()} px)</span>
                  </div>
                </div>

                {/* Benchmark Explanation Notice */}
                <div className="p-2 bg-slate-100 dark:bg-slate-900/90 rounded text-[10px] text-slate-500 space-y-1">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Calibration Context (DEFACTO Test Set):</div>
                  <div>• Image-Level Recall: 58.32% (at threshold {copyMoveData.threshold || 0.50})</div>
                  <div>• Donor Dice: ~0.4605 | Probe Dice: ~0.5432</div>
                  <div className="text-slate-400 italic">
                    *Note: Benchmarks reflect performance on known manipulated datasets, not a balanced real/fake set.
                  </div>
                </div>
              </div>
            )}

            {/* Inpainting Model Telemetry */}
            {inpaintingData && (
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xs space-y-2.5 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-slate-100">DEFACTO Inpainting Model</span>
                  <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold ${
                    inpaintingData.detected 
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30' 
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {inpaintingData.detected ? 'Inpainting Flagged' : 'Clean / Below Threshold'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-rose-600 dark:text-rose-400 font-semibold block">Inpainted Area:</span>
                    <span>{inpaintingData.coverage_pct}% of frame ({inpaintingData.active_pixels?.toLocaleString()} px)</span>
                  </div>
                  <div>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold block">Peak Confidence:</span>
                    <span>{Math.round((inpaintingData.max_confidence || 0) * 100)}%</span>
                  </div>
                </div>

                <div className="p-2 bg-slate-100 dark:bg-slate-900/90 rounded text-[10px] text-slate-500 space-y-1">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Calibration Context (DEFACTO Inpainting):</div>
                  <div>• Pixel-level segmentation of semantic fills and boundary artifacts.</div>
                  <div className="text-slate-400 italic">
                    *Note: Blurry or homogenous context fills may yield diffuse probability boundaries.
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 5. Why Flagged Section */}
      <WhyFlaggedSection whyFlaggedItems={activeCase.whyFlagged} />

      {/* 6. Forensic Findings Table */}
      <FindingTable findings={activeCase.findings} />

      {/* 7. Scientific Limitations & Evidentiary Interpretation */}
      <div className="p-4 bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xs space-y-2 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px]">
          <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>Scientific Limitations & Evidentiary Interpretation</span>
        </div>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
          Neural probability masks represent statistical anomalies detected against learned training priors (DEFACTO benchmarks). 
          A predicted mask indicates localized pixel correlation or edge discontinuities, but does not constitute standalone legal proof of forgery. 
          Conversely, an empty mask does not prove absolute authenticity, as tiny patch clones (&lt;1% frame) or heavy recompression can mask artifacts.
        </p>
      </div>

      {/* 8. Progressive Disclosure: Collapsible Technical Metadata Details */}
      <div className="pt-2">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="flex items-center gap-2 font-mono text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 font-bold uppercase tracking-wider py-2 cursor-pointer"
        >
          {showTechnicalDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span>{showTechnicalDetails ? 'Hide Technical EXIF & Hash Telemetry' : 'Show Technical EXIF & Hash Telemetry →'}</span>
        </button>

        {showTechnicalDetails && (
          <div className="mt-4 p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xs font-mono text-xs space-y-4">
            
            {/* Metadata Legal Notice */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] rounded-xs">
              Notice on Metadata: EXIF tags can be stripped or modified naturally by web uploads or social platforms. Missing EXIF does not establish manipulation.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
              <div><span className="text-slate-400">Dimensions:</span> {activeCase.dimensions} ({activeCase.megapixels})</div>
              <div><span className="text-slate-400">Payload Size:</span> {activeCase.fileSize}</div>
              <div><span className="text-slate-400">Color Space:</span> {activeCase.colorSpace}</div>
              <div><span className="text-slate-400">Camera Model:</span> {activeCase.cameraHardware}</div>
              <div><span className="text-slate-400">Exposure:</span> {activeCase.exposure}</div>
              <div><span className="text-slate-400">EXIF Status:</span> {activeCase.exifStatus}</div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px]">
              <span className="text-slate-400 block font-bold mb-1">SHA-256 Digest:</span>
              <span className="text-cyan-600 dark:text-cyan-400 break-all select-all">{activeCase.sha256}</span>
            </div>

            {activeCase.metadata?.raw_exif_tags && Object.keys(activeCase.metadata.raw_exif_tags).length > 0 && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-slate-400 block font-bold">Raw EXIF Dictionary:</span>
                <div className="max-h-48 overflow-y-auto space-y-1 text-[11px] bg-slate-900/60 p-3 rounded-xs text-slate-300 border border-slate-800">
                  {Object.entries(activeCase.metadata.raw_exif_tags).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <span className="text-slate-400">{k}:</span>
                      <span className="truncate">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
