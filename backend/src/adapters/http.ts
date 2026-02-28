/**
 * Client HTTP générique — fetch avec timeout.
 *
 * @module adapters/http
 */

export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 8000, ...fetchOpts } = options;
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...fetchOpts,
      signal: ctrl.signal,
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetchWithTimeout(url, { ...options, timeoutMs: 8000 });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return (await res.json()) as T;
}
