'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  Input,
  Label,
  Loading,
  PageHeader,
  Select,
  bodyTextClass,
  mutedTextClass,
  sectionHeadingClass,
} from '@/components/ui';
import { useToast } from '@/components/Toast';
import { trackerApi, formatApiError, type Campaign, type OptimizationRule } from '@/lib/api';

const SCOPES = [
  { id: 'site', label: 'Site' },
  { id: 'publisher', label: 'Publisher' },
  { id: 'campaign', label: 'Campaign' },
];

const METRICS = [
  { id: 'spendNoEvents', label: 'Spend with no events ($)', help: 'Flag placements that spent at least X with zero events.', scopes: ['site', 'publisher'] },
  { id: 'botPct', label: 'Bot traffic (%)', help: 'Flag when bot share is at/over X%.', scopes: ['site', 'publisher'] },
  { id: 'roi', label: 'ROI (%)', help: 'Flag campaigns whose ROI crosses X%.', scopes: ['campaign'] },
  { id: 'cpa', label: 'Cost per acquisition ($)', help: 'Flag when CPA crosses X.', scopes: ['campaign'] },
  { id: 'budgetPace', label: 'Budget pace (%)', help: 'Flag when projected spend crosses X% of daily budget.', scopes: ['campaign'] },
];

const OPERATORS = [
  { id: 'gte', label: '≥ (greater or equal)' },
  { id: 'gt', label: '> (greater than)' },
  { id: 'lte', label: '≤ (less or equal)' },
  { id: 'lt', label: '< (less than)' },
];

const ACTIONS = [
  { id: 'alert', label: 'Alert only' },
  { id: 'suggest_block', label: 'Suggest block' },
  { id: 'suggest_pause', label: 'Suggest pause' },
];

const SEVERITIES = [
  { id: 'info', label: 'Info' },
  { id: 'warning', label: 'Warning' },
  { id: 'danger', label: 'Danger' },
  { id: 'success', label: 'Success' },
];

type RuleForm = {
  name: string;
  scope: string;
  metric: string;
  operator: string;
  threshold: string;
  windowHours: string;
  action: string;
  severity: string;
  campaignId: string;
  enabled: boolean;
};

const EMPTY_FORM: RuleForm = {
  name: '',
  scope: 'site',
  metric: 'spendNoEvents',
  operator: 'gte',
  threshold: '10',
  windowHours: '24',
  action: 'suggest_block',
  severity: 'warning',
  campaignId: '',
  enabled: true,
};

function toForm(rule: OptimizationRule): RuleForm {
  return {
    name: rule.name,
    scope: rule.scope,
    metric: rule.metric,
    operator: rule.operator,
    threshold: String(rule.threshold),
    windowHours: String(rule.windowHours),
    action: rule.action,
    severity: rule.severity,
    campaignId: rule.campaignId || '',
    enabled: rule.enabled,
  };
}

const SEV_TONE: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  info: 'info',
  warning: 'warning',
  danger: 'danger',
  success: 'success',
};

function metricLabel(id: string) {
  return METRICS.find((m) => m.id === id)?.label ?? id;
}
function operatorSymbol(id: string) {
  return OPERATORS.find((o) => o.id === id)?.label.split(' ')[0] ?? id;
}

export default function RulesPage() {
  const toast = useToast();
  const [rules, setRules] = useState<OptimizationRule[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RuleForm>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    trackerApi
      .getRules()
      .then((data) => {
        setRules(data);
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
    trackerApi.getCampaigns().then(setCampaigns).catch(console.error);
  }, []);

  const startCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const startEdit = (rule: OptimizationRule) => {
    setEditingId(rule.id);
    setForm(toForm(rule));
    setShowForm(true);
  };

  const cancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim() || metricLabel(form.metric),
        scope: form.scope,
        metric: form.metric,
        operator: form.operator,
        threshold: parseFloat(form.threshold) || 0,
        windowHours: parseInt(form.windowHours, 10) || 24,
        action: form.action,
        severity: form.severity,
        enabled: form.enabled,
        campaignId: form.campaignId || undefined,
      };
      if (editingId) {
        await trackerApi.updateRule(editingId, payload);
      } else {
        await trackerApi.createRule(payload);
      }
      cancel();
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (rule: OptimizationRule) => {
    try {
      await trackerApi.updateRule(rule.id, { enabled: !rule.enabled });
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const remove = async (rule: OptimizationRule) => {
    if (!confirm(`Delete rule "${rule.name}"?`)) return;
    try {
      await trackerApi.deleteRule(rule.id);
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const availableMetrics = METRICS.filter((m) => m.scopes.includes(form.scope));
  const activeMetric = METRICS.find((m) => m.id === form.metric);

  if (loading) return <Loading label="Loading rules…" />;

  return (
    <div>
      <PageHeader
        title="Optimization Rules"
        description="Thresholds that trigger in-app alerts when spend, bots, or ROI go off track. Add your own or tune the defaults."
        action={
          !showForm ? (
            <Button size="sm" variant="primary" onClick={startCreate}>
              New rule
            </Button>
          ) : undefined
        }
      />

      {error && (
        <div className="mb-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      {showForm && (
        <Card className="mb-6">
          <h2 className={`${sectionHeadingClass} mb-4`}>
            {editingId ? 'Edit rule' : 'New rule'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2 lg:col-span-3">
              <Label>Rule name</Label>
              <Input
                value={form.name}
                placeholder="e.g. Block costly dead sites"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Scope</Label>
              <Select
                value={form.scope}
                onChange={(e) => {
                  const scope = e.target.value;
                  const metrics = METRICS.filter((m) => m.scopes.includes(scope));
                  setForm({
                    ...form,
                    scope,
                    metric: metrics[0]?.id ?? form.metric,
                  });
                }}
              >
                {SCOPES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </Select>
              <p className={`text-xs ${mutedTextClass} mt-1.5`}>
                Creative-level rules coming soon.
              </p>
            </div>

            <div>
              <Label>Metric</Label>
              <Select
                value={form.metric}
                onChange={(e) => setForm({ ...form, metric: e.target.value })}
              >
                {availableMetrics.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Condition</Label>
              <div className="flex gap-2">
                <Select
                  value={form.operator}
                  onChange={(e) => setForm({ ...form, operator: e.target.value })}
                  className="w-auto"
                >
                  {OPERATORS.map((o) => (
                    <option key={o.id} value={o.id}>{o.label.split(' ')[0]}</option>
                  ))}
                </Select>
                <Input
                  type="number"
                  value={form.threshold}
                  onChange={(e) => setForm({ ...form, threshold: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Window (hours)</Label>
              <Input
                type="number"
                value={form.windowHours}
                onChange={(e) => setForm({ ...form, windowHours: e.target.value })}
              />
              <p className={`text-xs ${mutedTextClass} mt-1.5`}>
                Rolling lookback window used by the rule engine when evaluating metrics (runs hourly).
              </p>
            </div>

            <div>
              <Label>Action</Label>
              <Select
                value={form.action}
                onChange={(e) => setForm({ ...form, action: e.target.value })}
              >
                {ACTIONS.map((a) => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Severity</Label>
              <Select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
              >
                {SEVERITIES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Apply to campaign</Label>
              <Select
                value={form.campaignId}
                onChange={(e) => setForm({ ...form, campaignId: e.target.value })}
              >
                <option value="">All campaigns</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
          </div>

          {activeMetric && (
            <p className={`text-xs ${mutedTextClass} mt-3`}>{activeMetric.help}</p>
          )}

          <Checkbox
            className="mt-4"
            label="Enabled"
            checked={form.enabled}
            onChange={(checked) => setForm({ ...form, enabled: checked })}
          />

          <div className="flex gap-2 mt-5">
            <Button variant="primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create rule'}
            </Button>
            <Button variant="secondary" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {rules.length === 0 && !showForm ? (
          <EmptyState
            title="No rules yet"
            description="Create a rule to start getting automated alerts."
          />
        ) : (
          rules.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-medium text-sm ${sectionHeadingClass}`}>{r.name}</h3>
                    <Badge tone={r.enabled ? 'success' : 'neutral'}>{r.enabled ? 'On' : 'Off'}</Badge>
                    <Badge tone={SEV_TONE[r.severity] || 'info'}>{r.severity}</Badge>
                  </div>
                  <p className={`text-xs ${bodyTextClass}`}>
                    {r.scope} · {metricLabel(r.metric)} {operatorSymbol(r.operator)} {r.threshold} · window {r.windowHours}h · action: {r.action}
                    {r.campaignId ? ' · single campaign' : ' · all campaigns'}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="secondary" onClick={() => toggle(r)}>
                    {r.enabled ? 'Disable' : 'Enable'}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => startEdit(r)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => remove(r)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
