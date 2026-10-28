import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export function FindingTable({ findings }) {
  const [expandedId, setExpandedId] = useState(null);

  const toggleRow = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-4 py-4 border-b border-slate-200 dark:border-slate-800">
      <div className="flex justify-between items-baseline font-mono text-xs">
        <h3 className="font-bold uppercase tracking-wider text-slate-500">
          Forensic Findings
        </h3>
        <span className="text-slate-400">Click finding for technical details</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
            <tr>
              <th className="py-2 w-6"></th>
              <th className="py-2">Finding</th>
              <th className="py-2">Category</th>
              <th className="py-2">Severity</th>
              <th className="py-2">Confidence</th>
              <th className="py-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {(findings || []).map((f) => {
              const isExpanded = expandedId === f.id;
              const isDetected = f.status === 'Detected' || f.status === 'Critical' || f.status === 'Anomaly';
              
              return (
                <React.Fragment key={f.id}>
                  <tr
                    onClick={() => toggleRow(f.id)}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2.5 text-slate-400">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </td>
                    <td className="py-2.5 font-bold text-slate-900 dark:text-slate-100">
                      {f.finding}
                    </td>
                    <td className="py-2.5 text-slate-500">
                      {f.category}
                    </td>
                    <td className="py-2.5">
                      <span className={
                        f.severity === "High" || f.severity === "Critical"
                          ? "text-red-600 dark:text-red-400 font-semibold"
                          : f.severity === "Medium"
                          ? "text-amber-600 dark:text-amber-400 font-semibold"
                          : "text-slate-500"
                      }>
                        {f.severity}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-700 dark:text-slate-300">
                      {Math.round((f.confidence || 0) * 100)}%
                    </td>
                    <td className="py-2.5 text-right font-bold">
                      <span className={isDetected ? "text-red-600 dark:text-red-400" : "text-slate-400"}>
                        {f.status}
                      </span>
                    </td>
                  </tr>

                  {/* Expanded Detail Row (Progressive Disclosure) */}
                  {isExpanded && (
                    <tr className="bg-slate-50/60 dark:bg-slate-950/40 font-sans">
                      <td colSpan={6} className="px-6 py-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-b border-slate-200 dark:border-slate-800">
                        <span className="font-bold font-mono text-slate-900 dark:text-slate-100 mr-2">Explanation:</span>
                        {f.description}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
