'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import {
  Alert,
  Badge,
  Button,
  Card,
  Loading,
  PageHeader,
  bodyTextClass,
  linkClass,
  mutedTextClass,
  sectionHeadingClass,
} from '@/components/ui';
import { trackerApi, formatApiError, type AlertEvent } from '@/lib/api';

const SEV_TONE = { success: 'success', warning: 'warning', danger: 'danger', info: 'info' } as const;

export default function AlertsPage() {
  const toast = useToast();
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    trackerApi
      .getAlerts({ limit: '100' })
      .then((data) => {
        setAlerts(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError(formatApiError(err));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const ack = async (id: string) => {
    try {
      await trackerApi.ackAlert(id);
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const resolve = async (id: string) => {
    try {
      await trackerApi.resolveAlert(id);
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  if (loading) return <Loading label="Loading alerts…" />;

  return (
    <div>
      <PageHeader
        title="Alerts"
        description="Automated warnings from your optimization rules — act before budget is wasted."
        action={<Button size="sm" variant="secondary" onClick={load}>Refresh</Button>}
      />

      {error && (
        <div className="mb-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <Card><p className={`text-sm ${mutedTextClass}`}>No alerts — rules run hourly.</p></Card>
        ) : (
          alerts.map((a) => (
            <Card key={a.id} className="border-l-4 border-l-indigo-400 dark:border-l-indigo-500">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge tone={SEV_TONE[a.severity as keyof typeof SEV_TONE] || 'info'}>
                      {a.severity}
                    </Badge>
                    <Badge tone="neutral">{a.status}</Badge>
                    <span className={`text-[10px] ${mutedTextClass}`}>{new Date(a.createdAt).toLocaleString()}</span>
                  </div>
                  <h3 className={`font-medium text-sm ${sectionHeadingClass}`}>{a.title}</h3>
                  <p className={`text-sm ${bodyTextClass} mt-1`}>{a.message}</p>
                  <p className={`text-xs ${linkClass} mt-2`}>→ {a.suggestedAction}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {a.status === 'open' && (
                    <Button size="sm" variant="secondary" onClick={() => ack(a.id)}>
                      Ack
                    </Button>
                  )}
                  {a.status !== 'resolved' && (
                    <Button size="sm" variant="primary" onClick={() => resolve(a.id)}>
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
