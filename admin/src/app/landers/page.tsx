'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import {
  Alert,
  Badge,
  Button,
  Card,
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
  tableRowClass,
} from '@/components/ui';
import { trackerApi, formatApiError, type Campaign, type Lander } from '@/lib/api';

export default function LandersPage() {
  const toast = useToast();
  const [landers, setLanders] = useState<Lander[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    campaignId: '',
    slug: '',
    rootDomain: '',
    publicUrl: '',
  });

  const load = () => {
    Promise.all([trackerApi.getLanders(), trackerApi.getCampaigns()])
      .then(([l, c]) => {
        setLanders(l);
        setCampaigns(c);
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

  const loadSuggestions = async (campaignId: string, name: string) => {
    if (!campaignId) return;
    try {
      const s = await trackerApi.suggestLander({
        campaignId,
        ...(name ? { name } : {}),
      });
      setForm((f) => ({
        ...f,
        slug: s.slug,
        rootDomain: s.rootDomain,
        publicUrl: s.publicUrl,
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const lander = await trackerApi.createLander({
        name: form.name,
        campaignId: form.campaignId,
        slug: form.slug || undefined,
        rootDomain: form.rootDomain || undefined,
        publicUrl: form.publicUrl || undefined,
      });
      setShowForm(false);
      setForm({ name: '', campaignId: '', slug: '', rootDomain: '', publicUrl: '' });
      window.location.href = `/landers/${lander.id}`;
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (lander: Lander) => {
    if (!window.confirm(`Delete lander "${lander.name}"?`)) return;
    try {
      await trackerApi.deleteLander(lander.id);
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Landers"
        description="Upload static landing pages, link them to campaigns, and export deploy bundles with tracker injection."
        meta={<Badge tone="neutral">{landers.length}</Badge>}
        action={
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'New lander'}
          </Button>
        }
      />

      {error && (
        <div className="mb-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      {showForm && (
        <Card className="mb-8">
          <form onSubmit={handleCreate} className="space-y-4 max-w-xl">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm({ ...form, name });
                  if (form.campaignId) loadSuggestions(form.campaignId, name);
                }}
                placeholder="Nexo Quote LP"
                required
              />
            </div>
            <div>
              <Label>Campaign</Label>
              <Select
                value={form.campaignId}
                onChange={(e) => {
                  const campaignId = e.target.value;
                  setForm({ ...form, campaignId });
                  loadSuggestions(campaignId, form.name);
                }}
                required
              >
                <option value="">Select campaign</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.slug})
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="lp1"
                />
              </div>
              <div>
                <Label>Root domain</Label>
                <Input
                  value={form.rootDomain}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      rootDomain: e.target.value,
                      publicUrl: e.target.value ? `https://${e.target.value}/` : form.publicUrl,
                    })
                  }
                  placeholder="nexoquote.com"
                />
              </div>
            </div>
            <div>
              <Label>Public URL</Label>
              <Input
                value={form.publicUrl}
                onChange={(e) => setForm({ ...form, publicUrl: e.target.value })}
                placeholder="https://nexoquote.com/"
                required
              />
            </div>
            <Button type="submit" disabled={creating}>
              {creating ? 'Creating…' : 'Create & open'}
            </Button>
          </form>
        </Card>
      )}

      <DataTable>
        <table className="w-full text-sm">
          <TableHead>
            <Th>Name</Th>
            <Th>Slug</Th>
            <Th>Campaign</Th>
            <Th>URL</Th>
            <Th>Files</Th>
            <Th>Status</Th>
            <Th />
          </TableHead>
          <tbody>
            {landers.map((l) => (
              <tr key={l.id} className={tableRowClass}>
                <Td className="font-medium">{l.name}</Td>
                <Td className="font-mono text-xs">{l.slug}</Td>
                <Td>{l.campaign.name}</Td>
                <Td className="max-w-[180px] truncate text-xs">{l.publicUrl}</Td>
                <Td>{l.fileCount}</Td>
                <Td>
                  <Badge tone={l.status === 'ready' ? 'success' : 'neutral'}>{l.status}</Badge>
                </Td>
                <Td className="text-right space-x-2">
                  <Link href={`/landers/${l.id}`} className={`${linkClass} text-xs font-medium`}>
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="text-red-500 dark:text-red-400 text-xs"
                    onClick={() => handleDelete(l)}
                  >
                    Delete
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
        {landers.length === 0 && (
          <EmptyState
            title="No landers yet"
            description="Create a lander, upload your HTML/CSS/JS, and download a deploy bundle."
          />
        )}
      </DataTable>
    </div>
  );
}
