'use client';

import { signOutAction } from '@/actions/auth';

export function SignOutButton() {
  return (
    <form action={signOutAction} className="w-full">
      <button
        type="submit"
        className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded-lg transition-colors"
      >
        Sign out
      </button>
    </form>
  );
}
