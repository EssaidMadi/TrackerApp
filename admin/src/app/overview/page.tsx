'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  Button,
  Card,
  Loading,
  PageHeader,
  StatCard,
  type StatCardTone,
} from '@/components/ui';
import { DateRangePicker, buildPresets, type DateRange } from '@/components/DateRangePicker';
import { ExcludeBotsToggle } from '@/components/ExcludeBotsToggle';
import { OverviewChart } from '@/components/OverviewChart';
import { CampaignReportTable } from '@/components/CampaignReportTable';
import { OverviewColumnPicker } from '@/components/OverviewColumnPicker';
import { trackerApi, type CampaignReportRow, type DigestReport, type EventColumnDef, type TimeseriesPoint, type VisitStats } from '@/lib/api';
import {
  buildOverviewColumns,
  loadVisibleColumns,
  saveVisibleColumns,
  type OverviewColumnId,
} from '@/lib/overview-columns';

function KpiIcon({ d }: { d: string }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const KPI_CARDS: {
  key: string;
  label: string;
  tone: StatCardTone;
  icon: ReactNode;
}[] = [
  { key: 'impressions', label: 'Impressions', tone: 'sky', icon: <KpiIcon d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /> },
  { key: 'visits', label: 'Visits', tone: 'green', icon: <KpiIcon d="M15 15l6 6M10 17a7 7 0 1 1 0-14 7 7 0 0 1 0 14z" /> },
  { key: 'clicks', label: 'Clicks', tone: 'yellow', icon: <KpiIcon d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /> },
  { key: 'conversions', label: 'Conversions', tone: 'pink', icon: <KpiIcon d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /> },
  { key: 'revenue', label: 'Revenue', tone: 'purple', icon: <KpiIcon d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /> },
  { key: 'cost', label: 'Cost', tone: 'blue', icon: <KpiIcon d="M4 19h16M6 16l3-4 4 3 5-8 4 6" /> },
  { key: 'profit', label: 'Profit', tone: 'amber', icon: <KpiIcon d="M12 3v18M3 12h18" /> },
];

export default function OverviewPage() {
  const [range, setRange] = useState<DateRange>(buildPresets()[2]);
  const [excludeBots, setExcludeBots] = useState(false);
  const [overview, setOverview] = useState<VisitStats | null>(null);
  const [digest, setDigest] = useState<DigestReport | null>(null);
  const [rows, setRows] = useState<CampaignReportRow[]>([]);
  const [eventColumns, setEventColumns] = useState<EventColumnDef[]>([]);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMetrics, setActiveMetrics] = useState(
    () => new Set(['visits', 'conversions', 'revenue', 'cost']),
  );
  const [visibleColumns, setVisibleColumns] = useState<Set<OverviewColumnId>>(() => new Set());

  const params = {
    from: range.from,
    to: range.to,
    ...(excludeBots ? { excludeBots: 'true' } : {}),
  };

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      trackerApi.getAnalyticsOverview(params),
      trackerApi.getCampaignReport(params),
      trackerApi.getTimeseries({ ...params, granularity: 'hour' }),
      trackerApi.getDigest({ ...params, eventType: 'call_click' }),
    ])
      .then(([ov, report, ts, dig]) => {
        setOverview(ov);
        setRows(report.rows);
        setEventColumns(report.eventColumns);
        setTimeseries(ts);
        setDigest(dig);
        const allIds = buildOverviewColumns(report.eventColumns).map((c) => c.id);
        setVisibleColumns((prev) => {
          if (prev.size > 0) {
            const kept = new Set([...prev].filter((id) => allIds.includes(id)));
            if (kept.size > 0) return kept;
          }
          return loadVisibleColumns(allIds);
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [range.from, range.to, excludeBots]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleMetric = (key: string) => {
    setActiveMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleColumnsChange = (next: Set<OverviewColumnId>) => {
    setVisibleColumns(next);
    saveVisibleColumns(next);
  };

  const exportCsv = async () => {
    const csv = await trackerApi.exportCampaignReportCsv(params);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campaign-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const kpiValue = (key: string) => {
    if (!overview) return '—';
    const v = (overview as unknown as Record<string, unknown>)[key];
    if (v === undefined || v === null) return '0';
    if (key === 'revenue' || key === 'cost' || key === 'profit') {
      return `€${Number(v).toFixed(2)}`;
    }
    return String(v);
  };

  if (loading && !overview) return <Loading label="Loading overview..." />;

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Voluum-style performance dashboard — visits, conversions, revenue, and spend."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={exportCsv}>
              Export CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={load}>
              Refresh
            </Button>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap gap-3 items-center">
        <DateRangePicker value={range} onChange={setRange} />
        <ExcludeBotsToggle value={excludeBots} onChange={setExcludeBots} />
      </div>

      {digest && digest.items.length > 0 && (
        <Card elevated className="mb-8 border-indigo-200/60 dark:border-indigo-800/60 bg-indigo-50/30 dark:bg-indigo-950/20">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Today&apos;s decisions</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {digest.items.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="rounded-xl bg-white/80 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 p-4 shadow-sm"
              >
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.title}</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">{item.message}</p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-medium">→ {item.action}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
        {KPI_CARDS.map((c) => (
          <StatCard
            key={c.key}
            label={c.label}
            value={kpiValue(c.key)}
            tone={c.tone}
            icon={c.icon}
          />
        ))}
      </div>

      <Card elevated className="mb-8">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Performance over time</h2>
        <OverviewChart data={timeseries} active={activeMetrics} onToggle={toggleMetric} />
      </Card>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Campaign performance</h2>
        <OverviewColumnPicker
          eventColumns={eventColumns}
          visible={visibleColumns}
          onChange={handleColumnsChange}
        />
      </div>
      <CampaignReportTable rows={rows} eventColumns={eventColumns} visibleColumns={visibleColumns} />
    </div>
  );
}
