/** Tiny fetch helpers with a descriptive User-Agent and error checking. */

export const USER_AGENT = "trendcat/0.1 (+https://github.com/printemps-tokyo/trendcat)";

/** Fetch a URL and return its body text, throwing on a non-2xx status. A
 * source can pass its own `userAgent` (Reddit, for example, blocks requests
 * that do not look like a browser). */
export async function fetchText(
  url: string,
  fetchFn: typeof fetch = fetch,
  userAgent: string = USER_AGENT,
): Promise<string> {
  const res = await fetchFn(url, { headers: { "user-agent": userAgent, accept: "*/*" } });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.text();
}

/** Fetch a URL and parse its body as JSON. */
export async function fetchJson<T>(
  url: string,
  fetchFn: typeof fetch = fetch,
  userAgent: string = USER_AGENT,
): Promise<T> {
  return JSON.parse(await fetchText(url, fetchFn, userAgent)) as T;
}
