'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Loading,
  PageHeader,
} from '@/components/ui';
import { DateRangePicker, buildPresets, type DateRange } from '@/components/DateRangePicker';
import { OverviewChart } from '@/components/OverviewChart';
import { CampaignReportTable } from '@/components/CampaignReportTable';
import { OverviewColumnPicker } from '@/components/OverviewColumnPicker';
import { trackerApi, type CampaignReportRow, type EventColumnDef, type TimeseriesPoint, type VisitStats } from '@/lib/api';
import {
  buildOverviewColumns,
  loadVisibleColumns,
  saveVisibleColumns,
  type OverviewColumnId,
} from '@/lib/overview-columns';

const KPI_CARDS = [
  { key: 'impressions', label: 'Impressions', color: 'bg-sky-100 text-sky-800' },
  { key: 'visits', label: 'Visits', color: 'bg-green-100 text-green-800' },
  { key: 'clicks', label: 'Clicks', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'conversions', label: 'Conversions', color: 'bg-pink-100 text-pink-800' },
  { key: 'revenue', label: 'Revenue', color: 'bg-purple-100 text-purple-800' },
  { key: 'cost', label: 'Cost', color: 'bg-blue-100 text-blue-800' },
  { key: 'profit', label: 'Profit', color: 'bg-amber-100 text-amber-900' },
] as const;

export default function OverviewPage() {
  const [range, setRange] = useState<DateRange>(buildPresets()[2]);
  const [overview, setOverview] = useState<VisitStats | null>(null);
  const [rows, setRows] = useState<CampaignReportRow[]>([]);
  const [eventColumns, setEventColumns] = useState<EventColumnDef[]>([]);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMetrics, setActiveMetrics] = useState(
    () => new Set(['visits', 'conversions', 'revenue', 'cost']),
  );
  const [visibleColumns, setVisibleColumns] = useState<Set<OverviewColumnId>>(() => new Set());

  const params = { from: range.from, to: range.to };

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      trackerApi.getAnalyticsOverview(params),
      trackerApi.getCampaignReport(params),
      trackerApi.getTimeseries({ ...params, granularity: 'hour' }),
    ])
      .then(([ov, report, ts]) => {
        setOverview(ov);
        setRows(report.rows);
        setEventColumns(report.eventColumns);
        setTimeseries(ts);
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
  }, [range.from, range.to]);

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

      <div className="mb-6">
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        {KPI_CARDS.map((c) => (
          <div key={c.key} className={`rounded-lg px-4 py-3 ${c.color}`}>
            <p className="text-[10px] uppercase tracking-wide opacity-70">{c.label}</p>
            <p className="text-xl font-semibold mt-1">{kpiValue(c.key)}</p>
          </div>
        ))}
      </div>

      <Card className="mb-8">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4">Performance over time</h2>
        <OverviewChart data={timeseries} active={activeMetrics} onToggle={toggleMetric} />
      </Card>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-zinc-900">Campaign performance</h2>
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
