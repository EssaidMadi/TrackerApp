'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Input,
  Label,
  Loading,
  PageHeader,
  Select,
  Textarea,
} from '@/components/ui';
import {
  trackerApi,
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

export default function IntegrationsPage() {
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [mappings, setMappings] = useState<CampaignPlatformMapping[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [connForm, setConnForm] = useState({
    platform: 'facebook',
    label: '',
    accountId: '',
    credentialsJson: '{}',
  });

  const [mapForm, setMapForm] = useState({
    campaignId: '',
    platform: 'facebook',
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
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const addConnection = async () => {
    try {
      let credentials = {};
      try {
        credentials = JSON.parse(connForm.credentialsJson);
      } catch {
        alert('Invalid credentials JSON');
        return;
      }
      await trackerApi.createPlatformConnection({
        platform: connForm.platform,
        label: connForm.label,
        accountId: connForm.accountId || undefined,
        credentials,
      });
      setConnForm({ platform: 'facebook', label: '', accountId: '', credentialsJson: '{}' });
      load();
    } catch (err) {
      alert(String(err));
    }
  };

  const addMapping = async () => {
    try {
      await trackerApi.createCampaignMapping(mapForm);
      load();
    } catch (err) {
      alert(String(err));
    }
  };

  const syncAll = async () => {
    setSyncing(true);
    try {
      const res = await trackerApi.syncAllPlatforms();
      alert(`Synced ${res.synced} spend rows`);
      load();
    } catch (err) {
      alert(String(err));
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
      alert('Spend saved');
    } catch (err) {
      alert(String(err));
    }
  };

  const importCsv = async () => {
    try {
      const res = await trackerApi.importSpendCsv(csvText);
      alert(`Imported ${res.imported} rows`);
    } catch (err) {
      alert(String(err));
    }
  };

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

      <Card className="space-y-4 max-w-2xl">
        <h2 className="font-semibold">Add platform connection</h2>
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
          <div>
            <Label>Label</Label>
            <Input
              value={connForm.label}
              onChange={(e) => setConnForm({ ...connForm, label: e.target.value })}
              placeholder="Facebook main account"
            />
          </div>
        </div>
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
      </Card>

      <Card>
        <h2 className="font-semibold mb-3">Connections</h2>
        <ul className="space-y-2 text-sm">
          {connections.map((c) => (
            <li key={c.id} className="flex items-center justify-between border-b border-zinc-100 py-2">
              <span>
                <strong>{c.label}</strong> ({c.platform}) — {c.status}
                {c.lastSyncAt && (
                  <span className="text-zinc-400 ml-2">
                    last sync {new Date(c.lastSyncAt).toLocaleString()}
                  </span>
                )}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    const r = await trackerApi.testPlatformConnection(c.id);
                    alert(r.ok ? 'OK' : 'Failed');
                  }}
                >
                  Test
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => trackerApi.syncPlatformConnection(c.id).then(load)}
                >
                  Sync
                </Button>
              </div>
            </li>
          ))}
          {connections.length === 0 && (
            <p className="text-zinc-400">No connections yet. Add credentials above.</p>
          )}
        </ul>
      </Card>

      <Card className="space-y-4 max-w-2xl">
        <h2 className="font-semibold">Campaign ID mapping</h2>
        <p className="text-xs text-zinc-500">
          Link tracker campaign to external ad platform campaign ID for spend sync.
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

      <Card className="space-y-4 max-w-2xl">
        <h2 className="font-semibold">Manual spend entry</h2>
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
            <Label>Spend (EUR)</Label>
            <Input
              value={manualForm.spend}
              onChange={(e) => setManualForm({ ...manualForm, spend: e.target.value })}
            />
          </div>
        </div>
        <Button onClick={saveManualSpend}>Save manual spend</Button>
      </Card>

      <Card className="space-y-4 max-w-3xl">
        <h2 className="font-semibold">Import spend CSV</h2>
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
