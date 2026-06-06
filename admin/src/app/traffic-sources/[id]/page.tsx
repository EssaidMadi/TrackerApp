'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Loading, PageHeader } from '@/components/ui';
import { TrafficSourceEditor } from '@/components/TrafficSourceEditor';
import { trackerApi, type TrafficSourceProfile } from '@/lib/api';

export default function EditTrafficSourcePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<TrafficSourceProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackerApi
      .getTrafficSource(id)
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;
  if (!profile) return <p className="text-sm text-zinc-500">Profile not found.</p>;

  return (
    <div>
      <Link href="/traffic-sources" className="text-sm text-indigo-600 hover:underline mb-6 inline-block">
        ← Back to traffic sources
      </Link>
      <PageHeader title={profile.name} description={`Slug: ${profile.slug}`} />
      <TrafficSourceEditor initial={profile} />
    </div>
  );
}
