'use client';

import { Button } from '@/components/ui';

export type DateRange = { from: string; to: string; label: string };

function toIso(d: Date) {
  return d.toISOString();
}

export function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function buildDayRange(dateInput: string): DateRange {
  const [y, m, d] = dateInput.split('-').map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d, 23, 59, 59, 999);
  const label = start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return { from: toIso(start), to: toIso(end), label };
}

export function buildPresets(): DateRange[] {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayEnd = new Date(todayStart);
  yesterdayEnd.setMilliseconds(-1);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  return [
    { label: 'Today', from: toIso(todayStart), to: toIso(now) },
    { label: 'Yesterday', from: toIso(yesterdayStart), to: toIso(yesterdayEnd) },
    { label: 'Last 7 days', from: toIso(weekStart), to: toIso(now) },
    { label: 'Last 30 days', from: toIso(new Date(todayStart.getTime() - 30 * 86400000)), to: toIso(now) },
  ];
}

export function isPresetRange(value: DateRange): boolean {
  return buildPresets().some((p) => p.label === value.label);
}

export function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (r: DateRange) => void;
}) {
  const presets = buildPresets();
  const dateValue = toDateInputValue(new Date(value.from));

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {presets.map((p) => (
        <Button
          key={p.label}
          size="sm"
          variant={value.label === p.label ? 'primary' : 'secondary'}
          onClick={() => onChange(p)}
        >
          {p.label}
        </Button>
      ))}
      <label className="flex items-center gap-2 text-xs text-zinc-600 ml-1">
        <span className="whitespace-nowrap">Pick day</span>
        <input
          type="date"
          value={dateValue}
          onChange={(e) => {
            if (e.target.value) onChange(buildDayRange(e.target.value));
          }}
          className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      </label>
      {!isPresetRange(value) && (
        <span className="text-xs text-zinc-500">{value.label}</span>
      )}
    </div>
  );
}
