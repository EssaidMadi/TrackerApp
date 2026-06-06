'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignOutButton } from './SignOutButton';

const links = [
  { href: '/', label: 'Campaigns', icon: 'M3 7h18M3 12h18M3 17h18' },
  { href: '/domains', label: 'Domains', icon: 'M12 3l8 4v10l-8 4-8-4V7l8-4z' },
  { href: '/traffic', label: 'Live Traffic', icon: 'M3 3v18h18M7 14l4-4 4 4 5-6' },
  { href: '/clicks', label: 'Clicks', icon: 'M15 15l6 6M10 17a7 7 0 1 1 0-14 7 7 0 0 1 0 14z' },
  { href: '/conversions', label: 'Conversions', icon: 'M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Sidebar({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname();

  if (pathname === '/login') return null;

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 bg-zinc-950 text-zinc-300 flex flex-col">
      <div className="px-5 py-6 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">TK</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-none">Tracker</p>
            <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map((link) => {
          const active =
            link.href === '/'
              ? pathname === '/'
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <NavIcon d={link.icon} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-zinc-800">
        {userEmail && (
          <p className="text-xs text-zinc-500 truncate mb-2 px-1" title={userEmail}>
            {userEmail}
          </p>
        )}
        <SignOutButton />
      </div>
    </aside>
  );
}
