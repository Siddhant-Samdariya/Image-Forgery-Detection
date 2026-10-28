import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { PIPELINE_STEPS } from '../data/mockData';

export function AnalysisProgress({ currentStage, onComplete }) {
  const activeStep = currentStage?.step || 1;

  useEffect(() => {
    if (activeStep === 5) {
      const timer = setTimeout(() => {
        onComplete();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [activeStep, onComplete]);

  return (
    <div className="max-w-2xl mx-auto py-16 space-y-8">
      <div className="text-center space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-slate-900 dark:text-slate-100 mx-auto" />
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Analyzing Image
        </h2>
        <p className="text-xs font-mono text-slate-500">
          Running diagnostic pipeline passes...
        </p>
      </div>

      {/* Sequential Pipeline Pass List */}
      <div className="space-y-2 font-mono text-xs max-w-md mx-auto">
        {PIPELINE_STEPS.map((step, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < activeStep;
          const isCurrent = stepNum === activeStep;

          return (
            <div
              key={step.id}
              className="py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-slate-600 dark:text-slate-400"
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-400">{step.id}</span>
                <span className={isCurrent ? 'font-bold text-slate-900 dark:text-white' : ''}>
                  {step.name}
                </span>
              </div>
              <span>
                {isCompleted ? '✓' : isCurrent ? '●' : '○'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
