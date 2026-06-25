'use client';

import { usePathname } from 'next/navigation';
import { useSidebar } from '@/components/SidebarContext';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { toggle } = useSidebar();
  const isLogin = pathname === '/login';

  if (isLogin) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen lg:pl-64">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-zinc-200/60 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-4 py-3 lg:hidden shadow-sm">
        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center justify-center rounded-xl p-2 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
          aria-label="Open navigation menu"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-gradient">Tracker Admin</span>
      </header>
      {children}
    </div>
  );
}
