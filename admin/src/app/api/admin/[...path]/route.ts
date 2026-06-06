import { auth } from '@/auth';
import type { NextRequest } from 'next/server';

const TRACKER_API_URL = process.env.TRACKER_API_URL || 'http://localhost:3001';
const API_KEY = process.env.TRACKER_API_KEY || 'dev-api-key-change-me';

async function proxy(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { path } = await context.params;
  const target = new URL(`/api/${path.join('/')}`, TRACKER_API_URL);
  req.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  const headers = new Headers();
  headers.set('x-api-key', API_KEY);
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const body = hasBody ? await req.text() : undefined;

  const upstream = await fetch(target.toString(), {
    method: req.method,
    headers,
    body,
  });

  const upstreamType = upstream.headers.get('content-type') || 'application/json';
  const text = await upstream.text();

  return new Response(text, {
    status: upstream.status,
    headers: { 'content-type': upstreamType },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
