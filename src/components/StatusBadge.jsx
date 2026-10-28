import React from 'react';

export function StatusBadge({ status, size = "md" }) {
  const normalized = (status || "").toUpperCase();

  let styleClasses = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  let label = status || "UNKNOWN";

  if (normalized === 'AUTHENTIC' || normalized === 'CLEAN' || normalized === 'VERIFIED') {
    styleClasses = "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
    label = "AUTHENTIC";
  } else if (normalized === 'SUSPICIOUS' || normalized === 'MODERATE') {
    styleClasses = "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
    label = "SUSPICIOUS";
  } else if (normalized === 'TAMPERED' || normalized === 'HIGH' || normalized === 'DETECTED') {
    styleClasses = "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800";
    label = "TAMPERED";
  } else if (normalized === 'SYNTHETIC' || normalized === 'AI-GENERATED') {
    styleClasses = "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800";
    label = "SYNTHETIC";
  }

  const padding = size === "sm" ? "px-2 py-0.5 text-xs" : size === "lg" ? "px-3 py-1 text-sm font-semibold" : "px-2.5 py-0.5 text-xs font-medium";

  return (
    <span className={`inline-flex items-center font-mono rounded-xs border uppercase tracking-wider ${padding} ${styleClasses}`}>
      {label}
    </span>
  );
}
