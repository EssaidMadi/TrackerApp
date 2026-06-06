import { auth } from '@/auth';
import { signInWithGoogle } from '@/actions/auth';
import { Alert, Button } from '@/components/ui';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (session?.user) {
    return null;
  }

  const oauthReady =
    !!process.env.GOOGLE_CLIENT_ID?.trim() && !!process.env.GOOGLE_CLIENT_SECRET?.trim();

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-zinc-950 text-white p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-sm">
            TK
          </div>
          <span className="font-semibold text-lg">Tracker Admin</span>
        </div>
        <div>
          <h2 className="text-3xl font-semibold tracking-tight leading-tight">
            Native tracking
            <br />
            infrastructure
          </h2>
          <p className="text-zinc-400 mt-4 text-sm leading-relaxed max-w-sm">
            Campaigns, clicks, conversions, and custom domains — Voluum-level data for Mediago,
            Facebook, and Google.
          </p>
        </div>
        <p className="text-xs text-zinc-600">Secured with Google OAuth</p>
      </div>

      <div className="flex items-center justify-center p-8 bg-zinc-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              TK
            </div>
            <span className="font-semibold text-zinc-900">Tracker Admin</span>
          </div>

          <h1 className="text-xl font-semibold text-zinc-900">Sign in</h1>
          <p className="text-sm text-zinc-500 mt-1 mb-8">
            Access the tracking dashboard with your Google account.
          </p>

          {!oauthReady ? (
            <div className="space-y-4">
              <Alert tone="warning">
                Google OAuth is not configured. Set <code className="text-xs">GOOGLE_CLIENT_ID</code>{' '}
                and <code className="text-xs">GOOGLE_CLIENT_SECRET</code> in{' '}
                <code className="text-xs">admin/.env.local</code>.
              </Alert>
              <ol className="text-sm text-zinc-600 space-y-2 list-decimal list-inside">
                <li>
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    Google Cloud Console
                  </a>{' '}
                  → OAuth client ID → Web
                </li>
                <li>
                  Redirect URI:{' '}
                  <code className="text-xs bg-zinc-100 px-1 rounded">
                    http://localhost:3000/api/auth/callback/google
                  </code>
                </li>
                <li>Restart admin after saving credentials</li>
              </ol>
            </div>
          ) : (
            <>
              {params.error === 'AccessDenied' && (
                <div className="mb-4">
                  <Alert tone="error">
                    Access denied. Only authorized emails can sign in.
                  </Alert>
                </div>
              )}

              <form
                action={async () => {
                  'use server';
                  await signInWithGoogle(params.callbackUrl || '/');
                }}
              >
                <Button type="submit" className="w-full py-3">
                  Continue with Google
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
