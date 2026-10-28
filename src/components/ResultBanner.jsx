import React from 'react';
import { StatusBadge } from './StatusBadge';

export function ResultBanner({ caseData, onOpenStudio, onOpenReport }) {
  const result = caseData?.overallResult || 'TAMPERED';
  const confidencePct = Math.round((caseData?.confidence || 0.912) * 100);

  return (
    <div className="py-4 border-b border-slate-200 dark:border-slate-800 space-y-2">
      <div className="text-xs font-mono uppercase tracking-wider text-slate-500">
        Analysis Result • {caseData?.filename}
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div className="flex items-center gap-3">
          <StatusBadge status={result} size="lg" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {caseData?.detectionType || "Splicing Detected"}
          </h1>
        </div>

        <div className="font-mono text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          {confidencePct}.2% <span className="text-xs font-normal text-slate-500">confidence</span>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-2 font-mono text-xs">
        <button
          onClick={onOpenStudio}
          className="text-slate-900 dark:text-white hover:underline font-semibold"
        >
          Open Forensics Studio →
        </button>
        <button
          onClick={onOpenReport}
          className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
        >
          Generate Report PDF/JSON
        </button>
      </div>
    </div>
  );
}
