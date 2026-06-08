'use client';

import type { FunnelStepMetrics } from '@/lib/api';

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
                ? 'border-indigo-400 bg-indigo-50/50'
                : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50'
            }`}
          >
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-mono text-zinc-400 w-5">{idx + 1}</span>
                <span className="text-sm font-medium text-zinc-900 truncate">{step.label}</span>
                {step.mediagoCode != null && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 shrink-0">
                    MG {step.mediagoCode}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 shrink-0 text-xs tabular-nums">
                <span className="font-semibold text-zinc-900">{step.uniqueVisitors.toLocaleString()}</span>
                {!isVisit && (
                  <>
                    <span className="text-zinc-500">{rateNum.toFixed(1)}% of visits</span>
                    {idx > 0 && dropNum > 0 && (
                      <span className="text-red-600">−{dropNum}% drop</span>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isVisit ? 'bg-green-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${widthPct}%` }}
              />
            </div>

            {!isVisit && (
              <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-zinc-500">
                <span>{step.totalEvents} events</span>
                <span className="text-emerald-700">✓ {step.postbacksSent} sent</span>
                {step.postbacksFailed > 0 && (
                  <span className="text-red-600">✗ {step.postbacksFailed} failed</span>
                )}
                {step.postbacksPending > 0 && (
                  <span className="text-amber-700">… {step.postbacksPending} pending</span>
                )}
                {step.revenue > 0 && <span>€{step.revenue.toFixed(2)} revenue</span>}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
