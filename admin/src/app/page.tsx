'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Badge,
  Button,
  Card,
  CodeBlock,
  DataTable,
  EmptyState,
  Input,
  Label,
  Loading,
  PageHeader,
  Select,
  TableHead,
  Td,
  Th,
  statusTone,
} from '@/components/ui';
import { trackerApi, type Campaign, type TrackingDomain } from '@/lib/api';

function defaultTrackingMode(source: string): 'redirect' | 'direct' {
  return source === 'facebook' || source === 'google' ? 'direct' : 'redirect';
}

const SOURCE_HELP: Record<string, { title: string; steps: string[] }> = {
  mediago: {
    title: 'Native redirect tracking',
    steps: [
      'Put the Click URL in Mediago tracking field',
      'User clicks ad → tracker records visit → redirects to LP',
      'Add the LP script on your landing page for conversions',
    ],
  },
  native: {
    title: 'Native redirect tracking',
    steps: ['Put the Click URL in your native network', 'Tracker redirects to LP after visit'],
  },
  facebook: {
    title: 'Direct tracking',
    steps: [
      'Put LP URL directly in Facebook Ads',
      'Do NOT use a redirect tracker URL — fbclid is added automatically',
      'Add LP script in page <head>',
    ],
  },
  google: {
    title: 'Direct tracking',
    steps: [
      'Put LP URL directly in Google Ads',
      'Do NOT use a redirect tracker URL — gclid is added automatically',
      'Add LP script in page <head>',
    ],
  },
  outbrain: {
    title: 'Native redirect tracking',
    steps: ['Put Click URL in Outbrain', 'Tracker redirects to LP'],
  },
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [domains, setDomains] = useState<TrackingDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    externalId: '',
    trafficSource: 'mediago',
    trackingMode: 'redirect' as 'redirect' | 'direct',
    domainId: '',
    destinationUrl: '',
  });

  const load = () => {
    trackerApi
      .getCampaigns()
      .then(setCampaigns)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    trackerApi.getDomains().then(setDomains).catch(console.error);
  }, []);

  const handleSourceChange = (trafficSource: string) => {
    setForm({ ...form, trafficSource, trackingMode: defaultTrackingMode(trafficSource) });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await trackerApi.createCampaign({ ...form, domainId: form.domainId || undefined });
      setShowForm(false);
      setForm({
        name: '',
        slug: '',
        externalId: '',
        trafficSource: 'mediago',
        trackingMode: 'redirect',
        domainId: '',
        destinationUrl: '',
      });
      load();
    } catch (err) {
      alert(String(err));
    }
  };

  const toggleActive = async (c: Campaign) => {
    setTogglingId(c.id);
    try {
      await trackerApi.updateCampaign(c.id, { active: !c.active });
      load();
    } catch (err) {
      alert(String(err));
    } finally {
      setTogglingId(null);
    }
  };

  const previewRef = form.externalId || form.slug || 'your-campaign-id';
  const lpScript = `<script src="/t/tracker.js" data-campaign="${previewRef}" data-mode="${form.trackingMode}"></script>`;
  const help = SOURCE_HELP[form.trafficSource] || SOURCE_HELP.native;
  const verifiedDomains = domains.filter((d) => d.status === 'verified');

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Campaigns"
        description="Manage tracking URLs, domains, and LP scripts for each traffic source."
        action={
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'New campaign'}
          </Button>
        }
        meta={<Badge tone="neutral">{campaigns.length} total</Badge>}
      />

      {showForm && (
        <Card className="mb-8">
          <form onSubmit={handleCreate} className="grid gap-5 max-w-2xl">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Campaign name</Label>
                <Input
                  placeholder="e.g. Seniors Santé Plus"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  placeholder="seniorsante-plus"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label>External ID / UUID (optional)</Label>
              <Input
                className="font-mono"
                placeholder="Voluum-style path segment"
                value={form.externalId}
                onChange={(e) => setForm({ ...form, externalId: e.target.value })}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Traffic source</Label>
                <Select value={form.trafficSource} onChange={(e) => handleSourceChange(e.target.value)}>
                  <option value="mediago">Mediago</option>
                  <option value="native">Native</option>
                  <option value="facebook">Facebook</option>
                  <option value="google">Google</option>
                  <option value="outbrain">Outbrain</option>
                </Select>
              </div>
              <div>
                <Label>Tracking mode</Label>
                <Select
                  value={form.trackingMode}
                  onChange={(e) =>
                    setForm({ ...form, trackingMode: e.target.value as 'redirect' | 'direct' })
                  }
                >
                  <option value="redirect">Redirect (native)</option>
                  <option value="direct">Direct LP (FB/Google)</option>
                </Select>
              </div>
            </div>

            <div>
              <Label>Tracking domain</Label>
              <Select
                value={form.domainId}
                onChange={(e) => setForm({ ...form, domainId: e.target.value })}
              >
                <option value="">Default (localhost / TRACKER_BASE_URL)</option>
                {verifiedDomains.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.hostname}
                  </option>
                ))}
              </Select>
              {verifiedDomains.length === 0 && (
                <p className="text-xs text-amber-600 mt-1.5">
                  No verified domains — <Link href="/domains" className="underline">add one</Link>
                </p>
              )}
            </div>

            <div>
              <Label>Landing page URL</Label>
              <Input
                placeholder="https://your-lp.com/offer"
                value={form.destinationUrl}
                onChange={(e) => setForm({ ...form, destinationUrl: e.target.value })}
                required
              />
            </div>

            <Alert tone="info">
              <p className="font-medium mb-2">{help.title}</p>
              <ul className="list-disc ml-4 space-y-1 text-indigo-800/80">
                {help.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </Alert>

            <div>
              <Label>LP script — add to &lt;head&gt;</Label>
              <CodeBlock>{lpScript}</CodeBlock>
            </div>

            <Button type="submit" variant="success" className="w-fit">
              Create campaign
            </Button>
          </form>
        </Card>
      )}

      <DataTable>
        <table className="w-full">
          <TableHead>
            <Th>Name</Th>
            <Th>Source</Th>
            <Th>Mode</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </TableHead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50">
                <Td>
                  <span className="font-medium text-zinc-900">{c.name}</span>
                </Td>
                <Td>
                  <span className="capitalize">{c.trafficSource}</span>
                  {c.domain && (
                    <p className="text-xs font-mono text-zinc-400 mt-0.5">{c.domain.hostname}</p>
                  )}
                </Td>
                <Td>
                  <Badge tone={statusTone(c.trackingMode)}>{c.trackingMode}</Badge>
                </Td>
                <Td>
                  <Badge tone={c.active ? 'success' : 'neutral'}>
                    {c.active ? 'Active' : 'Stopped'}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex gap-2 items-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => toggleActive(c)}
                      disabled={togglingId === c.id}
                    >
                      {togglingId === c.id ? '...' : c.active ? 'Stop' : 'Enable'}
                    </Button>
                    <Link
                      href={`/campaigns/${c.id}`}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Edit
                    </Link>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
        {campaigns.length === 0 && (
          <EmptyState title="No campaigns yet" description="Create your first campaign to get started." />
        )}
      </DataTable>
    </div>
  );
}
