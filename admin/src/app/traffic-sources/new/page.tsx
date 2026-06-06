'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/ui';
import { TrafficSourceEditor } from '@/components/TrafficSourceEditor';

export default function NewTrafficSourcePage() {
  return (
    <div>
      <Link href="/traffic-sources" className="text-sm text-indigo-600 hover:underline mb-6 inline-block">
        ← Back to traffic sources
      </Link>
      <PageHeader title="New traffic source" description="Define URL templates, param mappings, and conversion method." />
      <TrafficSourceEditor isNew />
    </div>
  );
}
