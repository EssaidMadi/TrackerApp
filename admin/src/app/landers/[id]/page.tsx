'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Input,
  Label,
  Loading,
  PageHeader,
  PreBlock,
  Select,
  mutedTextClass,
  sectionHeadingClass,
} from '@/components/ui';
import { trackerApi, formatApiError, type Campaign, type Lander, type LanderSuggestion } from '@/lib/api';

export default function LanderDetailPage() {
  const toast = useToast();
  const params = useParams();
  const id = params.id as string;

  const [lander, setLander] = useState<Lander | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [suggestion, setSuggestion] = useState<LanderSuggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    campaignId: '',
    slug: '',
    rootDomain: '',
    publicUrl: '',
    entryFile: 'index.html',
    injectTracker: true,
    noViewContent: false,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([trackerApi.getLander(id), trackerApi.getCampaigns()])
      .then(async ([l, c]) => {
        if (cancelled) return;
        setLander(l);
        setCampaigns(c);
        setForm({
          name: l.name,
          campaignId: l.campaignId,
          slug: l.slug,
          rootDomain: l.rootDomain || '',
          publicUrl: l.publicUrl,
          entryFile: l.entryFile,
          injectTracker: l.injectTracker,
          noViewContent: l.trackerAttrs?.noViewContent === true,
        });
        const s = await trackerApi.suggestLander({ campaignId: l.campaignId, name: l.name });
        if (!cancelled) {
          setSuggestion(s);
          setError(null);
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError(formatApiError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  const refreshSuggestions = async (campaignId: string, name: string) => {
    try {
      const s = await trackerApi.suggestLander({ campaignId, name });
      setSuggestion(s);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await trackerApi.updateLander(id, {
        name: form.name,
        campaignId: form.campaignId,
        slug: form.slug,
        rootDomain: form.rootDomain,
        publicUrl: form.publicUrl,
        entryFile: form.entryFile,
        injectTracker: form.injectTracker,
        trackerAttrs: { noViewContent: form.noViewContent },
      });
      setLander(updated);
      toast.success('Saved — campaign destination URL and lander metadata updated.');
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const file = files[0];
      const updated =
        file.name.endsWith('.zip') || file.type.includes('zip')
          ? await trackerApi.uploadLanderFile(id, file)
          : await trackerApi.uploadLanderFiles(id, Array.from(files));
      setLander(updated);
      toast.success('Upload complete — tracker script injected in processed copy.');
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (loading || !lander) return <Loading label="Loading lander…" />;

  return (
    <div>
      <PageHeader
        title={lander.name}
        description={`Linked to campaign ${lander.campaign.name}`}
        meta={<Badge tone={lander.status === 'ready' ? 'success' : 'neutral'}>{lander.status}</Badge>}
        action={
          <Link href="/landers" className={`text-sm ${mutedTextClass} hover:text-zinc-800 dark:hover:text-zinc-200`}>
            ← All landers
          </Link>
        }
      />

      {error && (
        <div className="mb-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <form onSubmit={handleSave} className="space-y-4">
            <h3 className={sectionHeadingClass}>Lander settings</h3>
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  refreshSuggestions(form.campaignId, e.target.value);
                }}
              />
            </div>
            <div>
              <Label>Campaign</Label>
              <Select
                value={form.campaignId}
                onChange={(e) => {
                  const campaignId = e.target.value;
                  setForm({ ...form, campaignId });
                  refreshSuggestions(campaignId, form.name);
                }}
              >
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>
              <div>
                <Label>Root domain</Label>
                <Select
                  value={form.rootDomain}
                  onChange={(e) => {
                    const rootDomain = e.target.value;
                    setForm({
                      ...form,
                      rootDomain,
                      publicUrl: rootDomain ? `https://${rootDomain}/` : form.publicUrl,
                    });
                  }}
                >
                  <option value="">Custom…</option>
                  {(suggestion?.verifiedDomains || []).map((d) => (
                    <option key={d.id} value={d.rootDomain}>
                      {d.rootDomain} ({d.label})
                    </option>
                  ))}
                </Select>
                {!suggestion?.verifiedDomains.length && (
                  <Input
                    className="mt-2"
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
                )}
              </div>
            </div>
            <div>
              <Label>Public URL (campaign destination)</Label>
              <Input
                value={form.publicUrl}
                onChange={(e) => setForm({ ...form, publicUrl: e.target.value })}
              />
            </div>
            <div>
              <Label>Entry file</Label>
              <Input
                value={form.entryFile}
                onChange={(e) => setForm({ ...form, entryFile: e.target.value })}
              />
            </div>
            <Checkbox
              label="Inject tracker script on upload"
              checked={form.injectTracker}
              onChange={(checked) => setForm({ ...form, injectTracker: checked })}
            />
            <Checkbox
              label="Skip auto viewcontent (optimize for click_button)"
              checked={form.noViewContent}
              onChange={(checked) => setForm({ ...form, noViewContent: checked })}
            />
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save & link campaign'}
            </Button>
          </form>
        </Card>

        <Card>
          <h3 className={`${sectionHeadingClass} mb-4`}>Upload & deploy</h3>
          <p className={`text-sm ${mutedTextClass} mb-4`}>
            Upload a zip or individual HTML/CSS/JS files. {lander.fileCount} raw file(s),{' '}
            {lander.processedCount} processed.
          </p>
          <label className="block mb-4">
            <span className="sr-only">Upload files</span>
            <input
              type="file"
              multiple
              accept=".html,.htm,.css,.js,.zip,.svg,.png,.jpg,.jpeg,.gif,.webp,.ico,.woff,.woff2"
              onChange={handleUpload}
              disabled={uploading}
              className="text-sm"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={!lander.hasFiles}
              onClick={() => trackerApi.downloadLanderDeployBundle(id, `${lander.slug}-deploy.zip`)}
            >
              Download deploy bundle
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!lander.hasFiles}
              onClick={() => trackerApi.downloadLanderRaw(id, `${lander.slug}-raw.zip`)}
            >
              Download raw upload
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!lander.hasFiles}
              onClick={async () => {
                try {
                  const updated = await trackerApi.reprocessLander(id);
                  setLander(updated);
                  toast.success('Re-processed with current campaign settings.');
                } catch (err) {
                  toast.error(formatApiError(err));
                }
              }}
            >
              Re-process
            </Button>
          </div>
          <p className={`text-xs ${mutedTextClass} mt-4 font-mono`}>{lander.deployCommand}</p>
        </Card>
      </div>

      {suggestion?.trackerSnippet && (
        <Card>
          <h3 className={`${sectionHeadingClass} mb-2`}>Tracker snippet (auto-injected)</h3>
          <PreBlock>{suggestion.trackerSnippet}</PreBlock>
        </Card>
      )}
    </div>
  );
}
