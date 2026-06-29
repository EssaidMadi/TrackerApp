'use client';

import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui';
import type { TimeseriesPoint } from '@/lib/api';

const METRICS = [
  { key: 'visits', label: 'Visits', color: '#22c55e' },
  { key: 'conversions', label: 'Conversions', color: '#ec4899' },
  { key: 'revenue', label: 'Revenue', color: '#a855f7' },
  { key: 'cost', label: 'Cost', color: '#3b82f6' },
  { key: 'profit', label: 'Profit', color: '#92400e' },
  { key: 'impressions', label: 'Impressions', color: '#38bdf8' },
  { key: 'clicks', label: 'Clicks', color: '#eab308' },
] as const;

function useIsDark() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  return dark;
}

export function OverviewChart({
  data,
  active,
  onToggle,
}: {
  data: TimeseriesPoint[];
  active: Set<string>;
  onToggle: (key: string) => void;
}) {
  const dark = useIsDark();
  const gridStroke = dark ? '#27272a' : '#f4f4f5';
  const tickFill = dark ? '#a1a1aa' : '#71717a';
  const tooltipStyle = {
    backgroundColor: dark ? '#18181b' : '#ffffff',
    border: `1px solid ${dark ? '#3f3f46' : '#e4e4e7'}`,
    borderRadius: '0.75rem',
    fontSize: '12px',
    color: dark ? '#fafafa' : '#18181b',
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {METRICS.map((m) => (
          <Button
            key={m.key}
            type="button"
            size="sm"
            variant={active.has(m.key) ? 'secondary' : 'ghost'}
            onClick={() => onToggle(m.key)}
            className={active.has(m.key) ? 'font-medium' : 'text-zinc-400 dark:text-zinc-500'}
          >
            <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: m.color }} />
            {m.label}
          </Button>
        ))}
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: tickFill }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: tickFill }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: tickFill }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: '12px', color: tickFill }} />
            {METRICS.filter((m) => active.has(m.key)).map((m) => (
              <Line
                key={m.key}
                yAxisId={m.key === 'visits' || m.key === 'conversions' || m.key === 'impressions' || m.key === 'clicks' ? 'right' : 'left'}
                type="monotone"
                dataKey={m.key}
                stroke={m.color}
                dot={false}
                strokeWidth={2}
                name={m.label}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
