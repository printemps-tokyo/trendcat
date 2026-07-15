import type { FetchOptions, Source, TrendItem } from "../types.js";
import { fetchText } from "../http.js";
import { parseRss } from "../rss.js";

/** Build the Google News RSS URL for a language/region. */
export function googleNewsUrl(lang: string): string {
  const [hl, gl, ceid] = lang === "en" ? ["en-US", "US", "US:en"] : ["ja", "JP", "JP:ja"];
  return `https://news.google.com/rss?hl=${hl}&gl=${gl}&ceid=${ceid}`;
}

/** Google News top stories for a language/region, from its RSS feed. */
export const googlenews: Source = {
  id: "googlenews",
  label: "Google News",
  async fetchTrends(opts: FetchOptions): Promise<TrendItem[]> {
    const xml = await fetchText(googleNewsUrl(opts.lang), opts.fetchFn ?? fetch, undefined, opts.timeoutMs);
    return parseRss(xml, opts.limit).map((item, i) => ({
      rank: i + 1,
      title: item.title,
      url: item.link || undefined,
    }));
  },
};
