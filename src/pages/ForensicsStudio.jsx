import React, { useState } from 'react';
import { ForensicCanvasViewer } from '../components/ForensicCanvasViewer';
import { StatusBadge } from '../components/StatusBadge';
import { SAMPLE_CASES } from '../data/mockData';

export function ForensicsStudio({ currentCase, onOpenReport }) {
  const [activeLayer, setActiveLayer] = useState('overlay');
  const activeCase = currentCase || SAMPLE_CASES[0];

  const tools = [
    { id: 'overlay', name: 'Tampering Overlay' },
    { id: 'split', name: 'Side-by-Side Wipe' },
    { id: 'original', name: 'Original Evidence' },
    { id: 'ela', name: 'ELA Compression' },
    { id: 'noise', name: 'PRNU Noise' },
    { id: 'edges', name: 'Boundary Derivative' },
  ];

  return (
    <div className="space-y-6 py-2">
      {/* Workspace Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
            {activeCase.filename}
          </h1>
          <StatusBadge status={activeCase.overallResult} size="sm" />
        </div>

        <button
          onClick={onOpenReport}
          className="text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 underline"
        >
          Export Forensic Audit
        </button>
      </div>

      {/* 3-Region Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT: Analysis Tools Navigation (2 cols) */}
        <div className="lg:col-span-2 space-y-1 font-mono text-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-2">
            Tools
          </div>
          {tools.map((tool) => {
            const isActive = activeLayer === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveLayer(tool.id)}
                className={`w-full text-left px-3 py-2 rounded-xs transition-colors ${
                  isActive
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tool.name}
              </button>
            );
          })}
        </div>

        {/* CENTER: Dominant Image Viewer (7 cols) */}
        <div className="lg:col-span-7">
          <ForensicCanvasViewer
            caseData={activeCase}
            activeMode={activeLayer}
            setActiveMode={setActiveLayer}
          />
        </div>

        {/* RIGHT: Compact Evidence Details Panel (3 cols) */}
        <div className="lg:col-span-3 space-y-4 font-mono text-xs text-slate-700 dark:text-slate-300">
          <div className="py-2 border-b border-slate-200 dark:border-slate-800 space-y-1">
            <div className="text-[10px] uppercase text-slate-400">Current Mode</div>
            <div className="font-bold text-slate-900 dark:text-white uppercase">{activeLayer}</div>
          </div>

          <div className="py-2 border-b border-slate-200 dark:border-slate-800 space-y-1">
            <div className="text-[10px] uppercase text-slate-400">Confidence Score</div>
            <div className="font-bold text-slate-900 dark:text-white text-lg">
              {Math.round(activeCase.confidence * 100)}%
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <div className="text-[10px] uppercase text-slate-400">Top Evidence Finding</div>
            <div className="font-bold text-slate-900 dark:text-white text-sm">
              {activeCase.findings?.[0]?.finding}
            </div>
            <p className="text-xs font-sans text-slate-500 leading-normal pt-1">
              {activeCase.findings?.[0]?.description}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
