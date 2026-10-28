import React, { useState } from 'react';
import { StatusBadge } from './StatusBadge';
import { SAMPLE_CASES } from '../data/mockData';
import { Trash2, ExternalLink } from 'lucide-react';

export function HistoryTable({ onSelectCase }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [historyItems, setHistoryItems] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('forensic_history') || '[]');
      return [...saved, ...SAMPLE_CASES];
    } catch {
      return SAMPLE_CASES;
    }
  });

  const handleClearHistory = () => {
    localStorage.removeItem('forensic_history');
    setHistoryItems(SAMPLE_CASES);
  };

  const filteredItems = historyItems.filter(item =>
    item.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sha256?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-baseline border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Forensic Audit Ledger
          </h1>
          <p className="text-xs font-mono text-slate-500 mt-1">
            Historical digital evidence inspection log and analyzed session artifacts.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <button
            onClick={handleClearHistory}
            className="text-slate-400 hover:text-rose-500 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Local History</span>
          </button>
        </div>
      </div>

      {/* Filter Input */}
      <div className="font-mono text-xs">
        <input
          type="text"
          placeholder="Filter ledger by filename, case ID, or SHA-256 hash..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* List */}
      <div className="space-y-3 font-mono text-xs">
        <div className="flex justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider px-2">
          <span>Evidence Case</span>
          <span>Verdict & Max Confidence</span>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800 border-t border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 rounded-xs">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No matching forensic case records found.
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                onClick={() => onSelectCase(item)}
                className="py-3 px-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xs bg-slate-950 overflow-hidden shrink-0 border border-slate-800 flex items-center justify-center">
                    <img 
                      src={item.previewUrl || item.composite_overlay || '/samples/street_press_london.jpg'} 
                      alt="Thumbnail" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                      <span>{item.filename}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-normal">[{item.id}]</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-sans mt-0.5">
                      {item.detectionType || "Multi-Model Ingest"} • {item.dimensions || "Native Dimensions"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <StatusBadge status={item.overallResult} size="sm" />
                  <div className="font-bold text-slate-900 dark:text-white text-sm w-12 text-right">
                    {Math.round((item.confidence || 0) * 100)}%
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
