'use client';

import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Loading,
  PageHeader,
} from '@/components/ui';
import { trackerApi, type AlertEvent } from '@/lib/api';

const SEV_TONE = { success: 'success', warning: 'warning', danger: 'danger', info: 'info' } as const;

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    trackerApi
      .getAlerts({ limit: '100' })
      .then(setAlerts)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Loading label="Loading alerts…" />;

  return (
    <div>
      <PageHeader
        title="Alerts"
        description="Automated warnings from your optimization rules — act before budget is wasted."
        action={<Button size="sm" variant="secondary" onClick={load}>Refresh</Button>}
      />

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <Card><p className="text-sm text-zinc-500">No alerts — rules run hourly.</p></Card>
        ) : (
          alerts.map((a) => (
            <Card key={a.id} className="border-l-4 border-l-indigo-400">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge tone={SEV_TONE[a.severity as keyof typeof SEV_TONE] || 'info'}>
                      {a.severity}
                    </Badge>
                    <Badge tone="neutral">{a.status}</Badge>
                    <span className="text-[10px] text-zinc-400">{new Date(a.createdAt).toLocaleString()}</span>
                  </div>
                  <h3 className="font-medium text-sm text-zinc-900">{a.title}</h3>
                  <p className="text-sm text-zinc-600 mt-1">{a.message}</p>
                  <p className="text-xs text-indigo-700 mt-2">→ {a.suggestedAction}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {a.status === 'open' && (
                    <Button size="sm" variant="secondary" onClick={() => trackerApi.ackAlert(a.id).then(load)}>
                      Ack
                    </Button>
                  )}
                  {a.status !== 'resolved' && (
                    <Button size="sm" variant="primary" onClick={() => trackerApi.resolveAlert(a.id).then(load)}>
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
