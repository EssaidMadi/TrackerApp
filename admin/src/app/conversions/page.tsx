'use client';

import { Fragment, useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
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
  statusTone,
} from '@/components/ui';
import { trackerApi, type Conversion } from '@/lib/api';

export default function ConversionsPage() {
  const toast = useToast();
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = () => {
    trackerApi
      .getConversions({ limit: '100' })
      .then((res) => {
        setConversions(res.items);
        setTotal(res.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleRetry = async (id: string) => {
    try {
      await trackerApi.retryConversion(id);
      load();
    } catch (err) {
      toast.error(String(err));
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Conversions"
        description="Voluum-style export with full visit + conversion data."
        meta={<Badge tone="neutral">{total}</Badge>}
        action={
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                const csv = await trackerApi.exportConversionsCsv();
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `conversions-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              } catch (err) {
                toast.error(String(err));
              }
            }}
          >
            Export CSV
          </Button>
        }
      />

      <DataTable>
        <table className="w-full text-xs">
          <TableHead>
            <Th>Visit</Th>
            <Th>Converted</Th>
            <Th>Click ID</Th>
            <Th>Publisher</Th>
            <Th>Country</Th>
            <Th>Event</Th>
            <Th>Revenue</Th>
            <Th>Status</Th>
            <Th></Th>
          </TableHead>
          <tbody>
            {conversions.map((c) => {
              const click = c.click;
              const isExpanded = expanded === c.id;
              return (
                <Fragment key={c.id}>
                  <tr
                    className="border-b border-zinc-50 hover:bg-zinc-50/50 cursor-pointer"
                    onClick={() => setExpanded(isExpanded ? null : c.id)}
                  >
                    <Td className="text-zinc-400 whitespace-nowrap">
                      {click ? new Date(click.createdAt).toLocaleString() : '—'}
                    </Td>
                    <Td className="text-zinc-400 whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleString()}
                    </Td>
                    <Td className="font-mono">{c.clickId}</Td>
                    <Td className="max-w-[100px] truncate">{click?.publisherName || '—'}</Td>
                    <Td>{click?.countryCode || '—'}</Td>
                    <Td>{c.eventType}</Td>
                    <Td className="tabular-nums">{c.revenue}</Td>
                    <Td>
                      <Badge tone={statusTone(c.status)}>{c.status}</Badge>
                    </Td>
                    <Td>
                      {c.status === 'failed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRetry(c.id);
                          }}
                          className="text-indigo-600 hover:underline text-xs font-medium"
                        >
                          Retry
                        </button>
                      )}
                    </Td>
                  </tr>
                  {isExpanded && click && (
                    <tr className="bg-zinc-50/80 border-b border-zinc-100">
                      <td colSpan={9} className="px-5 py-4">
                        <div className="grid grid-cols-4 gap-3 text-xs">
                          {(click.reportFields?.length
                            ? click.reportFields.map((f) => (
                                <Detail key={f.label} label={f.label} value={f.value} />
                              ))
                            : [
                                <Detail key="ad" label="Ad ID" value={click.adId} />,
                                <Detail key="plat" label="Platform" value={click.platform} />,
                                <Detail key="pub" label="Publisher" value={click.publisherName} />,
                              ])}
                          <Detail label="Browser" value={click.browserVersion || click.browser} />
                          <Detail label="Region" value={click.region} />
                          <Detail label="Referrer" value={click.referrer} />
                          <Detail label="Transaction ID" value={c.transactionId} />
                          <Detail label="ISP" value={click.isp} />
                          <Detail label="Mobile Carrier" value={click.mobileCarrier} />
                          <Detail label="Connection" value={click.connectionType} />
                          <Detail
                            label="Bot"
                            value={
                              click.isBot
                                ? `Yes (score ${click.botScore})`
                                : `No (score ${click.botScore ?? 0})`
                            }
                          />
                          <Detail label="Proxy / Datacenter" value={`${click.isProxy ? 'proxy' : '-'} / ${click.isHosting ? 'hosting' : '-'}`} />
                          <Detail label="Accept-Language" value={click.acceptLanguage} />
                          <Detail label="Lander" value={click.landerName} />
                          <Detail label="Offer" value={click.offerName} />
                          <Detail label="Traffic Source" value={click.trafficSourceName} />
                          <Detail label="Affiliate Network" value={click.affiliateNetwork} />
                          <Detail label="CV1 (Ad ID)" value={click.customVariable1} />
                          <Detail label="CV2" value={click.customVariable2} />
                          <Detail label="CV3 (Publisher)" value={click.customVariable3} />
                          <Detail label="CV4 (Ad Title)" value={click.customVariable4} />
                          <Detail label="CV5" value={click.customVariable5} />
                          <Detail label="CV6 (Site)" value={click.customVariable6} />
                          <Detail label="CV7 (Platform)" value={click.customVariable7} />
                          <Detail label="CV8 (Asset)" value={click.customVariable8} />
                          <div className="col-span-4">
                            <span className="text-gray-400">User Agent: </span>
                            <span className="text-gray-800 break-all">{click.userAgent || '-'}</span>
                          </div>
                          <div className="col-span-4 space-y-2">
                            <span className="text-gray-500 font-medium">Outbound postbacks sent:</span>
                            {c.postbackLogs.length === 0 ? (
                              <span className="text-zinc-400">None (skipped or pending)</span>
                            ) : (
                              c.postbackLogs.map((log) => (
                                <div
                                  key={log.id}
                                  className="border border-zinc-200 rounded p-2 bg-white"
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge tone={log.success ? 'success' : 'danger'}>
                                      {log.network} HTTP {log.httpStatus || '?'}
                                    </Badge>
                                    <span className="text-zinc-400">{log.method}</span>
                                  </div>
                                  <div className="font-mono text-[10px] break-all text-zinc-700">
                                    {log.url || '(no url)'}
                                  </div>
                                  {log.response && (
                                    <div className="text-[10px] text-zinc-500 mt-1 break-all">
                                      Response: {log.response.slice(0, 300)}
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
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
        {conversions.length === 0 && (
          <EmptyState
            title="No conversions yet"
            description="Fire one with the Click ID from an incoming visit."
          />
        )}
      </DataTable>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-gray-400">{label}: </span>
      <span className="text-gray-800">{value || '-'}</span>
    </div>
  );
}
