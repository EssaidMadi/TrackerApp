'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Badge,
  Card,
  DataTable,
  EmptyState,
  Loading,
  PageHeader,
  StatCard,
  TableHead,
  Td,
  Th,
} from '@/components/ui';
import { trackerApi, type Click, type BreakdownRow } from '@/lib/api';

export default function TrafficPage() {
  const [live, setLive] = useState<Click[]>([]);
  const [overview, setOverview] = useState({ clicks: 0, conversions: 0, conversionRate: '0' });
  const [publisherBreakdown, setPublisherBreakdown] = useState<BreakdownRow[]>([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState<BreakdownRow[]>([]);
  const [platformBreakdown, setPlatformBreakdown] = useState<BreakdownRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    Promise.all([
      trackerApi.getLiveTraffic({ limit: '30' }),
      trackerApi.getAnalyticsOverview(),
      trackerApi.getBreakdown('publisher'),
      trackerApi.getBreakdown('device'),
      trackerApi.getBreakdown('platform'),
    ])
      .then(([liveData, ov, pub, dev, plat]) => {
        setLive(liveData);
        setOverview(ov);
        setPublisherBreakdown(pub);
        setDeviceBreakdown(dev);
        setPlatformBreakdown(plat);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) return <Loading label="Loading traffic..." />;

  return (
    <div>
      <PageHeader
        title="Live Traffic"
        description="Real-time overview with auto-refresh every 15 seconds."
        meta={<Badge tone="success">Live</Badge>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total clicks" value={overview.clicks} />
        <StatCard label="Conversions" value={overview.conversions} />
        <StatCard label="Conversion rate" value={`${overview.conversionRate}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <BreakdownCard title="By publisher" rows={publisherBreakdown} />
        <BreakdownCard title="By device" rows={deviceBreakdown} />
        <BreakdownCard title="By platform" rows={platformBreakdown} />
      </div>

      <h2 className="text-sm font-semibold text-zinc-900 mb-3">Incoming clicks (24h)</h2>
      <DataTable>
        <table className="w-full text-xs">
          <TableHead>
            <Th>Time</Th>
            <Th>Campaign</Th>
            <Th>Publisher</Th>
            <Th>Platform</Th>
            <Th>Device</Th>
            <Th>Country</Th>
            <Th>IP</Th>
            <Th>Conv</Th>
          </TableHead>
          <tbody>
            {live.map((c) => (
              <tr key={c.id} className="border-b border-zinc-50 hover:bg-zinc-50/50">
                <Td className="text-zinc-400 whitespace-nowrap">
                  {new Date(c.createdAt).toLocaleTimeString()}
                </Td>
                <Td className="font-medium text-zinc-900">{c.campaign.name}</Td>
                <Td className="max-w-[120px] truncate">{c.publisherName || '—'}</Td>
                <Td>{c.platform || '—'}</Td>
                <Td>{c.device || '—'}</Td>
                <Td>{c.countryCode || '—'}</Td>
                <Td className="font-mono text-xs">{c.ipAddress || '—'}</Td>
                <Td>
                  {c.conversions?.length ? (
                    <Badge tone="success">Yes</Badge>
                  ) : (
                    <span className="text-zinc-300">—</span>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
        {live.length === 0 && (
          <EmptyState title="No traffic yet" description="Point your campaign URL to the tracker." />
        )}
      </DataTable>
    </div>
  );
}

function BreakdownCard({ title, rows }: { title: string; rows: BreakdownRow[] }) {
  return (
    <Card>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-4">{title}</h3>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-zinc-400">
            <th className="text-left pb-2 font-medium">Name</th>
            <th className="text-right pb-2 font-medium">Clicks</th>
            <th className="text-right pb-2 font-medium">CR%</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 8).map((r) => (
            <tr key={r.name} className="border-t border-zinc-50">
              <td className="py-2 truncate max-w-[140px] text-zinc-700" title={r.name}>
                {r.name}
              </td>
              <td className="py-2 text-right tabular-nums">{r.clicks}</td>
              <td className="py-2 text-right tabular-nums text-zinc-500">{r.cr}%</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className="py-6 text-center text-zinc-400">
                No data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}
