/**
 * Fetch avec retry automatique sur erreur réseau ou 5xx.
 *
 * @module infrastructure/http/fetchWithRetry
 */

const DEFAULT_RETRIES = 2;
const DEFAULT_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(res: Response): boolean {
  return res.status >= 500 || res.status === 0;
}

export interface FetchWithRetryOptions extends RequestInit {
  retries?: number;
  delayMs?: number;
}

export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const { retries = DEFAULT_RETRIES, delayMs = DEFAULT_DELAY_MS, ...fetchOpts } = options;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, fetchOpts);
      if (res.ok || !isRetryable(res)) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') throw e;
      lastError = e;
    }
    if (attempt < retries) await sleep(delayMs);
  }
  throw lastError;
}
