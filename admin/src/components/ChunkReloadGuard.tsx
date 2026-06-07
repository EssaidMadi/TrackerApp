'use client';

import { useEffect } from 'react';

function isChunkMessage(msg: string) {
  return (
    msg.includes('ChunkLoadError') ||
    msg.includes('Failed to load chunk') ||
    msg.includes('Loading chunk')
  );
}

/** Auto-reload once when a stale JS chunk is requested after deploy. */
export function ChunkReloadGuard() {
  useEffect(() => {
    const key = 'chunk-reload-once';

    const maybeReload = (message: string) => {
      if (!isChunkMessage(message)) return;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
      window.location.reload();
    };

    const onError = (event: ErrorEvent) => {
      maybeReload(event.message || String(event.error));
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg =
        typeof reason === 'string'
          ? reason
          : reason?.message || reason?.name || String(reason);
      maybeReload(msg);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
