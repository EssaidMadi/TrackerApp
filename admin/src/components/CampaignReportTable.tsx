'use client';

import { useMemo, useState } from 'react';
import { Badge, DataTable, TableHead, Td, Th } from '@/components/ui';
import type { CampaignReportRow } from '@/lib/api';

function fmtMoney(n: number) {
  return `€${n.toFixed(4)}`;
}

type SortKey = keyof CampaignReportRow | string;

export function CampaignReportTable({
  rows,
  eventColumns,
}: {
  rows: CampaignReportRow[];
  eventColumns: { slug: string; displayLabel: string }[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>('visits');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av =
        sortKey in a
          ? (a as unknown as Record<string, unknown>)[sortKey as string]
          : a.revenueByEvent[sortKey as string] || 0;
      const bv =
        sortKey in b
          ? (b as unknown as Record<string, unknown>)[sortKey as string]
          : b.revenueByEvent[sortKey as string] || 0;
      const na = typeof av === 'number' ? av : String(av);
      const nb = typeof bv === 'number' ? bv : String(bv);
      if (na < nb) return sortDir === 'asc' ? -1 : 1;
      if (na > nb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const th = (key: SortKey, label: string) => (
    <Th>
      <button type="button" className="hover:text-zinc-900" onClick={() => toggleSort(key)}>
        {label}
        {sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
      </button>
    </Th>
  );

  return (
    <DataTable>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[1200px]">
          <TableHead>
            {th('campaignName', 'Campaign name')}
            {th('marker', 'Marker')}
            {th('cpc', 'CPC')}
            {th('visits', 'Visits')}
            {th('uniqueVisits', 'Unique visits')}
            <Th>Suspicious</Th>
            {th('conversions', 'Conversions')}
            {th('cost', 'Cost')}
            {th('revenue', 'Revenue')}
            {th('profit', 'Profit')}
            {th('epv', 'EPV')}
            {th('cpv', 'CPV')}
            {th('ecpc', 'eCPC')}
            {eventColumns.map((c) => (
              <Th key={c.slug}>
                <button type="button" onClick={() => toggleSort(c.slug)}>
                  {c.displayLabel}
                </button>
              </Th>
            ))}
          </TableHead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.campaignId} className="border-b border-zinc-50 hover:bg-zinc-50/50">
                <Td className="font-medium max-w-[200px] truncate">{row.campaignName}</Td>
                <Td className="text-zinc-500">{row.marker}</Td>
                <Td className="font-mono">{fmtMoney(row.cpc)}</Td>
                <Td>{row.visits}</Td>
                <Td>{row.uniqueVisits}</Td>
                <Td>
                  {parseFloat(row.suspiciousPct) === 0 ? (
                    <Badge tone="success">Clean</Badge>
                  ) : (
                    <Badge tone="danger">{row.suspiciousPct}%</Badge>
                  )}
                </Td>
                <Td>{row.conversions}</Td>
                <Td className="font-mono">{fmtMoney(row.cost)}</Td>
                <Td className="font-mono">{fmtMoney(row.revenue)}</Td>
                <Td className={`font-mono ${row.profit < 0 ? 'text-red-600' : 'text-green-700'}`}>
                  {fmtMoney(row.profit)}
                </Td>
                <Td className="font-mono">{fmtMoney(row.epv)}</Td>
                <Td className="font-mono">{fmtMoney(row.cpv)}</Td>
                <Td className="font-mono">{fmtMoney(row.ecpc)}</Td>
                {eventColumns.map((c) => (
                  <Td key={c.slug} className="font-mono">
                    {fmtMoney(row.revenueByEvent[c.slug] || 0)}
                  </Td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DataTable>
  );
}
