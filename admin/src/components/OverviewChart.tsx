'use client';

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

export function OverviewChart({
  data,
  active,
  onToggle,
}: {
  data: TimeseriesPoint[];
  active: Set<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => onToggle(m.key)}
            className={`text-xs px-2 py-1 rounded border ${
              active.has(m.key)
                ? 'border-zinc-400 bg-white font-medium'
                : 'border-zinc-200 text-zinc-400'
            }`}
          >
            <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: m.color }} />
            {m.label}
          </button>
        ))}
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
            <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend />
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
