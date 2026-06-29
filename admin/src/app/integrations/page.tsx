'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import {
  Alert,
  Button,
  Card,
  Input,
  Label,
  Loading,
  PageHeader,
  Select,
  Textarea,
  inlineCodeClass,
  linkClass,
  mutedTextClass,
  sectionHeadingClass,
} from '@/components/ui';
import {
  trackerApi,
  formatApiError,
  type Campaign,
  type CampaignPlatformMapping,
  type PlatformConnection,
} from '@/lib/api';

const PLATFORMS = [
  'mediago',
  'facebook',
  'google',
  'outbrain',
  'taboola',
  'mgid',
  'bing',
  'powerspace',
  'organic',
  'native',
];

const MEDIAGO_TIMEZONES = [
  { value: 'utc0', label: 'UTC' },
  { value: 'utc8', label: 'UTC+8' },
  { value: 'est', label: 'US Eastern' },
];

export default function IntegrationsPage() {
  const toast = useToast();
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [mappings, setMappings] = useState<CampaignPlatformMapping[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const [connForm, setConnForm] = useState({
    platform: 'mediago',
    label: '',
    accountId: '',
    credentialsJson: '{}',
  });

  const [mediagoForm, setMediagoForm] = useState({
    label: '',
    apiTokenBase64: '',
    apiTokenRaw: '',
    accountId: '',
    accountName: '',
    timezone: 'utc0',
  });

  const [mediagoAccounts, setMediagoAccounts] = useState<
    { accountId: string; accountName: string }[]
  >([]);
  const [mediagoCampaigns, setMediagoCampaigns] = useState<
    { campaignId: string; campaignName: string }[]
  >([]);

  const [mapForm, setMapForm] = useState({
    campaignId: '',
    platform: 'mediago',
    externalCampaignId: '',
  });

  const [manualForm, setManualForm] = useState({
    campaignId: '',
    platform: 'mediago',
    date: new Date().toISOString().slice(0, 10),
    impressions: '0',
    clicks: '0',
    spend: '0',
  });

  const [csvText, setCsvText] = useState(
    'date,campaign_slug,impressions,clicks,spend,platform\n2026-06-06,my-campaign,1000,50,25.5,mediago',
  );

  const load = () => {
    Promise.all([
      trackerApi.getPlatformConnections(),
      trackerApi.getCampaignMappings(),
      trackerApi.getCampaigns(),
    ])
      .then(([c, m, camps]) => {
        setConnections(c);
        setMappings(m);
        setCampaigns(camps);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addConnection = async () => {
    try {
      if (connForm.platform === 'mediago') {
        if (!mediagoForm.label.trim()) {
          toast.error('Label is required');
          return;
        }
        if (!mediagoForm.apiTokenBase64.trim() && !mediagoForm.apiTokenRaw.trim()) {
          toast.error('Paste your Mediago Base64 or raw API token');
          return;
        }
        await trackerApi.createPlatformConnection({
          platform: 'mediago',
          label: mediagoForm.label.trim(),
          accountId: mediagoForm.accountId || undefined,
          credentials: {
            ...(mediagoForm.apiTokenBase64.trim()
              ? { apiTokenBase64: mediagoForm.apiTokenBase64.trim() }
              : {}),
            ...(mediagoForm.apiTokenRaw.trim()
              ? { apiToken: mediagoForm.apiTokenRaw.trim() }
              : {}),
            ...(mediagoForm.accountName.trim()
              ? { accountName: mediagoForm.accountName.trim() }
              : {}),
            timezone: mediagoForm.timezone,
          },
        });
        setMediagoForm({
          label: '',
          apiTokenBase64: '',
          apiTokenRaw: '',
          accountId: '',
          accountName: '',
          timezone: 'utc0',
        });
      } else {
        let credentials = {};
        try {
          credentials = JSON.parse(connForm.credentialsJson);
        } catch {
          toast.error('Invalid credentials JSON');
          return;
        }
        await trackerApi.createPlatformConnection({
          platform: connForm.platform,
          label: connForm.label,
          accountId: connForm.accountId || undefined,
          credentials,
        });
        setConnForm({ platform: 'mediago', label: '', accountId: '', credentialsJson: '{}' });
      }
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const testMediagoBeforeSave = async () => {
    if (!mediagoForm.apiTokenBase64.trim() && !mediagoForm.apiTokenRaw.trim()) {
      toast.error('Paste a token first');
      return;
    }
    toast.info(
      'Save the connection first, then click Test on the connection row to load Mediago accounts.',
    );
  };

  const loadMediagoCampaigns = async (connectionId: string) => {
    try {
      const list = await trackerApi.getMediagoCampaigns(connectionId);
      setMediagoCampaigns(list);
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const addMapping = async () => {
    try {
      await trackerApi.createCampaignMapping(mapForm);
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const syncAll = async () => {
    setSyncing(true);
    try {
      const res = await trackerApi.syncAllPlatforms();
      toast.success(`Synced ${res.synced} spend rows`);
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSyncing(false);
    }
  };

  const saveManualSpend = async () => {
    try {
      await trackerApi.upsertManualSpend({
        campaignId: manualForm.campaignId,
        platform: manualForm.platform,
        date: manualForm.date,
        impressions: parseInt(manualForm.impressions, 10),
        clicks: parseInt(manualForm.clicks, 10),
        spend: parseFloat(manualForm.spend),
      });
      toast.success('Spend saved');
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const importCsv = async () => {
    try {
      const res = await trackerApi.importSpendCsv(csvText);
      toast.success(`Imported ${res.imported} rows`);
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const isMediago = connForm.platform === 'mediago';

  if (loading) return <Loading />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Integrations"
        description="Connect ad platforms for spend & impressions. Map external campaign IDs to tracker campaigns."
        action={
          <Button onClick={syncAll} disabled={syncing}>
            {syncing ? 'Syncing...' : 'Sync all now'}
          </Button>
        }
      />

      {error && (
        <div className="mb-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <Card className="space-y-4 max-w-2xl">
        <h2 className={sectionHeadingClass}>Add platform connection</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Platform</Label>
            <Select
              value={connForm.platform}
              onChange={(e) => setConnForm({ ...connForm, platform: e.target.value })}
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>
          {!isMediago && (
            <div>
              <Label>Label</Label>
              <Input
                value={connForm.label}
                onChange={(e) => setConnForm({ ...connForm, label: e.target.value })}
                placeholder="Facebook main account"
              />
            </div>
          )}
        </div>

        {isMediago ? (
          <>
            <p className={`text-xs ${mutedTextClass}`}>
              Paste the token from Mediago dashboard. Use the <strong>Base64-encoded</strong> token
              first; raw token is optional fallback.
            </p>
            <div>
              <Label>Connection label</Label>
              <Input
                value={mediagoForm.label}
                onChange={(e) => setMediagoForm({ ...mediagoForm, label: e.target.value })}
                placeholder="Mediago main account"
              />
            </div>
            <div>
              <Label>Base64 API token (recommended)</Label>
              <Input
                type="password"
                autoComplete="off"
                value={mediagoForm.apiTokenBase64}
                onChange={(e) =>
                  setMediagoForm({ ...mediagoForm, apiTokenBase64: e.target.value })
                }
                placeholder="From Mediago: Copy Base64-Encoded Token"
              />
            </div>
            <div>
              <Label>Raw API token (optional)</Label>
              <Input
                type="password"
                autoComplete="off"
                value={mediagoForm.apiTokenRaw}
                onChange={(e) => setMediagoForm({ ...mediagoForm, apiTokenRaw: e.target.value })}
                placeholder="From Mediago: Copy Non-Base64 Token"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mediago account ID (optional)</Label>
                <Input
                  value={mediagoForm.accountId}
                  onChange={(e) => setMediagoForm({ ...mediagoForm, accountId: e.target.value })}
                  placeholder="Filled after Test, or paste from Mediago"
                />
              </div>
              <div>
                <Label>Account name (for postbacks)</Label>
                <Input
                  value={mediagoForm.accountName}
                  onChange={(e) =>
                    setMediagoForm({ ...mediagoForm, accountName: e.target.value })
                  }
                  placeholder="accountname in S2S postback"
                />
              </div>
            </div>
            <div>
              <Label>Report timezone</Label>
              <Select
                value={mediagoForm.timezone}
                onChange={(e) => setMediagoForm({ ...mediagoForm, timezone: e.target.value })}
              >
                {MEDIAGO_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={addConnection}>Add Mediago connection</Button>
              <Button type="button" variant="secondary" onClick={testMediagoBeforeSave}>
                Token help
              </Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <Label>Account ID</Label>
              <Input
                value={connForm.accountId}
                onChange={(e) => setConnForm({ ...connForm, accountId: e.target.value })}
                placeholder="act_123456 / marketer ID"
              />
            </div>
            <div>
              <Label>Credentials (JSON)</Label>
              <Textarea
                rows={4}
                className="font-mono text-xs"
                value={connForm.credentialsJson}
                onChange={(e) => setConnForm({ ...connForm, credentialsJson: e.target.value })}
                placeholder='{"accessToken":"...","adAccountId":"act_..."}'
              />
            </div>
            <Button onClick={addConnection}>Add connection</Button>
          </>
        )}
      </Card>

      <Card>
        <h2 className={`${sectionHeadingClass} mb-3`}>Connections</h2>
        <ul className="space-y-2 text-sm">
          {connections.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 py-2"
            >
              <span>
                <strong>{c.label}</strong> ({c.platform}) — {c.status}
                {c.accountId && (
                  <span className={`${mutedTextClass} ml-2`}>account {c.accountId}</span>
                )}
                {c.lastSyncAt && (
                  <span className={`${mutedTextClass} ml-2`}>
                    last sync {new Date(c.lastSyncAt).toLocaleString()}
                  </span>
                )}
                {c.lastError && (
                  <span className="text-red-500 dark:text-red-400 ml-2 block text-xs">{c.lastError}</span>
                )}
              </span>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    const r = await trackerApi.testPlatformConnection(c.id);
                    if (r.accounts?.length) {
                      setMediagoAccounts(r.accounts);
                      toast.info(
                        `${r.message || (r.ok ? 'OK' : 'Failed')}\n\n${r.accounts
                          .map((a) => `${a.accountName} (${a.accountId})`)
                          .join('\n')}`,
                      );
                    } else {
                      toast.info(r.message || (r.ok ? 'OK' : 'Failed'));
                    }
                  }}
                >
                  Test
                </Button>
                {c.platform === 'mediago' && (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => loadMediagoCampaigns(c.id)}
                    >
                      Load campaigns
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        const r = await trackerApi.autoMapMediagoCampaigns(c.id);
                        if (r.total === 0) {
                          toast.info(
                            'Mediago returned 0 campaigns. Try Sync (uses spend report) or map manually — e.g. nexoquote → 5208604.',
                          );
                        } else {
                          toast.success(
                            `Found ${r.total} Mediago campaign(s). New mappings: ${r.mapped}. Already mapped: ${r.alreadyMapped ?? 0}. No name match: ${r.unmatched ?? 0}`,
                          );
                        }
                        load();
                      }}
                    >
                      Auto-map
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    const n = await trackerApi.syncPlatformConnection(c.id);
                    toast.success(`Synced ${n} spend rows`);
                    load();
                  }}
                >
                  Sync
                </Button>
              </div>
            </li>
          ))}
          {connections.length === 0 && (
            <p className={mutedTextClass}>No connections yet. Add credentials above.</p>
          )}
        </ul>
      </Card>

      {mediagoCampaigns.length > 0 && (
        <Card className="space-y-3 max-w-3xl">
          <h2 className={sectionHeadingClass}>Mediago campaigns (from API)</h2>
          <p className="text-xs text-zinc-500">
            Click a row to fill the mapping form. Auto-map matches by campaign name / slug.
          </p>
          <ul className="text-xs font-mono max-h-48 overflow-y-auto space-y-1">
            {mediagoCampaigns.map((mc) => (
              <li key={mc.campaignId}>
                <button
                  type="button"
                  className={`text-left ${linkClass} w-full`}
                  onClick={() =>
                    setMapForm({
                      campaignId: mapForm.campaignId,
                      platform: 'mediago',
                      externalCampaignId: mc.campaignId,
                    })
                  }
                >
                  {mc.campaignId} — {mc.campaignName}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="space-y-4 max-w-2xl">
        <h2 className={sectionHeadingClass}>Campaign ID mapping</h2>
        <p className="text-xs text-zinc-500">
          Link tracker campaign to Mediago campaign ID for spend sync. Use Auto-map on a Mediago
          connection to match existing tracker campaigns by name.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Tracker campaign</Label>
            <Select
              value={mapForm.campaignId}
              onChange={(e) => setMapForm({ ...mapForm, campaignId: e.target.value })}
            >
              <option value="">Select...</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Platform</Label>
            <Select
              value={mapForm.platform}
              onChange={(e) => setMapForm({ ...mapForm, platform: e.target.value })}
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>External campaign ID</Label>
            <Input
              value={mapForm.externalCampaignId}
              onChange={(e) => setMapForm({ ...mapForm, externalCampaignId: e.target.value })}
              placeholder="Mediago campaign_id"
            />
          </div>
        </div>
        <Button onClick={addMapping}>Save mapping</Button>
        <ul className="text-xs space-y-1">
          {mappings.map((m) => (
            <li key={m.id}>
              {m.campaign?.name} → {m.platform} / {m.externalCampaignId}
            </li>
          ))}
        </ul>
      </Card>

      {mediagoAccounts.length > 0 && (
        <Card className="max-w-2xl">
          <h2 className={`${sectionHeadingClass} mb-2`}>Mediago accounts on token</h2>
          <ul className="text-sm space-y-1">
            {mediagoAccounts.map((a) => (
              <li key={a.accountId}>
                {a.accountName} — <code className={inlineCodeClass}>{a.accountId}</code>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="space-y-4 max-w-2xl">
        <h2 className={sectionHeadingClass}>Manual spend entry</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Campaign</Label>
            <Select
              value={manualForm.campaignId}
              onChange={(e) => setManualForm({ ...manualForm, campaignId: e.target.value })}
            >
              <option value="">Select...</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={manualForm.date}
              onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
            />
          </div>
          <div>
            <Label>Impressions</Label>
            <Input
              value={manualForm.impressions}
              onChange={(e) => setManualForm({ ...manualForm, impressions: e.target.value })}
            />
          </div>
          <div>
            <Label>Clicks</Label>
            <Input
              value={manualForm.clicks}
              onChange={(e) => setManualForm({ ...manualForm, clicks: e.target.value })}
            />
          </div>
          <div>
            <Label>Spend (USD)</Label>
            <Input
              value={manualForm.spend}
              onChange={(e) => setManualForm({ ...manualForm, spend: e.target.value })}
            />
          </div>
        </div>
        <Button onClick={saveManualSpend}>Save manual spend</Button>
      </Card>

      <Card className="space-y-4 max-w-3xl">
        <h2 className={sectionHeadingClass}>Import spend CSV</h2>
        <p className="text-xs text-zinc-500">
          Columns: date, campaign_slug, impressions, clicks, spend, platform
        </p>
        <Textarea
          rows={6}
          className="font-mono text-xs"
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
        />
        <Button onClick={importCsv}>Import CSV</Button>
      </Card>
    </div>
  );
}
