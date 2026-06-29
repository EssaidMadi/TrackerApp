'use client';

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
  TableHead,
  Td,
  Th,
  mutedTextClass,
  sectionHeadingClass,
  tableRowClass,
  statusTone,
} from '@/components/ui';
import { trackerApi, formatApiError, type DnsRecord, type TrackingDomain } from '@/lib/api';

export default function DomainsPage() {
  const toast = useToast();
  const [domains, setDomains] = useState<TrackingDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ label: '', rootDomain: '', subdomain: 'track' });

  const load = () => {
    trackerApi
      .getDomains()
      .then((data) => {
        setDomains(data);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await trackerApi.createDomain(form);
      setShowForm(false);
      setForm({ label: '', rootDomain: '', subdomain: 'track' });
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const handleVerify = async (id: string) => {
    setVerifyingId(id);
    try {
      const res = await trackerApi.verifyDomain(id);
      const msg =
        (res.check as { message?: string }).message ||
        (res.domain.status === 'verified' ? 'DNS verified!' : 'DNS not verified yet');
      toast.info(msg);
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDelete = async (d: TrackingDomain) => {
    if (!window.confirm(`Delete ${d.hostname}?`)) return;
    try {
      await trackerApi.deleteDomain(d.id);
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Tracking Domains"
        description="Custom subdomains for click URLs. Use CNAME track → root domain when sharing the same server."
        action={
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add domain'}
          </Button>
        }
      />

      {error && (
        <div className="mb-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      {showForm && (
        <Card className="mb-8 max-w-lg">
          <form onSubmit={handleCreate} className="grid gap-4">
            <div>
              <Label>Label</Label>
              <Input
                placeholder="auto-coverage"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Root domain</Label>
              <Input
                placeholder="auto-coverage.org"
                value={form.rootDomain}
                onChange={(e) => setForm({ ...form, rootDomain: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Subdomain</Label>
              <Input
                className="font-mono"
                value={form.subdomain}
                onChange={(e) => setForm({ ...form, subdomain: e.target.value })}
              />
              <p className={`text-xs ${mutedTextClass} mt-1.5`}>
                → https://{form.subdomain || 'track'}.{form.rootDomain || 'domain.com'}
              </p>
            </div>
            <Button type="submit" variant="success" className="w-fit">
              Generate DNS records
            </Button>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {domains.map((d) => {
          const isOpen = expanded === d.id;
          const records = (d.dnsRecords || []) as DnsRecord[];
          return (
            <Card key={d.id} padding={false}>
              <div
                className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40"
                onClick={() => setExpanded(isOpen ? null : d.id)}
              >
                <div>
                  <p className={`font-medium ${sectionHeadingClass}`}>{d.label}</p>
                  <p className={`text-sm font-mono ${mutedTextClass} mt-0.5`}>{d.hostname}</p>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Badge tone={statusTone(d.status)}>{d.status}</Badge>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      await trackerApi.refreshDomainDns(d.id);
                      load();
                    }}
                  >
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleVerify(d.id)}
                    disabled={verifyingId === d.id}
                  >
                    {verifyingId === d.id ? 'Checking...' : 'Verify DNS'}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(d)}>
                    Delete
                  </Button>
                </div>
              </div>

              {isOpen && (
                <div className="px-5 pb-5 border-t border-zinc-100 dark:border-zinc-800">
                  <p className={`text-xs font-medium ${mutedTextClass} uppercase tracking-wide mt-4 mb-3`}>
                    GoDaddy DNS records
                  </p>
                  <DataTable>
                    <table className="w-full text-xs">
                      <TableHead>
                        <Th>Type</Th>
                        <Th>Name</Th>
                        <Th>Value</Th>
                        <Th>Purpose</Th>
                      </TableHead>
                      <tbody>
                        {records.map((r, i) => (
                          <tr key={i} className={tableRowClass}>
                            <Td className="font-mono">{r.type}</Td>
                            <Td className="font-mono">{r.host}</Td>
                            <Td className="font-mono break-all max-w-xs">{r.value}</Td>
                            <Td className={mutedTextClass}>{r.purpose}</Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </DataTable>
                  {d.lastCheckError && d.status !== 'verified' && (
                    <div className="mt-3">
                      <Alert tone="error">Last check: {d.lastCheckError}</Alert>
                    </div>
                  )}
                  {d.status === 'verified' && (
                    <div className="mt-3">
                      <Alert tone="success">Ready — select this domain when creating a campaign.</Alert>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
        {domains.length === 0 && (
          <Card>
            <EmptyState
              title="No domains yet"
              description="Add track.yourbrand.com to get started."
            />
          </Card>
        )}
      </div>
    </div>
  );
}
