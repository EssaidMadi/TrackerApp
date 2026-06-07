'use client';

import { useEffect } from 'react';

function isChunkError(error: Error) {
  return (
    error.name === 'ChunkLoadError' ||
    error.message.includes('Failed to load chunk') ||
    error.message.includes('Loading chunk')
  );
}

export default function GlobalError({
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
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>This page couldn&apos;t load</h2>
        <p style={{ color: '#71717a', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          {isChunkError(error)
            ? 'The app was updated. Reload to fetch the latest version.'
            : 'Something went wrong.'}
        </p>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              background: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: '0.5rem 1rem',
              background: 'white',
              color: '#3f3f46',
              border: '1px solid #e4e4e7',
              borderRadius: '0.5rem',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
