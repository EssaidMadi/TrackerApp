'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Badge,
  Button,
  Card,
  CodeBlock,
  Input,
  Label,
  Loading,
  Select,
  StatCard,
  statusTone,
} from '@/components/ui';
import { PostbackPreview } from '@/components/PostbackPreview';
import { IncomingConversionGuide } from '@/components/IncomingConversionGuide';
import {
  trackerApi,
  type Campaign,
  type PostbackConfig,
  type TrackingDomain,
  type TrafficSourceProfile,
  type VisitStats,
} from '@/lib/api';

type CampaignForm = {
  name: string;
  slug: string;
  externalId: string;
  trafficSourceProfileId: string;
  trackingMode: 'redirect' | 'direct';
  domainId: string;
  destinationUrl: string;
  active: boolean;
  landerName: string;
  offerName: string;
  workspaceName: string;
};

function toForm(c: Campaign): CampaignForm {
  return {
    name: c.name,
    slug: c.slug,
    externalId: c.externalId || '',
    trafficSourceProfileId: c.trafficSourceProfileId || c.trafficSourceProfile?.id || '',
    trackingMode: c.trackingMode || 'redirect',
    domainId: c.domainId || '',
    destinationUrl: c.destinationUrl,
    active: c.active,
    landerName: c.landerName || '',
    offerName: c.offerName || '',
    workspaceName: c.workspaceName || '',
  };
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [form, setForm] = useState<CampaignForm | null>(null);
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [postback, setPostback] = useState<Partial<PostbackConfig>>({});
  const [domains, setDomains] = useState<TrackingDomain[]>([]);
  const [profiles, setProfiles] = useState<TrafficSourceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    Promise.all([trackerApi.getCampaign(id), trackerApi.getStats(id)])
      .then(([c, s]) => {
        setCampaign(c);
        setForm(toForm(c));
        setStats(s);
        if (c.postbackConfig) setPostback(c.postbackConfig);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    trackerApi.getDomains().then(setDomains).catch(console.error);
    trackerApi.getTrafficSources().then(setProfiles).catch(console.error);
  }, [id]);

  const saveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const updated = await trackerApi.updateCampaign(id, form);
      setCampaign(updated);
      setForm(toForm(updated));
      alert('Campaign saved');
    } catch (err) {
      alert(String(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteCampaign = async () => {
    if (!campaign) return;
    const confirmed = window.confirm(
      `Delete "${campaign.name}"?\n\nThis permanently removes the campaign and all its clicks and conversions.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await trackerApi.deleteCampaign(id);
      router.push('/');
    } catch (err) {
      alert(String(err));
      setDeleting(false);
    }
  };

  const savePostback = async () => {
    try {
      const updated = await trackerApi.updatePostbackConfig(id, postback);
      setCampaign(updated);
      alert('Postback config saved');
    } catch (err) {
      alert(String(err));
    }
  };

  if (loading) return <Loading />;
  if (!campaign || !form) return <p className="text-red-600 text-sm">Campaign not found</p>;

  return (
    <div>
      <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-6 inline-block">
        ← Back to campaigns
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-zinc-900">{campaign.name}</h1>
            <Badge tone={campaign.active ? 'success' : 'neutral'}>
              {campaign.active ? 'Active' : 'Stopped'}
            </Badge>
            <Badge tone={statusTone(campaign.trackingMode)}>{campaign.trackingMode}</Badge>
          </div>
          <p className="text-sm text-zinc-500 capitalize mt-1">
            {campaign.trafficSourceProfile?.name || campaign.trafficSource} · {campaign.slug}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                const updated = await trackerApi.updateCampaign(id, { active: !campaign.active });
                setCampaign(updated);
                setForm(toForm(updated));
              } catch (err) {
                alert(String(err));
              }
            }}
          >
            {campaign.active ? 'Stop campaign' : 'Enable campaign'}
          </Button>
          <Button variant="danger" onClick={deleteCampaign} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard label="Visits" value={stats.visits} />
          <StatCard label="Unique visits" value={stats.uniqueVisits} />
          <StatCard label="New visitors" value={stats.newVisitors} />
          <StatCard label="Returning" value={stats.returningVisitors} />
          <StatCard label="Conversions" value={stats.conversions} />
          <StatCard label="Conversion rate" value={`${stats.conversionRate}%`} />
        </div>
      )}

      <Card className="mb-6">
      <form onSubmit={saveCampaign} className="grid gap-4">
        <h2 className="font-semibold">Edit campaign</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border rounded px-3 py-2 w-full"
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="border rounded px-3 py-2 w-full font-mono text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">External ID (Voluum UUID path)</label>
          <input
            value={form.externalId}
            onChange={(e) => setForm({ ...form, externalId: e.target.value })}
            className="border rounded px-3 py-2 w-full font-mono text-sm"
            placeholder="8d92ac23-ca85-497e-87c4-44ddd2ade345"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Traffic source profile</label>
            <select
              value={form.trafficSourceProfileId}
              onChange={(e) => {
                const profile = profiles.find((p) => p.id === e.target.value);
                setForm({
                  ...form,
                  trafficSourceProfileId: e.target.value,
                  trackingMode: profile?.trackingModeDefault || form.trackingMode,
                });
              }}
              className="border rounded px-3 py-2 w-full"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <Link
              href={`/traffic-sources/${campaign.trafficSourceProfileId || ''}`}
              className="text-xs text-indigo-600 hover:underline mt-1 inline-block"
            >
              Edit profile →
            </Link>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Tracking mode</label>
            <select
              value={form.trackingMode}
              onChange={(e) =>
                setForm({ ...form, trackingMode: e.target.value as 'redirect' | 'direct' })
              }
              className="border rounded px-3 py-2 w-full"
            >
              <option value="redirect">Redirect (native — Mediago/Outbrain)</option>
              <option value="direct">Direct LP (Facebook/Google)</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          <span className="text-sm">Active — accepts new clicks/visits</span>
        </label>

        <div>
          <label className="text-xs text-gray-500 block mb-1">Tracking domain</label>
          <select
            value={form.domainId}
            onChange={(e) => setForm({ ...form, domainId: e.target.value })}
            className="border rounded px-3 py-2 w-full"
          >
            <option value="">Default tracker URL</option>
            {domains
              .filter((d) => d.status === 'verified')
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.hostname}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">Destination URL (landing page)</label>
          <input
            value={form.destinationUrl}
            onChange={(e) => setForm({ ...form, destinationUrl: e.target.value })}
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Lander name</label>
            <input
              value={form.landerName}
              onChange={(e) => setForm({ ...form, landerName: e.target.value })}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Offer name</label>
            <input
              value={form.offerName}
              onChange={(e) => setForm({ ...form, offerName: e.target.value })}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Workspace name</label>
            <input
              value={form.workspaceName}
              onChange={(e) => setForm({ ...form, workspaceName: e.target.value })}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 w-fit"
        >
          {saving ? 'Saving...' : 'Save campaign'}
        </button>
      </form>
      </Card>

      <Card className="mb-6">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">
          {campaign.trackingMode === 'direct' ? 'Direct Ad URL' : 'Redirect Click URL'}
        </h2>
        {campaign.setupNote && (
          <p className="text-sm text-indigo-800 bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-3">
            {campaign.setupNote}
          </p>
        )}
        <CodeBlock>{campaign.trackingTemplate}</CodeBlock>
      </Card>

      {campaign.paramMappings && campaign.paramMappings.length > 0 && (
        <Card className="mb-6">
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">Param mapping (inherited)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-zinc-400 border-b">
                  <th className="py-2 pr-4">Display</th>
                  <th className="py-2 pr-4">Internal</th>
                  <th className="py-2 pr-4">External keys</th>
                  <th className="py-2">In reports</th>
                </tr>
              </thead>
              <tbody>
                {campaign.paramMappings.map((m) => (
                  <tr key={m.internalField} className="border-b border-zinc-50">
                    <td className="py-2 pr-4">{m.displayLabel}</td>
                    <td className="py-2 pr-4 font-mono text-zinc-500">{m.internalField}</td>
                    <td className="py-2 pr-4 font-mono">{m.externalKeys.join(', ')}</td>
                    <td className="py-2">{m.showInReports ? 'Yes' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card className="mb-6">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">LP Script</h2>
        <CodeBlock>{campaign.lpScriptSnippet || ''}</CodeBlock>
      </Card>

      <Card className="mb-6">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">
          Incoming conversion URL (tell your LP / CRM)
        </h2>
        {campaign.domain && (
          <p className="text-xs text-zinc-500 mb-3">
            Tracking domain: <span className="font-mono">{campaign.domain.hostname}</span> — this
            campaign&apos;s unique conversion endpoint.
          </p>
        )}
        <IncomingConversionGuide
          trackerBaseUrl={campaign.trackerBaseUrl}
          incomingConversionUrl={campaign.incomingConversionUrl}
          incomingConversionUrlAlt={campaign.incomingConversionUrlAlt}
          trackingMode={campaign.trackingMode}
          lpScriptSnippet={campaign.lpScriptSnippet}
        />
      </Card>

      <Card className="mb-6">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">Outbound conversion (what we send)</h2>
        <PostbackPreview
          conversionMethod={campaign.conversionMethod}
          postback={postback}
        />
        <p className="text-xs text-zinc-400 mt-4">
          After a real conversion, expand it on the <strong>Conversions</strong> page to see the exact
          URL/body sent and Mediago/Facebook/Google response.
        </p>
      </Card>

      <Card>
        <h2 className="font-semibold mb-4">Postback Configuration</h2>

        <p className="text-sm text-zinc-500 mb-4">
          Conversion method:{' '}
          <span className="font-medium text-zinc-800">
            {(campaign.conversionMethod || 'mediago_s2s').replace(/_/g, ' ')}
          </span>
        </p>

        <div className="space-y-4">
          {(campaign.conversionMethod === 'mediago_s2s' || !campaign.conversionMethod) && (
          <fieldset className="border rounded p-4">
            <legend className="px-2 text-sm font-medium">Mediago S2S</legend>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={postback.mediagoEnabled ?? true}
                onChange={(e) => setPostback({ ...postback, mediagoEnabled: e.target.checked })}
              />
              Enabled
            </label>
            <input
              type="number"
              placeholder="Conversion type (10 = Lead)"
              value={postback.mediagoConversionType ?? 10}
              onChange={(e) =>
                setPostback({ ...postback, mediagoConversionType: parseInt(e.target.value, 10) })
              }
              className="border rounded px-3 py-2 w-full"
            />
          </fieldset>
          )}

          {campaign.conversionMethod === 'facebook_capi' && (
          <fieldset className="border rounded p-4">
            <legend className="px-2 text-sm font-medium">Facebook CAPI</legend>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={postback.facebookEnabled ?? false}
                onChange={(e) => setPostback({ ...postback, facebookEnabled: e.target.checked })}
              />
              Enabled
            </label>
            <input
              placeholder="Pixel ID"
              value={postback.facebookPixelId || ''}
              onChange={(e) => setPostback({ ...postback, facebookPixelId: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-2"
            />
            <input
              placeholder="Access Token"
              value={postback.facebookAccessToken || ''}
              onChange={(e) => setPostback({ ...postback, facebookAccessToken: e.target.value })}
              className="border rounded px-3 py-2 w-full"
            />
          </fieldset>
          )}

          {campaign.conversionMethod === 'google_offline' && (
          <fieldset className="border rounded p-4">
            <legend className="px-2 text-sm font-medium">Google</legend>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={postback.googleEnabled ?? false}
                onChange={(e) => setPostback({ ...postback, googleEnabled: e.target.checked })}
              />
              Enabled
            </label>
            <input
              placeholder="Conversion ID"
              value={postback.googleConversionId || ''}
              onChange={(e) => setPostback({ ...postback, googleConversionId: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-2"
            />
            <input
              placeholder="Conversion Label"
              value={postback.googleConversionLabel || ''}
              onChange={(e) => setPostback({ ...postback, googleConversionLabel: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-2"
            />
            <input
              placeholder="Custom postback URL (optional)"
              value={postback.googlePostbackUrl || ''}
              onChange={(e) => setPostback({ ...postback, googlePostbackUrl: e.target.value })}
              className="border rounded px-3 py-2 w-full"
            />
          </fieldset>
          )}
        </div>

        <Button onClick={savePostback} className="mt-4">
          Save Postback Config
        </Button>
      </Card>
    </div>
  );
}
