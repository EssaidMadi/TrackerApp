import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const TRANSIENT_FB_ERROR_CODES = new Set<number>([1, 2, 4, 17, 32, 613]);
const TRANSIENT_FB_ERROR_SUBCODES = new Set<number>([2446079, 1487390]);

export function isTransientFbError(err: unknown): boolean {
  const e = err as {
    response?: { status?: number; data?: { error?: { code?: number; error_subcode?: number } } };
    status?: number;
  };
  const status = e?.response?.status ?? e?.status ?? 0;
  if (status === 429 || (status >= 500 && status < 600)) return true;
  const fb = e?.response?.data?.error;
  if (fb?.code != null && TRANSIENT_FB_ERROR_CODES.has(fb.code)) return true;
  if (fb?.error_subcode != null && TRANSIENT_FB_ERROR_SUBCODES.has(fb.error_subcode)) return true;
  return false;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function httpRequestWithRetry(
  http: HttpService,
  method: 'get' | 'post',
  url: string,
  data?: unknown,
  maxRetries = 3,
): Promise<{ data: unknown; status: number }> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response =
        method === 'get'
          ? await firstValueFrom(http.get(url))
          : await firstValueFrom(http.post(url, data));
      return { data: response.data, status: response.status };
    } catch (err) {
      lastError = err;
      const isTransient =
        isTransientFbError(err) ||
        (err as { response?: { status?: number } })?.response?.status === 429;
      if (!isTransient || attempt === maxRetries - 1) throw err;
      await sleep(400 * Math.pow(2, attempt));
    }
  }

  throw lastError;
}
