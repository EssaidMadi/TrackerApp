'use client';

import { Button } from '@/components/ui';

export type DateRange = { from: string; to: string; label: string };

function toIso(d: Date) {
  return d.toISOString();
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

export function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (r: DateRange) => void;
}) {
  const presets = buildPresets();

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
    </div>
  );
}
