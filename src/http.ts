/** Tiny fetch helpers with a descriptive User-Agent and error checking. */

export const USER_AGENT = "trendcat/0.1 (+https://github.com/printemps-tokyo/trendcat)";

/** Fetch a URL and return its body text, throwing on a non-2xx status. */
export async function fetchText(url: string, fetchFn: typeof fetch = fetch): Promise<string> {
  const res = await fetchFn(url, { headers: { "user-agent": USER_AGENT, accept: "*/*" } });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.text();
}

/** Fetch a URL and parse its body as JSON. */
export async function fetchJson<T>(url: string, fetchFn: typeof fetch = fetch): Promise<T> {
  return JSON.parse(await fetchText(url, fetchFn)) as T;
}
