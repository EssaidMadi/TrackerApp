'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Alert, Loading, PageHeader, linkClass, mutedTextClass } from '@/components/ui';
import { TrafficSourceEditor } from '@/components/TrafficSourceEditor';
import { trackerApi, formatApiError, type TrafficSourceProfile } from '@/lib/api';

export default function EditTrafficSourcePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<TrafficSourceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackerApi
      .getTrafficSource(id)
      .then((data) => {
        setProfile(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError(formatApiError(err));
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;
  if (error) return <Alert tone="error">{error}</Alert>;
  if (!profile) return <p className={`text-sm ${mutedTextClass}`}>Profile not found.</p>;

  return (
    <div>
      <Link href="/traffic-sources" className={`text-sm ${linkClass} mb-6 inline-block`}>
        ← Back to traffic sources
      </Link>
      <PageHeader title={profile.name} description={`Slug: ${profile.slug}`} />
      <TrafficSourceEditor initial={profile} />
    </div>
  );
}
