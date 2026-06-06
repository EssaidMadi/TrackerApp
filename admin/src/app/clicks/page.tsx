'use client';

import { Fragment, useEffect, useState } from 'react';
import {
  Badge,
  DataTable,
  EmptyState,
  FilterBar,
  Input,
  Loading,
  PageHeader,
  Select,
  TableHead,
  Td,
  Th,
} from '@/components/ui';
import { trackerApi, type Click, type Campaign } from '@/lib/api';

export default function ClicksPage() {
  const [clicks, setClicks] = useState<Click[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    campaignId: '',
    publisher: '',
    platform: '',
    country: '',
    isBot: '',
  });

  const load = () => {
    const params: Record<string, string> = { limit: '100' };
    if (filters.campaignId) params.campaignId = filters.campaignId;
    if (filters.publisher) params.publisher = filters.publisher;
    if (filters.platform) params.platform = filters.platform;
    if (filters.country) params.country = filters.country;
    if (filters.isBot) params.isBot = filters.isBot;

    trackerApi
      .getClicks(params)
      .then((res) => {
        setClicks(res.items);
        setTotal(res.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    trackerApi.getCampaigns().then(setCampaigns).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    load();
  }, [filters]);

  return (
    <div>
      <PageHeader
        title={`Clicks`}
        description="Full visit intelligence — IP, device, UA, ISP, bot score. Click a row for details."
        meta={<Badge tone="neutral">{total}</Badge>}
      />

      <FilterBar>
        <Select
          className="w-auto min-w-[160px]"
          value={filters.campaignId}
          onChange={(e) => setFilters({ ...filters, campaignId: e.target.value })}
        >
          <option value="">All campaigns</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Input
          className="w-36"
          placeholder="Publisher"
          value={filters.publisher}
          onChange={(e) => setFilters({ ...filters, publisher: e.target.value })}
        />
        <Input
          className="w-32"
          placeholder="Platform"
          value={filters.platform}
          onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
        />
        <Input
          className="w-28"
          placeholder="Country"
          value={filters.country}
          onChange={(e) => setFilters({ ...filters, country: e.target.value })}
        />
        <Select
          className="w-auto"
          value={filters.isBot}
          onChange={(e) => setFilters({ ...filters, isBot: e.target.value })}
        >
          <option value="">All traffic</option>
          <option value="false">Humans only</option>
          <option value="true">Bots only</option>
        </Select>
      </FilterBar>

      {loading ? (
        <Loading />
      ) : (
        <DataTable>
          <table className="w-full text-xs">
            <TableHead>
              <Th>Bot</Th>
              <Th>Conv</Th>
              <Th>Click ID</Th>
              <Th>Publisher</Th>
              <Th>Device</Th>
              <Th>Country</Th>
              <Th>IP</Th>
              <Th>Date</Th>
            </TableHead>
            <tbody>
              {clicks.map((c) => {
                const isExpanded = expanded === c.id;
                return (
                  <Fragment key={c.id}>
                    <tr
                      className="border-b border-zinc-50 hover:bg-zinc-50/50 cursor-pointer"
                      onClick={() => setExpanded(isExpanded ? null : c.id)}
                    >
                      <Td>
                        {c.isBot ? (
                          <Badge tone="danger">Bot {c.botScore}</Badge>
                        ) : (
                          <Badge tone="success">Human</Badge>
                        )}
                      </Td>
                      <Td>
                        {c.converted ? (
                          <Badge tone="success">Yes</Badge>
                        ) : (
                          <span className="text-zinc-300">No</span>
                        )}
                      </Td>
                      <Td className="font-mono">{c.clickId}</Td>
                      <Td className="max-w-[120px] truncate">{c.publisherName || '—'}</Td>
                      <Td>{c.device || '—'}</Td>
                      <Td>{c.countryCode || '—'}</Td>
                      <Td className="font-mono">
                        {c.ipAddress || '—'}
                        {c.isLocalIp && <span className="ml-1 text-amber-600">(local)</span>}
                      </Td>
                      <Td className="text-zinc-400 whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleString()}
                      </Td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-zinc-50/80 border-b border-zinc-100">
                        <td colSpan={8} className="px-5 py-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            {(c.reportFields?.length
                              ? c.reportFields.map((f) => (
                                  <Detail key={f.label} label={f.label} value={f.value} />
                                ))
                              : [
                                  <Detail key="tid" label="Tracking ID" value={c.trackingId} />,
                                  <Detail key="pub" label="Publisher" value={c.publisherName} />,
                                  <Detail key="ad" label="Ad ID" value={c.adId} />,
                                  <Detail key="plat" label="Platform" value={c.platform} />,
                                ])}
                            <Detail label="OS / Model" value={`${c.os || '—'} / ${c.model || c.brand || '—'}`} />
                            <Detail label="Browser" value={c.browserVersion || c.browser} />
                            <Detail label="City" value={c.city} />
                            <Detail label="ISP" value={c.isp} />
                            <Detail label="Bot reasons" value={(c.botReasons || []).join(', ')} />
                            <div className="col-span-full">
                              <span className="text-zinc-400">UA: </span>
                              <span className="text-zinc-700 break-all">{c.userAgent || '—'}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          {clicks.length === 0 && (
            <EmptyState title="No clicks recorded" description="Traffic will appear here after your first visit." />
          )}
        </DataTable>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-zinc-400">{label}: </span>
      <span className="text-zinc-800">{value || '—'}</span>
    </div>
  );
}
