'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Input,
  Label,
  Loading,
  PageHeader,
  TableHead,
  Th,
  mutedTextClass,
  sectionHeadingClass,
  tableRowClass,
} from '@/components/ui';
import { trackerApi, formatApiError, type ConversionEventType } from '@/lib/api';

export default function ConversionEventsPage() {
  const toast = useToast();
  const [items, setItems] = useState<ConversionEventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      .then((data) => {
        setItems(data);
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
    } catch (err) {
      toast.error(formatApiError(err));
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
    } catch (err) {
      toast.error(formatApiError(err));
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
    } catch (err) {
      toast.error(formatApiError(err));
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

      {error && (
        <div className="mb-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <Card className="mb-6 max-w-xl space-y-3">
        <h2 className={sectionHeadingClass}>Add event type</h2>
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
        <Checkbox
          label="Counts as conversion (Overview Conversions / CV% / eCPC)"
          checked={countsAsConversion}
          onChange={setCountsAsConversion}
        />
        <Button onClick={add} disabled={saving || !label}>
          Add
        </Button>
      </Card>

      <Card>
        <table className="w-full text-sm">
          <TableHead>
            <Th>Label</Th>
            <Th>Slug</Th>
            <Th>Order</Th>
            <Th>Active</Th>
            <Th>Counts as conv.</Th>
            <Th>Actions</Th>
          </TableHead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id} className={tableRowClass}>
                {editingId === e.id ? (
                  <>
                    <td className="py-2 pr-4">
                      <Input
                        value={editLabel}
                        onChange={(ev) => setEditLabel(ev.target.value)}
                        className="text-sm"
                      />
                    </td>
                    <td className={`py-2 pr-4 font-mono text-xs ${mutedTextClass}`}>{e.slug}</td>
                    <td className="py-2 pr-4">
                      <Input
                        type="number"
                        value={editSortOrder}
                        onChange={(ev) => setEditSortOrder(ev.target.value)}
                        className="text-sm w-20"
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <Checkbox label="Active" checked={editActive} onChange={setEditActive} />
                    </td>
                    <td className="py-2 pr-4">
                      <Checkbox label="Yes" checked={editCountsAsConversion} onChange={setEditCountsAsConversion} />
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
                    <td className={`py-2 pr-4 ${!e.active ? `${mutedTextClass} line-through` : ''}`}>
                      {e.displayLabel}
                      {e.isSystem && (
                        <span className={`ml-2 text-[10px] ${mutedTextClass} uppercase`}>system</span>
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
