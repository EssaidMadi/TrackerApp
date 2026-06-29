'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
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
  linkClass,
  mutedTextClass,
  sectionHeadingClass,
  statusTone,
  tableRowClass,
} from '@/components/ui';
import { trackerApi, formatApiError, type Campaign, type TrackingDomain, type TrafficSourceProfile } from '@/lib/api';

export default function CampaignsPage() {
  const toast = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [domains, setDomains] = useState<TrackingDomain[]>([]);
  const [profiles, setProfiles] = useState<TrafficSourceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    externalId: '',
    trafficSourceProfileId: '',
    trackingMode: 'redirect' as 'redirect' | 'direct',
    domainId: '',
    destinationUrl: '',
  });

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      setLoading(true);
      trackerApi
        .getCampaigns()
        .then((data) => {
          if (!cancelled) {
            setCampaigns(data);
            setError(null);
          }
        })
        .catch((err) => {
          console.error(err);
          if (!cancelled) setError(formatApiError(err));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    load();
    trackerApi.getDomains().then((d) => { if (!cancelled) setDomains(d); }).catch(console.error);
    trackerApi.getTrafficSources().then((p) => { if (!cancelled) setProfiles(p); }).catch(console.error);

    return () => { cancelled = true; };
  }, []);

  const reload = () => {
    setLoading(true);
    trackerApi
      .getCampaigns()
      .then((data) => {
        setCampaigns(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError(formatApiError(err));
      })
      .finally(() => setLoading(false));
  };

  const selectedProfile = profiles.find((p) => p.id === form.trafficSourceProfileId);

  const handleProfileChange = (profileId: string) => {
    const profile = profiles.find((p) => p.id === profileId);
    setForm({
      ...form,
      trafficSourceProfileId: profileId,
      trackingMode: profile?.trackingModeDefault || 'redirect',
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await trackerApi.createCampaign({
        name: form.name,
        slug: form.slug,
        externalId: form.externalId || undefined,
        trafficSourceProfileId: form.trafficSourceProfileId || undefined,
        trackingMode: form.trackingMode,
        domainId: form.domainId || undefined,
        destinationUrl: form.destinationUrl,
      });
      setShowForm(false);
      setForm({
        name: '',
        slug: '',
        externalId: '',
        trafficSourceProfileId: profiles[0]?.id || '',
        trackingMode: 'redirect',
        domainId: '',
        destinationUrl: '',
      });
      reload();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const toggleActive = async (c: Campaign) => {
    setTogglingId(c.id);
    try {
      await trackerApi.updateCampaign(c.id, { active: !c.active });
      reload();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setTogglingId(null);
    }
  };

  const previewRef = form.externalId || form.slug || 'your-campaign-id';
  const lpScript = `<script src="/t/tracker.js" data-campaign="${previewRef}" data-mode="${form.trackingMode}"></script>`;
  const helpNote = selectedProfile?.setupNote;
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

      {error && (
        <div className="mb-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

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
                <Label>Traffic source profile</Label>
                <Select
                  value={form.trafficSourceProfileId}
                  onChange={(e) => handleProfileChange(e.target.value)}
                  required
                >
                  <option value="">Select profile...</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.isSystem ? '' : '(custom)'}
                    </option>
                  ))}
                </Select>
                {selectedProfile && (
                  <Link
                    href={`/traffic-sources/${selectedProfile.id}`}
                    className={`text-xs ${linkClass} mt-1 inline-block`}
                  >
                    Edit profile mappings →
                  </Link>
                )}
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
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
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

            {helpNote && (
              <Alert tone="info">
                <p>{helpNote}</p>
              </Alert>
            )}

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
              <tr key={c.id} className={tableRowClass}>
                <Td>
                  <span className={`font-medium ${sectionHeadingClass}`}>{c.name}</span>
                </Td>
                <Td>
                  <span className="capitalize">
                    {c.trafficSourceProfile?.name || c.trafficSource}
                  </span>
                  {c.domain && (
                    <p className={`text-xs font-mono ${mutedTextClass} mt-0.5`}>{c.domain.hostname}</p>
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
                    <Link href={`/campaigns/${c.id}`} className={`text-sm ${linkClass} font-medium`}>
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
