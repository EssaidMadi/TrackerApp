import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/AppShell';
import { ChunkReloadGuard } from '@/components/ChunkReloadGuard';
import { Sidebar } from '@/components/Sidebar';
import { auth } from '@/auth';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Tracker Admin',
  description: 'Native tracking infrastructure admin',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ChunkReloadGuard />
        <Sidebar userEmail={session?.user?.email} />
        <AppShell>
          <main className="px-8 py-8 max-w-[1400px]">{children}</main>
        </AppShell>
      </body>
    </html>
  );
}
