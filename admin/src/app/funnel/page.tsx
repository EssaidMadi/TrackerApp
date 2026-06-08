'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Loading,
  PageHeader,
  Select,
} from '@/components/ui';
import { DateRangePicker, buildPresets, type DateRange } from '@/components/DateRangePicker';
import { FunnelChart } from '@/components/FunnelChart';
import { FunnelPostbackFeed } from '@/components/FunnelPostbackFeed';
import {
  trackerApi,
  type Campaign,
  type FunnelPostbackRow,
  type FunnelReport,
} from '@/lib/api';

export default function FunnelPage() {
  const [range, setRange] = useState<DateRange>(buildPresets()[2]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignId, setCampaignId] = useState('');
  const [funnel, setFunnel] = useState<FunnelReport | null>(null);
  const [postbacks, setPostbacks] = useState<FunnelPostbackRow[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const params = {
    from: range.from,
    to: range.to,
    ...(campaignId ? { campaignId } : {}),
  };

  const load = useCallback(() => {
    setLoading(true);
    const postbackParams = {
      ...params,
      limit: '100',
      ...(selectedStepId && selectedStepId !== 'visits' ? { eventType: selectedStepId } : {}),
    };
    Promise.all([
      trackerApi.getFunnel(params),
      trackerApi.getFunnelPostbacks(postbackParams),
    ])
      .then(([f, pb]) => {
        setFunnel(f);
        setPostbacks(pb);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [range.from, range.to, campaignId, selectedStepId]);

  useEffect(() => {
    trackerApi.getCampaigns().then(setCampaigns).catch(console.error);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selectedStep = funnel?.steps.find((s) => s.stepId === selectedStepId);

  if (loading && !funnel) return <Loading label="Loading funnel..." />;

  return (
    <div>
      <PageHeader
        title="LP Funnel"
        description="Track where visitors drop off — View Content, button clicks, calls, leads, and outbound Mediago postbacks at each step."
        action={
          <Button variant="secondary" size="sm" onClick={load}>
            Refresh
          </Button>
        }
      />

      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <DateRangePicker value={range} onChange={setRange} />
        <div className="min-w-[220px]">
          <label className="text-xs text-zinc-500 block mb-1">Campaign</label>
          <Select
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            className="w-full"
          >
            <option value="">All campaigns</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {funnel && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <SummaryCard label="LP arrivals" value={funnel.visits} />
            <SummaryCard label="Unique visitors" value={funnel.uniqueVisits} />
            <SummaryCard
              label="Reached lead"
              value={funnel.steps.find((s) => s.stepId === 'lead')?.uniqueVisitors ?? 0}
            />
            <SummaryCard
              label="Purchases"
              value={funnel.steps.find((s) => s.stepId === 'purchase')?.uniqueVisitors ?? 0}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <h2 className="text-sm font-semibold text-zinc-900 mb-1">Conversion funnel</h2>
              <p className="text-xs text-zinc-500 mb-4">
                Click a step to filter outbound postbacks below. Drop-off is vs. the previous step.
              </p>
              <FunnelChart
                steps={funnel.steps}
                visits={funnel.visits}
                selectedStepId={selectedStepId}
                onSelectStep={setSelectedStepId}
              />
              {funnel.discoveredEvents.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-100">
                  <p className="text-xs font-medium text-zinc-700 mb-2">Other event types</p>
                  <div className="flex flex-wrap gap-2">
                    {funnel.discoveredEvents.map((e) => (
                      <span
                        key={e.slug}
                        className="text-xs px-2 py-1 rounded bg-zinc-100 text-zinc-600 font-mono"
                      >
                        {e.slug}: {e.uniqueVisitors} visitors
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card>
              <h2 className="text-sm font-semibold text-zinc-900 mb-1">Step summary</h2>
              {selectedStep ? (
                <div className="space-y-3 text-sm">
                  <p className="text-zinc-600">
                    <strong>{selectedStep.label}</strong>
                    {selectedStep.mediagoCode != null && (
                      <span className="ml-2 text-xs text-sky-700">
                        Mediago type {selectedStep.mediagoCode}
                      </span>
                    )}
                  </p>
                  <dl className="grid grid-cols-2 gap-2 text-xs">
                    <Stat label="Unique visitors" value={String(selectedStep.uniqueVisitors)} />
                    <Stat label="% of LP visits" value={`${selectedStep.rateFromVisitsPct}%`} />
                    <Stat label="Drop from prev step" value={`${selectedStep.dropOffFromPrevPct}%`} />
                    <Stat label="Total events" value={String(selectedStep.totalEvents)} />
                    <Stat label="Postbacks sent" value={String(selectedStep.postbacksSent)} />
                    <Stat label="Postbacks failed" value={String(selectedStep.postbacksFailed)} />
                    <Stat label="Pending / skipped" value={String(selectedStep.postbacksPending)} />
                    <Stat label="Revenue" value={`€${selectedStep.revenue.toFixed(2)}`} />
                  </dl>
                  {selectedStep.eventSlugs.length > 0 && (
                    <p className="text-[10px] text-zinc-400 font-mono">
                      Events: {selectedStep.eventSlugs.join(', ')}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">
                  Select a funnel step to see drop-off and postback stats for that stage.
                </p>
              )}
            </Card>
          </div>

          <h2 className="text-sm font-semibold text-zinc-900 mb-3">
            Outbound postbacks
            {selectedStep && (
              <span className="font-normal text-zinc-500 ml-2">— {selectedStep.label}</span>
            )}
          </h2>
          <FunnelPostbackFeed rows={postbacks} />
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
      <p className="text-[10px] uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="text-xl font-semibold text-zinc-900 mt-1">{value.toLocaleString()}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-50 rounded px-2 py-1.5">
      <dt className="text-zinc-400">{label}</dt>
      <dd className="font-medium text-zinc-900">{value}</dd>
    </div>
  );
}
