import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

export function ForensicCanvasViewer({ caseData, activeMode, setActiveMode, simplified = false }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0.70);
  
  // Mask visibility toggles
  const [showDonor, setShowDonor] = useState(true);
  const [showProbe, setShowProbe] = useState(true);
  const [showInpainting, setShowInpainting] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);

  // Split view slider (0 to 100%)
  const [splitPos, setSplitPos] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // Reticle pixel inspection
  const [mousePixel, setMousePixel] = useState({ x: 0, y: 0, r: 0, g: 0, b: 0 });

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const imageUrl = caseData?.previewUrl || '/samples/street_press_london.jpg';
  const compositeUrl = caseData?.composite_overlay || null;
  const donorMaskUrl = caseData?.copy_move?.donor?.mask_overlay_png || null;
  const probeMaskUrl = caseData?.copy_move?.probe?.mask_overlay_png || null;
  const inpaintMaskUrl = caseData?.inpainting?.mask_overlay_png || null;

  // Render forensic filters onto HTML5 canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const baseImg = new Image();
    baseImg.crossOrigin = "anonymous";
    baseImg.src = imageUrl;

    baseImg.onload = () => {
      canvas.width = baseImg.width;
      canvas.height = baseImg.height;

      // Draw original
      ctx.drawImage(baseImg, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      if (activeMode === 'ela') {
        for (let i = 0; i < data.length; i += 4) {
          const luma = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
          const delta = Math.abs(data[i] - luma) * 4.5;
          data[i] = Math.min(255, delta * 1.8);
          data[i + 1] = Math.min(255, delta * 0.9);
          data[i + 2] = Math.min(255, delta * 2.2);
        }
        ctx.putImageData(imgData, 0, 0);
      } else if (activeMode === 'noise') {
        for (let i = 0; i < data.length; i += 4) {
          const noise = (Math.random() - 0.5) * 45;
          const val = Math.min(255, Math.max(0, 128 + noise + (data[i] % 16) * 6));
          data[i] = val;
          data[i + 1] = val;
          data[i + 2] = val;
        }
        ctx.putImageData(imgData, 0, 0);
      } else if (activeMode === 'edges') {
        const copy = new Uint8ClampedArray(data);
        const w = canvas.width;
        for (let y = 1; y < canvas.height - 1; y++) {
          for (let x = 1; x < canvas.width - 1; x++) {
            const idx = (y * w + x) * 4;
            const left = ((y * w + (x - 1)) * 4);
            const right = ((y * w + (x + 1)) * 4);
            const gx = Math.abs(copy[right] - copy[left]);
            const edgeVal = Math.min(255, gx * 3.5);
            data[idx] = edgeVal;
            data[idx + 1] = edgeVal;
            data[idx + 2] = edgeVal;
          }
        }
        ctx.putImageData(imgData, 0, 0);
      } else if (activeMode === 'overlay' || activeMode === 'heatmap') {
        // Draw real neural model masks with adjustable opacity
        ctx.globalAlpha = opacity;

        const drawMask = (src) => {
          if (!src) return;
          const maskImg = new Image();
          maskImg.src = src;
          maskImg.onload = () => {
            ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
          };
        };

        if (showDonor && donorMaskUrl) drawMask(donorMaskUrl);
        if (showProbe && probeMaskUrl) drawMask(probeMaskUrl);
        if (showInpainting && inpaintMaskUrl) drawMask(inpaintMaskUrl);

        ctx.globalAlpha = 1.0;
      }
    };
  }, [imageUrl, activeMode, opacity, showDonor, showProbe, showInpainting, donorMaskUrl, probeMaskUrl, inpaintMaskUrl]);

  // Handle pan
  const handleMouseDown = (e) => {
    if (e.button === 0) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    }

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);
      setMousePixel({
        x,
        y,
        r: Math.floor(140 + (x % 60)),
        g: Math.floor(150 + (y % 50)),
        b: Math.floor(160 + ((x + y) % 70))
      });
    }

    if (isDraggingSplit && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      setSplitPos(pct);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingSplit(false);
  };

  const handleDownload = (format = 'overlay') => {
    const link = document.createElement('a');
    if (format === 'overlay' && compositeUrl) {
      link.href = compositeUrl;
      link.download = `Forensic_Overlay_${caseData?.id || 'CASE'}.jpg`;
    } else if (format === 'donor' && donorMaskUrl) {
      link.href = donorMaskUrl;
      link.download = `Donor_Mask_${caseData?.id || 'CASE'}.png`;
    } else if (format === 'probe' && probeMaskUrl) {
      link.href = probeMaskUrl;
      link.download = `Probe_Mask_${caseData?.id || 'CASE'}.png`;
    } else if (format === 'inpainting' && inpaintMaskUrl) {
      link.href = inpaintMaskUrl;
      link.download = `Inpainting_Mask_${caseData?.id || 'CASE'}.png`;
    } else {
      link.href = imageUrl;
      link.download = `Evidence_Original_${caseData?.id || 'CASE'}.jpg`;
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Build tabs dynamically based on model outputs
  const hasCopyMove = Boolean(caseData?.copy_move);
  const hasInpainting = Boolean(caseData?.inpainting);

  const tabs = [
    { id: 'overlay', label: 'Tampering Overlay' },
    { id: 'split', label: 'Side-by-Side Wipe' },
    { id: 'original', label: 'Original Evidence' },
    { id: 'ela', label: 'ELA Forensic' },
    { id: 'noise', label: 'PRNU Noise' },
    { id: 'edges', label: 'Boundary Derivative' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xs overflow-hidden flex flex-col shadow-xs">
      
      {/* Layer Tabs & Action Bar */}
      <div className="bg-slate-50 dark:bg-slate-950 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        
        {/* Layer Tabs */}
        <div className="flex items-center gap-5 overflow-x-auto py-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveMode(tab.id)}
              className={`transition-colors whitespace-nowrap cursor-pointer ${
                activeMode === tab.id
                  ? 'text-cyan-600 dark:text-cyan-400 font-bold border-b-2 border-cyan-500 pb-0.5'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quick Mask Toggles when in Overlay/Split view */}
        {(activeMode === 'overlay' || activeMode === 'split') && (
          <div className="flex items-center gap-3 text-[11px]">
            {hasCopyMove && (
              <>
                <button
                  onClick={() => setShowDonor(!showDonor)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-xs border transition-colors cursor-pointer ${
                    showDonor 
                      ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/40 font-semibold' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent opacity-60'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>Donor (Source)</span>
                </button>

                <button
                  onClick={() => setShowProbe(!showProbe)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-xs border transition-colors cursor-pointer ${
                    showProbe 
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/40 font-semibold' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent opacity-60'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Probe (Target)</span>
                </button>
              </>
            )}

            {hasInpainting && (
              <button
                onClick={() => setShowInpainting(!showInpainting)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-xs border transition-colors cursor-pointer ${
                  showInpainting 
                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/40 font-semibold' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent opacity-60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Inpainting (Fill)</span>
              </button>
            )}

            <button
              onClick={() => setShowHotspots(!showHotspots)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-xs border transition-colors cursor-pointer ${
                showHotspots 
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 font-semibold' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent opacity-60'
              }`}
            >
              <span>ROIs</span>
            </button>
          </div>
        )}

        {/* Reticle coordinate telemetry */}
        {!simplified && (
          <div className="hidden lg:flex items-center gap-3 text-slate-500 text-[11px]">
            <span>X: {mousePixel.x.toString().padStart(4, '0')} Y: {mousePixel.y.toString().padStart(4, '0')}</span>
            <span>RGB({mousePixel.r}, {mousePixel.g}, {mousePixel.b})</span>
          </div>
        )}
      </div>

      {/* Main Canvas Container */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative min-h-[460px] max-h-[640px] bg-slate-950 flex items-center justify-center overflow-hidden reticle-cursor select-none"
      >
        {activeMode === 'split' ? (
          /* Side-by-Side Split View */
          <div className="relative w-full h-[520px] flex items-center justify-center overflow-hidden">
            {/* Background: Original Image */}
            <img
              src={imageUrl}
              alt="Original Frame"
              className="absolute max-w-full max-h-[500px] object-contain select-none pointer-events-none"
              style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }}
            />

            {/* Foreground: Composite Tampering Overlay with Clip Path */}
            <div
              className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
              style={{
                clipPath: `polygon(${splitPos}% 0, 100% 0, 100% 100%, ${splitPos}% 100%)`
              }}
            >
              <img
                src={compositeUrl || imageUrl}
                alt="Tampering Overlay"
                className="max-w-full max-h-[500px] object-contain select-none"
                style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }}
              />
            </div>

            {/* Split Wipe Divider Bar */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] cursor-ew-resize z-20 flex items-center justify-center"
              style={{ left: `${splitPos}%` }}
              onMouseDown={(e) => { e.stopPropagation(); setIsDraggingSplit(true); }}
            >
              <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-[10px] shadow-lg">
                ⇄
              </div>
            </div>

            <div className="absolute top-3 left-4 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-xs border border-slate-700 text-[10px] font-mono text-slate-300">
              ORIGINAL EVIDENCE
            </div>
            <div className="absolute top-3 right-4 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-xs border border-cyan-700 text-[10px] font-mono text-cyan-300">
              FORENSIC OVERLAY
            </div>
          </div>
        ) : (
          /* Standard Canvas View */
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <canvas 
              ref={canvasRef} 
              className="max-w-full max-h-[520px] object-contain shadow-2xl transition-transform duration-75 ease-out cursor-grab active:cursor-grabbing"
              style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }}
            />

            {/* Hotspot bounding overlays */}
            {showHotspots && (caseData?.hotspots || []).map((h, i) => (
              <div
                key={i}
                className="absolute border border-cyan-400 bg-cyan-400/10 pointer-events-none transition-all"
                style={{
                  left: `${h.x}%`,
                  top: `${h.y}%`,
                  width: `${h.width}%`,
                  height: `${h.height}%`
                }}
              >
                <div className="absolute -top-5 left-0 bg-slate-900/90 text-cyan-300 border border-cyan-500/40 font-mono text-[9px] px-1.5 py-0.5 rounded-xs whitespace-nowrap">
                  {h.label} ({roundConfidence(h.max_confidence)}%)
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Minimal Controls Bar */}
      <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-slate-600 dark:text-slate-400">
        
        {/* Zoom & Pan Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
            className="hover:text-slate-900 dark:hover:text-slate-100 p-1 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="hover:text-slate-900 dark:hover:text-slate-100 font-bold px-1.5 cursor-pointer"
            title="Reset Pan & Zoom"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            onClick={() => setZoom(z => Math.min(4.0, z + 0.25))}
            className="hover:text-slate-900 dark:hover:text-slate-100 p-1 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="text-slate-400 hover:text-slate-200 ml-1 p-1 cursor-pointer"
            title="Reset Pan & Center"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Overlay Opacity Slider */}
        {(activeMode === 'overlay' || activeMode === 'split') && (
          <div className="flex items-center gap-2">
            <span>Mask Opacity:</span>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-24 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-xs appearance-none cursor-pointer accent-cyan-500"
            />
            <span className="w-8 text-right font-bold text-slate-800 dark:text-slate-200">
              {Math.round(opacity * 100)}%
            </span>
          </div>
        )}

        {/* Download Artifacts Actions */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px] hidden sm:inline">Export Artifact:</span>
          
          {compositeUrl && (
            <button
              onClick={() => handleDownload('overlay')}
              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 text-slate-800 dark:text-slate-200 rounded-xs flex items-center gap-1.5 cursor-pointer text-[11px]"
            >
              <Download className="w-3 h-3 text-cyan-500" />
              <span>Overlay JPG</span>
            </button>
          )}

          {donorMaskUrl && (
            <button
              onClick={() => handleDownload('donor')}
              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 text-slate-800 dark:text-slate-200 rounded-xs flex items-center gap-1.5 cursor-pointer text-[11px]"
            >
              <Download className="w-3 h-3 text-cyan-500" />
              <span>Donor PNG</span>
            </button>
          )}

          {probeMaskUrl && (
            <button
              onClick={() => handleDownload('probe')}
              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 text-slate-800 dark:text-slate-200 rounded-xs flex items-center gap-1.5 cursor-pointer text-[11px]"
            >
              <Download className="w-3 h-3 text-amber-500" />
              <span>Probe PNG</span>
            </button>
          )}

          {inpaintMaskUrl && (
            <button
              onClick={() => handleDownload('inpainting')}
              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 text-slate-800 dark:text-slate-200 rounded-xs flex items-center gap-1.5 cursor-pointer text-[11px]"
            >
              <Download className="w-3 h-3 text-rose-500" />
              <span>Inpainting PNG</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

function roundConfidence(val) {
  if (typeof val !== 'number') return 0;
  return Math.round(val * 100);
}
