'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input, Label, Select, Textarea } from '@/components/ui';
import { trackerApi, type ParamMapping, type TrafficSourceProfile } from '@/lib/api';

const CANONICAL_FIELDS = [
  'tracking_id',
  'external_click_id',
  'gclid',
  'fbclid',
  'ad_id',
  'ad_title',
  'campaign_external_id',
  'publisher_name',
  'site_id',
  'content_name',
  'platform',
  'asset_id',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'cv1',
  'cv2',
  'cv3',
  'cv4',
  'cv5',
  'cv6',
  'cv7',
  'cv8',
  'cv9',
  'cv10',
];

const CONVERSION_METHODS = [
  'mediago_s2s',
  'facebook_capi',
  'google_offline',
  'outbrain_s2s',
  'generic_postback',
  'none',
];

type Tab = 'general' | 'url' | 'params' | 'conversion';

export function TrafficSourceEditor({
  initial,
  isNew,
}: {
  initial?: TrafficSourceProfile;
  isNew?: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('general');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    slug: initial?.slug || '',
    name: initial?.name || '',
    trackingModeDefault: initial?.trackingModeDefault || 'redirect',
    clickUrlTemplate: initial?.clickUrlTemplate || '',
    directAdUrlTemplate: initial?.directAdUrlTemplate || '',
    paramMappings: (initial?.paramMappings || []) as ParamMapping[],
    conversionMethod: initial?.conversionMethod || 'mediago_s2s',
    setupNote: initial?.setupNote || '',
    active: initial?.active ?? true,
    postbackDefaults: (initial?.postbackDefaults || {}) as Record<string, unknown>,
  });

  const addMapping = () => {
    setForm({
      ...form,
      paramMappings: [
        ...form.paramMappings,
        {
          internalField: 'tracking_id',
          displayLabel: 'Tracking ID',
          externalKeys: ['click_id'],
          showInReports: true,
          priority: form.paramMappings.length + 1,
        },
      ],
    });
  };

  const updateMapping = (idx: number, patch: Partial<ParamMapping>) => {
    const next = [...form.paramMappings];
    next[idx] = { ...next[idx], ...patch };
    setForm({ ...form, paramMappings: next });
  };

  const removeMapping = (idx: number) => {
    setForm({
      ...form,
      paramMappings: form.paramMappings.filter((_, i) => i !== idx),
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        clickUrlTemplate: form.clickUrlTemplate || null,
        directAdUrlTemplate: form.directAdUrlTemplate || null,
        setupNote: form.setupNote || null,
      };
      if (isNew) {
        const created = await trackerApi.createTrafficSource(payload);
        router.push(`/traffic-sources/${created.id}`);
      } else if (initial) {
        await trackerApi.updateTrafficSource(initial.id, payload);
        router.refresh();
      }
    } catch (err) {
      alert(String(err));
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'url', label: 'URL Template' },
    { id: 'params', label: 'Param Mapping' },
    { id: 'conversion', label: 'Conversion' },
  ];

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-zinc-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <Card className="space-y-4 max-w-xl">
          <div>
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              disabled={initial?.isSystem}
              className="font-mono"
              required
            />
          </div>
          <div>
            <Label>Default tracking mode</Label>
            <Select
              value={form.trackingModeDefault}
              onChange={(e) =>
                setForm({
                  ...form,
                  trackingModeDefault: e.target.value as 'redirect' | 'direct',
                })
              }
            >
              <option value="redirect">Redirect (native networks)</option>
              <option value="direct">Direct LP (Facebook/Google)</option>
            </Select>
          </div>
          <div>
            <Label>Setup note (shown on campaigns)</Label>
            <Textarea
              value={form.setupNote}
              onChange={(e) => setForm({ ...form, setupNote: e.target.value })}
              rows={3}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Active (visible in campaign picker)
          </label>
        </Card>
      )}

      {tab === 'url' && (
        <Card className="space-y-4 max-w-3xl">
          <p className="text-sm text-zinc-500">
            Use placeholders: <code className="text-xs bg-zinc-100 px-1">{'{clickUrl}'}</code>,{' '}
            <code className="text-xs bg-zinc-100 px-1">{'{destinationUrl}'}</code>,{' '}
            <code className="text-xs bg-zinc-100 px-1">{'{campaignName}'}</code>. Network macros
            like <code className="text-xs bg-zinc-100 px-1">${'{AD_ID}'}</code> stay as-is for ad
            platforms.
          </p>
          {form.trackingModeDefault === 'redirect' ? (
            <div>
              <Label>Click URL template (redirect)</Label>
              <Textarea
                value={form.clickUrlTemplate}
                onChange={(e) => setForm({ ...form, clickUrlTemplate: e.target.value })}
                rows={4}
                className="font-mono text-xs"
                placeholder="{clickUrl}?adid=${AD_ID}&click_id=${TRACKING_ID}"
              />
            </div>
          ) : (
            <div>
              <Label>Direct ad URL template</Label>
              <Textarea
                value={form.directAdUrlTemplate}
                onChange={(e) => setForm({ ...form, directAdUrlTemplate: e.target.value })}
                rows={3}
                className="font-mono text-xs"
                placeholder="{destinationUrl}?utm_source=facebook&utm_campaign={campaignName}"
              />
            </div>
          )}
        </Card>
      )}

      {tab === 'params' && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-zinc-500">
              Map incoming URL query keys to internal fields for storage and reports.
            </p>
            <Button type="button" onClick={addMapping}>
              Add mapping
            </Button>
          </div>
          <div className="space-y-3">
            {form.paramMappings.map((m, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 items-end border border-zinc-100 rounded-lg p-3"
              >
                <div className="col-span-3">
                  <Label>Internal field</Label>
                  <Select
                    value={m.internalField}
                    onChange={(e) => updateMapping(idx, { internalField: e.target.value })}
                  >
                    {CANONICAL_FIELDS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Display label</Label>
                  <Input
                    value={m.displayLabel}
                    onChange={(e) => updateMapping(idx, { displayLabel: e.target.value })}
                  />
                </div>
                <div className="col-span-4">
                  <Label>External keys (comma-separated)</Label>
                  <Input
                    value={m.externalKeys.join(', ')}
                    onChange={(e) =>
                      updateMapping(idx, {
                        externalKeys: e.target.value.split(',').map((k) => k.trim()).filter(Boolean),
                      })
                    }
                    className="font-mono text-xs"
                  />
                </div>
                <div className="col-span-1">
                  <Label>Macro</Label>
                  <Input
                    value={m.urlMacro || ''}
                    onChange={(e) => updateMapping(idx, { urlMacro: e.target.value })}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="col-span-1">
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={m.showInReports}
                      onChange={(e) => updateMapping(idx, { showInReports: e.target.checked })}
                    />
                    Report
                  </label>
                </div>
                <div className="col-span-1">
                  <button
                    type="button"
                    onClick={() => removeMapping(idx)}
                    className="text-red-600 text-xs hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'conversion' && (
        <Card className="space-y-4 max-w-xl">
          <div>
            <Label>Conversion method</Label>
            <Select
              value={form.conversionMethod}
              onChange={(e) => setForm({ ...form, conversionMethod: e.target.value })}
            >
              {CONVERSION_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
          </div>
          {form.conversionMethod === 'mediago_s2s' && (
            <div>
              <Label>Default Mediago conversion type</Label>
              <Input
                type="number"
                value={String(form.postbackDefaults.mediagoConversionType ?? 10)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    postbackDefaults: {
                      ...form.postbackDefaults,
                      mediagoConversionType: parseInt(e.target.value, 10),
                      mediagoEnabled: true,
                      facebookEnabled: false,
                      googleEnabled: false,
                    },
                  })
                }
              />
            </div>
          )}
          {form.conversionMethod === 'outbrain_s2s' && (
            <div>
              <Label>Outbrain postback URL template</Label>
              <Input
                value={String(form.postbackDefaults.outbrainPostbackUrl ?? '')}
                onChange={(e) =>
                  setForm({
                    ...form,
                    postbackDefaults: {
                      ...form.postbackDefaults,
                      outbrainPostbackUrl: e.target.value,
                    },
                  })
                }
                className="font-mono text-xs"
                placeholder="https://tr.outbrain.com/pixel?ob_click_id={tracking_id}"
              />
            </div>
          )}
          {form.conversionMethod === 'facebook_capi' && (
            <p className="text-sm text-zinc-500">
              Campaigns enable Facebook CAPI per pixel/token. LP should pass email, fbp, fbc in{' '}
              <code className="text-xs">tkCallback.registerConversion()</code>.
            </p>
          )}
        </Card>
      )}

      <div className="mt-6">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : isNew ? 'Create profile' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}
