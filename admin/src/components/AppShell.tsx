'use client';

import { usePathname } from 'next/navigation';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  if (isLogin) {
    return <div className="min-h-screen">{children}</div>;
  }

  return <div className="pl-60 min-h-screen">{children}</div>;
}
