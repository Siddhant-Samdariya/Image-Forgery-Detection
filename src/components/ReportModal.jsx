import React, { useState } from 'react';
import { X, Printer, Download, ShieldCheck, Copy } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { downloadReportPdf } from '../services/api';

export function ReportModal({ caseData, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!caseData) return null;

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(caseData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-3xl w-full shadow-2xl overflow-hidden font-sans my-8">
        
        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-bold tracking-wider">OFFICIAL FORENSIC AUDIT REPORT</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJSON}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xs border border-slate-700 flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>{copied ? 'Copied JSON!' : 'Copy JSON'}</span>
            </button>
            <button
              onClick={async () => {
                try {
                  await downloadReportPdf(caseData);
                } catch {
                  window.print();
                }
              }}
              className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xs flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-2.5 py-1 bg-slate-100 hover:bg-white text-slate-900 font-semibold rounded-xs flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <Printer className="w-3 h-3" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded ml-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Report Content Body (Printable area) */}
        <div className="p-8 space-y-6 text-slate-900 dark:text-slate-100 print:p-0">
          
          {/* Document Header */}
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Digital Evidence Inspection Certificate
              </h1>
              <div className="text-xs font-mono text-slate-500 mt-1">
                Is It Forged? Engine v4.2.1 • ISO/IEC 27037 Standard
              </div>
            </div>
            <div className="text-right font-mono text-xs">
              <div className="font-bold text-slate-900 dark:text-white">{caseData.id}</div>
              <div className="text-slate-500 text-[11px]">{caseData.ingestedDate}</div>
            </div>
          </div>

          {/* Verdict Banner */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between font-mono">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">EVIDENTIARY VERDICT</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {caseData.detectionType}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={caseData.overallResult} size="lg" />
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase">CONFIDENCE</div>
                <div className="text-base font-bold text-slate-900 dark:text-white">
                  {Math.round(caseData.confidence * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* Image & Telemetry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 rounded border border-slate-800 p-2 flex items-center justify-center">
              <img src={caseData.previewUrl} alt="Evidence" className="max-h-48 object-contain rounded" />
            </div>

            <div className="space-y-1.5 font-mono text-xs text-slate-600 dark:text-slate-300">
              <div className="font-bold text-slate-900 dark:text-white border-b pb-1 mb-1">IMAGE TELEMETRY</div>
              <div className="flex justify-between">
                <span className="text-slate-400">Filename:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{caseData.filename}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dimensions:</span>
                <span>{caseData.dimensions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">File Size:</span>
                <span>{caseData.fileSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Color Space:</span>
                <span>{caseData.colorSpace}</span>
              </div>
              <div className="pt-2 border-t text-[10px]">
                <span className="text-slate-400 block">SHA-256 Digest:</span>
                <span className="font-mono text-slate-600 dark:text-slate-400 break-all">{caseData.sha256}</span>
              </div>
            </div>
          </div>

          {/* Findings Summary Table */}
          <div>
            <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
              Evaluated Test Vectors & Anomaly Audit
            </div>
            <table className="w-full text-left font-mono text-xs border border-slate-200 dark:border-slate-800">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="p-2">Finding</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Severity</th>
                  <th className="p-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(caseData.findings || []).map((f) => (
                  <tr key={f.id}>
                    <td className="p-2 font-semibold text-slate-900 dark:text-slate-100">{f.finding}</td>
                    <td className="p-2 text-slate-500">{f.category}</td>
                    <td className="p-2">{f.severity}</td>
                    <td className="p-2 text-right font-bold">{f.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sign-off Block */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end font-mono text-xs">
            <div>
              <div className="text-[10px] text-slate-400 uppercase">DIGITAL AUDIT STAMP</div>
              <div className="font-bold text-slate-700 dark:text-slate-300">SEC-LOCAL-SANDBOX • VERIFIED</div>
            </div>
            <div className="text-right">
              <div className="border-b border-slate-400 dark:border-slate-600 w-48 mb-1"></div>
              <div className="text-[10px] text-slate-500">Authorized Forensic Inspector</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
