'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  Loading,
  PageHeader,
  TableHead,
  Td,
  Th,
} from '@/components/ui';
import { trackerApi, type TrafficSourceProfile } from '@/lib/api';

export default function TrafficSourcesPage() {
  const [profiles, setProfiles] = useState<TrafficSourceProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackerApi
      .getTrafficSources(true)
      .then(setProfiles)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Traffic Sources"
        description="Per-platform URL templates, param mappings, and conversion methods. Campaigns inherit these settings."
        action={
          <Link href="/traffic-sources/new">
            <Button>Add custom source</Button>
          </Link>
        }
      />

      {loading ? (
        <Loading />
      ) : (
        <DataTable>
          <table className="w-full text-sm">
            <TableHead>
              <Th>Name</Th>
              <Th>Mode</Th>
              <Th>Conversion</Th>
              <Th>Campaigns</Th>
              <Th>Status</Th>
              <Th></Th>
            </TableHead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-b border-zinc-50 hover:bg-zinc-50/50">
                  <Td>
                    <div className="font-medium text-zinc-900">{p.name}</div>
                    <div className="text-xs text-zinc-400 font-mono">{p.slug}</div>
                  </Td>
                  <Td className="capitalize">{p.trackingModeDefault}</Td>
                  <Td>
                    <Badge tone="neutral">{p.conversionMethod.replace(/_/g, ' ')}</Badge>
                  </Td>
                  <Td>{p._count?.campaigns ?? 0}</Td>
                  <Td>
                    {p.active ? (
                      <Badge tone="success">Active</Badge>
                    ) : (
                      <Badge tone="warning">Inactive</Badge>
                    )}
                    {p.isSystem && <span className="ml-1"><Badge tone="neutral">System</Badge></span>}
                  </Td>
                  <Td>
                    <Link
                      href={`/traffic-sources/${p.id}`}
                      className="text-indigo-600 hover:underline text-xs"
                    >
                      Edit
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
          {profiles.length === 0 && (
            <EmptyState title="No traffic sources" description="System profiles seed on server start." />
          )}
        </DataTable>
      )}
    </div>
  );
}
