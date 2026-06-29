'use client';

import type { FunnelStepMetrics } from '@/lib/api';
import { bodyTextClass, mutedTextClass, sectionHeadingClass } from '@/components/ui';

export function FunnelChart({
  steps,
  visits,
  selectedStepId,
  onSelectStep,
}: {
  steps: FunnelStepMetrics[];
  visits: number;
  selectedStepId: string | null;
  onSelectStep: (stepId: string | null) => void;
}) {
  const maxCount = Math.max(visits, 1);

  return (
    <div className="space-y-2">
      {steps.map((step, idx) => {
        const isVisit = step.kind === 'visit';
        const widthPct = Math.max(4, (step.uniqueVisitors / maxCount) * 100);
        const isSelected = selectedStepId === step.stepId;
        const dropNum = parseFloat(step.dropOffFromPrevPct);
        const rateNum = parseFloat(step.rateFromVisitsPct);

        return (
          <button
            key={step.stepId}
            type="button"
            onClick={() => onSelectStep(isSelected ? null : step.stepId)}
            className={`w-full text-left rounded-lg border p-3 transition-colors ${
              isSelected
                ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40'
            }`}
          >
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-[10px] font-mono ${mutedTextClass} w-5`}>{idx + 1}</span>
                <span className={`text-sm font-medium ${sectionHeadingClass} truncate`}>{step.label}</span>
                {step.mediagoCode != null && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 shrink-0">
                    MG {step.mediagoCode}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 shrink-0 text-xs tabular-nums">
                <span className={`font-semibold ${sectionHeadingClass}`}>{step.uniqueVisitors.toLocaleString()}</span>
                {!isVisit && (
                  <>
                    <span className={mutedTextClass}>{rateNum.toFixed(1)}% of visits</span>
                    {idx > 0 && dropNum > 0 && (
                      <span className="text-red-600 dark:text-red-400">−{dropNum}% drop</span>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isVisit ? 'bg-green-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${widthPct}%` }}
              />
            </div>

            {!isVisit && (
              <div className={`flex flex-wrap gap-3 mt-2 text-[10px] ${mutedTextClass}`}>
                <span>{step.totalEvents} events</span>
                <span className="text-emerald-700 dark:text-emerald-400">✓ {step.postbacksSent} sent</span>
                {step.postbacksFailed > 0 && (
                  <span className="text-red-600 dark:text-red-400">✗ {step.postbacksFailed} failed</span>
                )}
                {step.postbacksPending > 0 && (
                  <span className="text-amber-700 dark:text-amber-400">… {step.postbacksPending} pending</span>
                )}
                {step.revenue > 0 && <span className={bodyTextClass}>€{step.revenue.toFixed(2)} revenue</span>}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
