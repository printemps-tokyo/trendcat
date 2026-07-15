import type { FetchOptions, Source, TrendItem } from "../types.js";
import { fetchJson } from "../http.js";

/** The slice of the Wikimedia pageviews response we read. */
export interface WikiTopResponse {
  items?: { articles?: { article?: string; views?: number }[] }[];
}

// Non-article pages that dominate the list but are not real trends.
const EXCLUDED = new Set(["Main_Page", "メインページ", "-"]);
const EXCLUDED_PREFIX = /^(Special:|特別:|Wikipedia:|Portal:|ファイル:|File:|Help:)/;

/** Convert the Wikimedia top-articles payload into trend items (pure). */
export function parseWikipediaTop(data: WikiTopResponse, limit: number): TrendItem[] {
  const articles = data.items?.[0]?.articles ?? [];
  const items: TrendItem[] = [];
  for (const a of articles) {
    const article = a.article;
    if (!article || EXCLUDED.has(article) || EXCLUDED_PREFIX.test(article)) {
      continue;
    }
    const title = article.replace(/_/g, " ");
    items.push({
      rank: items.length + 1,
      title,
      url: undefined,
      score: a.views,
    });
    if (items.length >= limit) {
      break;
    }
  }
  return items;
}

/** Build the project name (e.g. "ja.wikipedia") from a language code. */
export function wikiProject(lang: string): string {
  return `${lang === "en" ? "en" : lang}.wikipedia`;
}

/** Format a Date as the `YYYY/MM/DD` path the pageviews API expects. */
export function wikiDatePath(date: Date): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}/${pad(date.getUTCMonth() + 1)}/${pad(date.getUTCDate())}`;
}

/** Most-viewed Wikipedia articles for the most recent complete day. */
export const wikipedia: Source = {
  id: "wikipedia",
  label: "Wikipedia",
  async fetchTrends(opts: FetchOptions): Promise<TrendItem[]> {
    const fetchFn = opts.fetchFn ?? fetch;
    const project = wikiProject(opts.lang);
    const day = 24 * 60 * 60 * 1000;
    // Yesterday's data is usually ready; fall back one more day if not.
    for (const offset of [1, 2]) {
      const path = wikiDatePath(new Date(Date.now() - offset * day));
      const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/${project}/all-access/${path}`;
      try {
        const data = await fetchJson<WikiTopResponse>(url, fetchFn, undefined, opts.timeoutMs);
        return parseWikipediaTop(data, opts.limit);
      } catch {
        // Try the earlier day.
      }
    }
    throw new Error("Wikipedia pageviews not available for the last two days");
  },
};
