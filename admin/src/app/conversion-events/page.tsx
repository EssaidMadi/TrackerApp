'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Input, Label, Loading, PageHeader } from '@/components/ui';
import { trackerApi, type ConversionEventType } from '@/lib/api';

export default function ConversionEventsPage() {
  const [items, setItems] = useState<ConversionEventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState('');
  const [slug, setSlug] = useState('');

  const load = () => {
    trackerApi
      .getConversionEventTypes()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!label) return;
    await trackerApi.createConversionEventType({ displayLabel: label, slug: slug || undefined });
    setLabel('');
    setSlug('');
    load();
  };

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Conversion event types"
        description="Configure revenue column labels for the Overview report."
      />

      <Card className="mb-6 max-w-xl space-y-3">
        <h2 className="font-semibold">Add event type</h2>
        <div>
          <Label>Display label</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Lead revenue" />
        </div>
        <div>
          <Label>Slug (optional)</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="lead" className="font-mono" />
        </div>
        <Button onClick={add}>Add</Button>
      </Card>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-zinc-400 border-b">
              <th className="py-2">Label</th>
              <th className="py-2">Slug</th>
              <th className="py-2">Active</th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id} className="border-b border-zinc-50">
                <td className="py-2">{e.displayLabel}</td>
                <td className="py-2 font-mono text-xs">{e.slug}</td>
                <td className="py-2">{e.active ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
