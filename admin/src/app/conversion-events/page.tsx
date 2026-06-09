'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Input, Label, Loading, PageHeader } from '@/components/ui';
import { trackerApi, type ConversionEventType } from '@/lib/api';

export default function ConversionEventsPage() {
  const [items, setItems] = useState<ConversionEventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState('');
  const [slug, setSlug] = useState('');
  const [countsAsConversion, setCountsAsConversion] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editSortOrder, setEditSortOrder] = useState('0');
  const [editActive, setEditActive] = useState(true);
  const [editCountsAsConversion, setEditCountsAsConversion] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    trackerApi
      .getConversionEventTypes(true)
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!label) return;
    setSaving(true);
    try {
      await trackerApi.createConversionEventType({
        displayLabel: label,
        slug: slug || undefined,
        countsAsConversion,
      });
      setLabel('');
      setSlug('');
      setCountsAsConversion(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (e: ConversionEventType) => {
    setEditingId(e.id);
    setEditLabel(e.displayLabel);
    setEditSortOrder(String(e.sortOrder));
    setEditActive(e.active);
    setEditCountsAsConversion(e.countsAsConversion);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    if (!editLabel.trim()) return;
    setSaving(true);
    try {
      await trackerApi.updateConversionEventType(id, {
        displayLabel: editLabel.trim(),
        sortOrder: parseInt(editSortOrder, 10) || 0,
        active: editActive,
        countsAsConversion: editCountsAsConversion,
      });
      setEditingId(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (e: ConversionEventType) => {
    const msg = e.isSystem
      ? `"${e.displayLabel}" is a system type and will be deactivated (not deleted). Continue?`
      : `Delete "${e.displayLabel}"? This cannot be undone.`;
    if (!confirm(msg)) return;
    setSaving(true);
    try {
      await trackerApi.deleteConversionEventType(e.id);
      load();
    } finally {
      setSaving(false);
    }
  };

  if (loading && items.length === 0) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Conversion event types"
        description="Configure event types for Overview columns and conversion metrics. Only types marked “Counts as conversion” increment Conversions, CV%, and eCPC."
      />

      <Card className="mb-6 max-w-xl space-y-3">
        <h2 className="font-semibold">Add event type</h2>
        <div>
          <Label>Display label</Label>
          <Input value={label} onChange={(ev) => setLabel(ev.target.value)} placeholder="Lead revenue" />
        </div>
        <div>
          <Label>Slug (optional)</Label>
          <Input
            value={slug}
            onChange={(ev) => setSlug(ev.target.value)}
            placeholder="lead"
            className="font-mono"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={countsAsConversion}
            onChange={(ev) => setCountsAsConversion(ev.target.checked)}
          />
          Counts as conversion (Overview Conversions / CV% / eCPC)
        </label>
        <Button onClick={add} disabled={saving || !label}>
          Add
        </Button>
      </Card>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-zinc-400 border-b">
              <th className="py-2 pr-4">Label</th>
              <th className="py-2 pr-4">Slug</th>
              <th className="py-2 pr-4">Order</th>
              <th className="py-2 pr-4">Active</th>
              <th className="py-2 pr-4">Counts as conv.</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id} className="border-b border-zinc-50">
                {editingId === e.id ? (
                  <>
                    <td className="py-2 pr-4">
                      <Input
                        value={editLabel}
                        onChange={(ev) => setEditLabel(ev.target.value)}
                        className="text-sm"
                      />
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs text-zinc-500">{e.slug}</td>
                    <td className="py-2 pr-4">
                      <Input
                        type="number"
                        value={editSortOrder}
                        onChange={(ev) => setEditSortOrder(ev.target.value)}
                        className="text-sm w-20"
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={editActive}
                          onChange={(ev) => setEditActive(ev.target.checked)}
                        />
                        Active
                      </label>
                    </td>
                    <td className="py-2 pr-4">
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={editCountsAsConversion}
                          onChange={(ev) => setEditCountsAsConversion(ev.target.checked)}
                        />
                        Yes
                      </label>
                    </td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(e.id)} disabled={saving}>
                          Save
                        </Button>
                        <Button size="sm" variant="secondary" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className={`py-2 pr-4 ${!e.active ? 'text-zinc-400 line-through' : ''}`}>
                      {e.displayLabel}
                      {e.isSystem && (
                        <span className="ml-2 text-[10px] text-zinc-400 uppercase">system</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs">{e.slug}</td>
                    <td className="py-2 pr-4">{e.sortOrder}</td>
                    <td className="py-2 pr-4">{e.active ? 'Yes' : 'No'}</td>
                    <td className="py-2 pr-4">{e.countsAsConversion ? 'Yes' : 'No'}</td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => startEdit(e)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => remove(e)} disabled={saving}>
                          {e.isSystem ? 'Deactivate' : 'Delete'}
                        </Button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
