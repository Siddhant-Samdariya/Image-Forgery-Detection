import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ForensicCanvasViewer } from '../components/ForensicCanvasViewer';
import { SAMPLE_CASES } from '../data/mockData';

export function Home({ onNavigateToAnalyze, onNavigateToForensics }) {
  const [activeTeaserMode, setActiveTeaserMode] = useState('heatmap');
  const sampleCase = SAMPLE_CASES[0];

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }
  };

  return (
    <div className="space-y-32 pb-24">
      
      {/* 1. HERO SECTION */}
      <section className="min-h-[80vh] flex flex-col justify-between py-6">
        
        {/* Hero Copy */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl space-y-5 pt-8"
        >
          <div className="font-mono text-xs uppercase tracking-widest text-slate-400">
            Digital Image Forensics
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.08]">
            See beyond the pixels.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
            Understand what an image reveals — and what may have changed.
          </p>

          <div className="pt-2">
            <button
              onClick={onNavigateToAnalyze}
              className="px-7 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-mono text-xs uppercase tracking-widest rounded-xs transition-colors inline-flex items-center gap-2 group"
            >
              <span>Analyze an image</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>

        {/* Hero Visual: Large Dominant Photograph with Minimal Reticle Overlay */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.15 }}
          className="relative w-full aspect-16/9 max-h-[600px] bg-slate-950 rounded-xs overflow-hidden mt-10 group"
        >
          <img
            src="/samples/street_press_london.jpg"
            alt="Inspection evidence photo"
            className="w-full h-full object-cover opacity-95"
          />

          {/* Minimal Inspection Reticle Overlay (Clean & Non-HUD) */}
          <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between text-white/80 font-mono text-[11px] tracking-widest uppercase">
            <div className="flex justify-between items-start">
              <span>PIXEL ANALYSIS</span>
              <span>X 1420 · Y 0890</span>
            </div>

            {/* Subtle Crosshair Inspection Marker */}
            <div className="absolute top-[38%] left-[40%] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="w-12 h-12 border border-white/40 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              </div>
            </div>

            <div className="flex justify-between items-end text-white/60 text-[10px]">
              <span>100% SCALE</span>
            </div>
          </div>
        </motion.div>

      </section>


      {/* 2. SECTION 01 — EVERY IMAGE LEAVES TRACES */}
      <motion.section {...fadeInUp} className="max-w-3xl mx-auto space-y-6 py-8 border-t border-slate-200 dark:border-slate-800">
        <div className="font-mono text-xs uppercase tracking-widest text-slate-400">
          01 / EVIDENTIARY PRINCIPLE
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          Every image leaves traces.
        </h2>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
          Images contain more information than we can see at first glance. Compression, metadata, noise and pixel patterns can reveal traces of how an image was captured or changed.
        </p>
      </motion.section>


      {/* 3. SECTION 02 — INSPECT THE VISUAL SPECTRUM */}
      <motion.section {...fadeInUp} className="space-y-6 py-8 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto space-y-2">
          <div className="font-mono text-xs uppercase tracking-widest text-slate-400">
            02 / INTERACTIVE LAYERS
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Inspect the visual spectrum.
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
            Look at the same image in different ways. Compare the original with forensic visualizations to uncover details hidden beneath the surface.
          </p>
        </div>

        {/* Clean Image Viewer with Simplified Controls */}
        <ForensicCanvasViewer
          caseData={sampleCase}
          activeMode={activeTeaserMode}
          setActiveMode={setActiveTeaserMode}
          simplified={true}
        />
      </motion.section>


      {/* 4. SECTION 03 — WHAT DID WE FIND? */}
      <motion.section {...fadeInUp} className="max-w-3xl mx-auto py-8 border-t border-slate-200 dark:border-slate-800 space-y-10">
        <div className="space-y-2">
          <div className="font-mono text-xs uppercase tracking-widest text-slate-400">
            03 / DIAGNOSTIC FINDINGS
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            What did we find?
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
            The image is inspected for inconsistencies in compression, pixels, edges, and metadata.
          </p>
        </div>

        {/* Large Result Callout */}
        <div className="space-y-1 font-mono">
          <div className="text-6xl font-bold text-red-600 dark:text-red-400 tracking-tight">
            91.2%
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Potential tampering detected
          </h3>
          <div className="text-xs text-slate-500 font-sans">
            Splicing suspected
          </div>
        </div>

        {/* Credible, Readable Findings List */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6 font-sans">
          
          <div className="space-y-1">
            <div className="flex justify-between items-baseline font-mono text-xs">
              <span className="font-bold text-slate-900 dark:text-white text-sm">Compression anomaly</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">Medium · 82%</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              A localized area has compression characteristics that differ from the surrounding image.
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-baseline font-mono text-xs">
              <span className="font-bold text-slate-900 dark:text-white text-sm">Pixel inconsistency</span>
              <span className="text-red-600 dark:text-red-400 font-semibold">High · 94%</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Pixel patterns around this region differ noticeably from nearby areas.
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-baseline font-mono text-xs">
              <span className="font-bold text-slate-900 dark:text-white text-sm">Metadata</span>
              <span className="text-slate-400 font-semibold">No significant anomaly · 18%</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Available metadata does not currently indicate obvious editing.
            </p>
          </div>

        </div>
      </motion.section>


      {/* 5. SECTION 04 — EVIDENCE TELLS THE STORY */}
      <motion.section {...fadeInUp} className="max-w-4xl mx-auto py-8 border-t border-slate-200 dark:border-slate-800 space-y-16">
        <div className="space-y-2">
          <div className="font-mono text-xs uppercase tracking-widest text-slate-400">
            04 / EVIDENCE
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Evidence tells the story.
          </h2>
        </div>

        {/* Scroll Finding 01 */}
        <motion.div {...fadeInUp} className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-6 aspect-4/3 bg-slate-950 rounded-xs overflow-hidden border border-slate-800 flex items-center justify-center p-2">
            <img src="/samples/street_press_london.jpg" alt="Compression anomaly crop" className="w-full h-full object-cover" />
          </div>
          <div className="md:col-span-6 space-y-2 font-sans">
            <div className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Finding 01
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Compression anomaly
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              A localized region shows compression characteristics that differ from its surroundings.
            </p>
          </div>
        </motion.div>

        {/* Scroll Finding 02 */}
        <motion.div {...fadeInUp} className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-6 order-2 md:order-1 aspect-4/3 bg-slate-950 rounded-xs overflow-hidden border border-slate-800 flex items-center justify-center p-2">
            <img src="/samples/ai_synthetic_portrait.jpg" alt="Pixel inconsistency crop" className="w-full h-full object-cover" />
          </div>
          <div className="md:col-span-6 order-1 md:order-2 space-y-2 font-sans">
            <div className="font-mono text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
              Finding 02
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Pixel inconsistency
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Pixel patterns around this boundary differ from nearby regions and warrant further inspection.
            </p>
          </div>
        </motion.div>
      </motion.section>


      {/* 6. SECTION 05 — FINAL CTA: GO DEEPER */}
      <motion.section {...fadeInUp} className="max-w-2xl mx-auto text-center space-y-6 py-16 border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          Go deeper.
        </h2>
        <p className="text-base text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
          Inspect the image using advanced forensic tools, visualizations and evidence analysis.
        </p>
        <div className="pt-2">
          <button
            onClick={onNavigateToForensics}
            className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-mono text-xs uppercase tracking-widest rounded-xs transition-colors inline-flex items-center gap-2"
          >
            <span>Open Forensic Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.section>

    </div>
  );
}
