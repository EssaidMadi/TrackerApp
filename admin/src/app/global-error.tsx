'use client';

import { useEffect } from 'react';
import './globals.css';
import { Button } from '@/components/ui';

function isChunkError(error: Error) {
  return (
    error.name === 'ChunkLoadError' ||
    error.message.includes('Failed to load chunk') ||
    error.message.includes('Loading chunk')
  );
}

const themeScript = `
(function () {
  try {
    var t = localStorage.getItem('theme');
    var dark = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
        <div className="max-w-md mx-auto mt-24 p-8 text-center">
          <h2 className="text-lg font-semibold mb-2">This page couldn&apos;t load</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            {isChunkError(error)
              ? 'The app was updated. Reload to fetch the latest version.'
              : 'Something went wrong.'}
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => window.location.reload()}>Reload</Button>
            <Button variant="secondary" onClick={() => reset()}>
              Try again
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
