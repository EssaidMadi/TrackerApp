'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { trackerApi } from '@/lib/api';

export function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    trackerApi.getAlertsUnreadCount().then(setCount).catch(() => setCount(0));
    const t = setInterval(() => {
      trackerApi.getAlertsUnreadCount().then(setCount).catch(() => {});
    }, 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <Link
      href="/alerts"
      className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 17v1a3 3 0 0 0 6 0v-1" strokeLinecap="round" />
      </svg>
      Alerts
      {count > 0 && (
        <span className="absolute -top-0.5 left-6 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
