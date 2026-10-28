import React from 'react';

export function WhyFlaggedSection({ whyFlaggedItems }) {
  const items = whyFlaggedItems || [
    {
      title: "Compression Inconsistency",
      explanation: "A localized region has compression characteristics (JPEG DQT matrix parameters) that differ from surrounding baseline areas."
    },
    {
      title: "Pixel Inconsistency",
      explanation: "Pixel-level spatial variance along subject boundaries displays artificial sharpness steps inconsistent with natural lens focus."
    },
    {
      title: "Metadata & Sensor Anomaly",
      explanation: "The photo-response non-uniformity (PRNU) noise field is absent in the flagged zone, indicating an inserted element post-capture."
    }
  ];

  return (
    <div className="py-4 border-b border-slate-200 dark:border-slate-800 space-y-4">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          Why was this image flagged?
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Plain-language rationale explaining why the system reached this conclusion.
        </p>
      </div>

      <div className="space-y-4 font-sans text-xs">
        {items.map((item, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              {item.title}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
              {item.explanation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
