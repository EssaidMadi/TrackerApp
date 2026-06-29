export function formatApiError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message;
    if (msg.includes('<!DOCTYPE') || msg.includes('<html')) {
      return 'Session expired or API unreachable. Please sign in again.';
    }
    return msg;
  }
  return String(err);
}

function isJsonContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  return contentType.includes('application/json') || contentType.includes('+json');
}

function looksLikeHtml(text: string): boolean {
  const t = text.trimStart();
  return t.startsWith('<!DOCTYPE') || t.startsWith('<html') || t.startsWith('<HTML');
}

export function parseApiErrorBody(text: string, status: number): Error {
  if (looksLikeHtml(text)) {
    if (status === 401) return new Error('Session expired. Please sign in again.');
    return new Error('API returned an HTML error page. The backend may be unreachable.');
  }
  try {
    const json = JSON.parse(text) as { message?: string | string[] };
    const msg = json.message;
    if (typeof msg === 'string') return new Error(msg);
    if (Array.isArray(msg)) return new Error(msg.join(', '));
  } catch {
    /* not JSON */
  }
  const snippet = text.length > 200 ? `${text.slice(0, 200)}…` : text;
  return new Error(snippet || `API error ${status}`);
}

export async function parseJsonResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type');
  const text = await res.text();
  if (!text) return undefined as T;
  if (!isJsonContentType(contentType) && looksLikeHtml(text)) {
    throw new Error(
      res.status === 401
        ? 'Session expired. Please sign in again.'
        : 'API returned HTML instead of JSON.',
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Invalid JSON response from API.');
  }
}
