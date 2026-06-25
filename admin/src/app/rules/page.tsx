'use client';

import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Loading,
  PageHeader,
} from '@/components/ui';
import { trackerApi, type OptimizationRule } from '@/lib/api';

export default function RulesPage() {
  const [rules, setRules] = useState<OptimizationRule[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    trackerApi.getRules().then(setRules).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (rule: OptimizationRule) => {
    await trackerApi.updateRule(rule.id, { enabled: !rule.enabled });
    load();
  };

  if (loading) return <Loading label="Loading rules…" />;

  return (
    <div>
      <PageHeader
        title="Optimization Rules"
        description="Thresholds that trigger in-app alerts when spend, bots, or ROI go off track."
      />

      <div className="space-y-3">
        {rules.map((r) => (
          <Card key={r.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-sm">{r.name}</h3>
                  <Badge tone={r.enabled ? 'success' : 'neutral'}>{r.enabled ? 'On' : 'Off'}</Badge>
                  <Badge tone="info">{r.severity}</Badge>
                </div>
                <p className="text-xs text-zinc-600">
                  {r.scope} · {r.metric} {r.operator} {r.threshold} · window {r.windowHours}h · action: {r.action}
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => toggle(r)}>
                {r.enabled ? 'Disable' : 'Enable'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
