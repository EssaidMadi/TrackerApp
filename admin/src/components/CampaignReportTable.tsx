'use client';

import { useMemo, useState } from 'react';
import { Badge, DataTable, TableHead, Td, Th } from '@/components/ui';
import type { CampaignReportRow, EventColumnDef } from '@/lib/api';
import {
  eventCountColumnId,
  eventRevenueColumnId,
  type OverviewColumnId,
} from '@/lib/overview-columns';

function fmtMoney(n: number) {
  return `€${n.toFixed(4)}`;
}

function fmtPct(n: number) {
  return `${n.toFixed(2)}%`;
}

type SortKey = OverviewColumnId;

function getSortValue(row: CampaignReportRow, key: SortKey): number | string {
  if (key.startsWith('event:')) {
    const [, slug, kind] = key.split(':');
    if (kind === 'count') return row.countByEvent[slug] || 0;
    return row.revenueByEvent[slug] || 0;
  }
  if (key === 'suspiciousVisits') return parseFloat(row.suspiciousPct);
  const v = (row as unknown as Record<string, unknown>)[key];
  if (typeof v === 'number') return v;
  return String(v ?? '');
}

export function CampaignReportTable({
  rows,
  eventColumns,
  visibleColumns,
}: {
  rows: CampaignReportRow[];
  eventColumns: EventColumnDef[];
  visibleColumns: Set<OverviewColumnId>;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('visits');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const visible = (id: OverviewColumnId) => visibleColumns.has(id);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = getSortValue(a, sortKey);
      const bv = getSortValue(b, sortKey);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
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
      <button type="button" className="hover:text-zinc-900 whitespace-nowrap" onClick={() => toggleSort(key)}>
        {label}
        {sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
      </button>
    </Th>
  );

  const eventColBySlug = useMemo(() => {
    const map = new Map<string, EventColumnDef>();
    for (const c of eventColumns) map.set(c.slug, c);
    return map;
  }, [eventColumns]);

  const visibleEventSlugs = useMemo(() => {
    const slugs = new Set<string>();
    for (const id of visibleColumns) {
      if (id.startsWith('event:')) {
        const [, slug] = id.split(':');
        slugs.add(slug);
      }
    }
    return [...slugs].sort((a, b) => {
      const ai = eventColumns.findIndex((c) => c.slug === a);
      const bi = eventColumns.findIndex((c) => c.slug === b);
      return ai - bi;
    });
  }, [visibleColumns, eventColumns]);

  if (visibleColumns.size === 0) {
    return (
      <DataTable>
        <p className="text-sm text-zinc-500 p-4">No columns selected. Use the Columns button to choose metrics.</p>
      </DataTable>
    );
  }

  return (
    <DataTable>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[800px]">
          <TableHead>
            {visible('campaignName') && th('campaignName', 'Campaign name')}
            {visible('cpc') && th('cpc', 'CPC')}
            {visible('visits') && th('visits', 'Visits')}
            {visible('uniqueVisits') && th('uniqueVisits', 'Unique visits')}
            {visible('suspiciousVisits') && <Th>Suspicious visits</Th>}
            {visible('conversions') && th('conversions', 'Conversions')}
            {visible('cost') && th('cost', 'Cost')}
            {visible('revenue') && th('revenue', 'Revenue')}
            {visible('profit') && th('profit', 'Profit')}
            {visible('roi') && th('roi', 'ROI')}
            {visible('cv') && th('cv', 'CV')}
            {visible('epv') && th('epv', 'EPV')}
            {visible('cpv') && th('cpv', 'CPV')}
            {visible('errors') && th('errors', 'Errors')}
            {visible('ecpc') && th('ecpc', 'eCPC')}
            {visible('txTransfo') && th('txTransfo', 'Tx Transfo')}
            {visibleEventSlugs.flatMap((slug) => {
              const col = eventColBySlug.get(slug);
              if (!col) return [];
              const headers = [];
              if (visible(eventCountColumnId(slug))) {
                headers.push(
                  <Th key={`${slug}-count`}>
                    <button type="button" onClick={() => toggleSort(eventCountColumnId(slug))}>
                      {col.countLabel}
                      {sortKey === eventCountColumnId(slug) ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                    </button>
                  </Th>,
                );
              }
              if (visible(eventRevenueColumnId(slug))) {
                headers.push(
                  <Th key={`${slug}-revenue`}>
                    <button type="button" onClick={() => toggleSort(eventRevenueColumnId(slug))}>
                      {col.revenueLabel}
                      {sortKey === eventRevenueColumnId(slug) ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                    </button>
                  </Th>,
                );
              }
              return headers;
            })}
          </TableHead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.campaignId} className="border-b border-zinc-50 hover:bg-zinc-50/50">
                {visible('campaignName') && (
                  <Td className="font-medium max-w-[200px] truncate">{row.campaignName}</Td>
                )}
                {visible('cpc') && <Td className="font-mono">{fmtMoney(row.cpc)}</Td>}
                {visible('visits') && <Td>{row.visits}</Td>}
                {visible('uniqueVisits') && <Td>{row.uniqueVisits}</Td>}
                {visible('suspiciousVisits') && (
                  <Td>
                    <div className="flex items-center gap-2">
                      <span>{row.suspiciousVisits}</span>
                      {parseFloat(row.suspiciousPct) === 0 ? (
                        <Badge tone="success">Clean</Badge>
                      ) : (
                        <Badge tone="danger">{row.suspiciousPct}%</Badge>
                      )}
                    </div>
                  </Td>
                )}
                {visible('conversions') && <Td>{row.conversions}</Td>}
                {visible('cost') && <Td className="font-mono">{fmtMoney(row.cost)}</Td>}
                {visible('revenue') && <Td className="font-mono">{fmtMoney(row.revenue)}</Td>}
                {visible('profit') && (
                  <Td className={`font-mono ${row.profit < 0 ? 'text-red-600' : 'text-green-700'}`}>
                    {fmtMoney(row.profit)}
                  </Td>
                )}
                {visible('roi') && (
                  <Td className={`font-mono ${row.roi < 0 ? 'text-red-600' : 'text-green-700'}`}>
                    {fmtPct(row.roi)}
                  </Td>
                )}
                {visible('cv') && <Td className="font-mono">{fmtPct(row.cv)}</Td>}
                {visible('epv') && <Td className="font-mono">{fmtMoney(row.epv)}</Td>}
                {visible('cpv') && <Td className="font-mono">{fmtMoney(row.cpv)}</Td>}
                {visible('errors') && <Td>{row.errors}</Td>}
                {visible('ecpc') && <Td className="font-mono">{fmtMoney(row.ecpc)}</Td>}
                {visible('txTransfo') && <Td className="font-mono">{fmtPct(row.txTransfo)}</Td>}
                {visibleEventSlugs.flatMap((slug) => {
                  const cells = [];
                  if (visible(eventCountColumnId(slug))) {
                    cells.push(
                      <Td key={`${slug}-count`}>{row.countByEvent[slug] || 0}</Td>,
                    );
                  }
                  if (visible(eventRevenueColumnId(slug))) {
                    cells.push(
                      <Td key={`${slug}-revenue`} className="font-mono">
                        {fmtMoney(row.revenueByEvent[slug] || 0)}
                      </Td>,
                    );
                  }
                  return cells;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DataTable>
  );
}
