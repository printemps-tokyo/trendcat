/** Tiny fetch helpers with a descriptive User-Agent and error checking. */

export const USER_AGENT = "trendcat/0.1 (+https://github.com/printemps-tokyo/trendcat)";

/** Default per-request timeout in milliseconds. */
export const DEFAULT_TIMEOUT_MS = 10_000;

/** Fetch a URL and return its body text, throwing on a non-2xx status. A
 * source can pass its own `userAgent` (Reddit, for example, blocks requests
 * that do not look like a browser). Every request is aborted after
 * `timeoutMs` so a stalled endpoint cannot hang the caller. */
export async function fetchText(
  url: string,
  fetchFn: typeof fetch = fetch,
  userAgent: string = USER_AGENT,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<string> {
  try {
    const res = await fetchFn(url, {
      headers: { "user-agent": userAgent, accept: "*/*" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    return await res.text();
  } catch (err) {
    if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
      throw new Error(`timed out after ${timeoutMs}ms for ${url}`, { cause: err });
    }
    throw err;
  }
}

/** Fetch a URL and parse its body as JSON. */
export async function fetchJson<T>(
  url: string,
  fetchFn: typeof fetch = fetch,
  userAgent: string = USER_AGENT,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  return JSON.parse(await fetchText(url, fetchFn, userAgent, timeoutMs)) as T;
}
