'use client';

import { Badge, DataTable, TableHead, Td, Th, bodyTextClass, mutedTextClass, tableRowClass } from '@/components/ui';
import type { FunnelPostbackRow } from '@/lib/api';

export function FunnelPostbackFeed({ rows }: { rows: FunnelPostbackRow[] }) {
  if (rows.length === 0) {
    return (
      <p className={`text-sm ${mutedTextClass} py-8 text-center`}>
        No outbound postbacks in this period. Events fire when conversions are recorded and Mediago S2S is enabled.
      </p>
    );
  }

  return (
    <DataTable>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <TableHead>
            <Th>Time</Th>
            <Th>Step</Th>
            <Th>Click ID</Th>
            <Th>Campaign</Th>
            <Th>Network</Th>
            <Th>Status</Th>
            <Th>URL</Th>
          </TableHead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={tableRowClass}>
                <Td className={`whitespace-nowrap ${mutedTextClass}`}>
                  {new Date(row.createdAt).toLocaleString()}
                </Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">{row.stepLabel}</span>
                    {row.mediagoCode != null && (
                      <span className={`text-[10px] ${mutedTextClass} font-mono`}>({row.mediagoCode})</span>
                    )}
                  </div>
                  <span className={`text-[10px] ${mutedTextClass} font-mono`}>{row.eventType}</span>
                </Td>
                <Td className="font-mono">{row.clickId}</Td>
                <Td className="max-w-[120px] truncate">{row.campaignName}</Td>
                <Td className="capitalize">{row.network}</Td>
                <Td>
                  <Badge tone={row.success ? 'success' : 'danger'}>
                    {row.success ? `HTTP ${row.httpStatus}` : 'Failed'}
                  </Badge>
                </Td>
                <Td className="max-w-[280px]">
                  <div className={`font-mono text-[10px] break-all ${bodyTextClass} line-clamp-2`} title={row.url}>
                    {row.url}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DataTable>
  );
}
