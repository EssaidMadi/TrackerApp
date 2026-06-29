'use client';

import { useEffect } from 'react';
import { Button, mutedTextClass, pageTitleClass } from '@/components/ui';

function isChunkError(error: Error) {
  return (
    error.name === 'ChunkLoadError' ||
    error.message.includes('Failed to load chunk') ||
    error.message.includes('Loading chunk')
  );
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (!isChunkError(error)) return;
    const key = 'chunk-reload-once';
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1');
      window.location.reload();
    }
  }, [error]);

  return (
    <div className="max-w-md mx-auto mt-24 p-8 text-center">
      <h2 className={`text-lg font-semibold mb-2 ${pageTitleClass}`}>This page couldn&apos;t load</h2>
      <p className={`text-sm mb-6 ${mutedTextClass}`}>
        {isChunkError(error)
          ? 'The app was updated while this tab was open. Reload to fetch the latest version.'
          : error.message || 'An unexpected error occurred.'}
      </p>
      <div className="flex gap-3 justify-center">
        <Button onClick={() => window.location.reload()}>Reload</Button>
        <Button variant="secondary" onClick={() => reset()}>
          Try again
        </Button>
      </div>
    </div>
  );
}
