import type { FetchOptions, Source, TrendItem } from "../types.js";
import { fetchText } from "../http.js";
import { parseRss } from "../rss.js";

/** Hatena Bookmark hot entries (Japan), from the public RSS feed. */
export const hatena: Source = {
  id: "hatena",
  label: "Hatena Bookmark",
  async fetchTrends(opts: FetchOptions): Promise<TrendItem[]> {
    const xml = await fetchText(
      "https://b.hatena.ne.jp/hotentry.rss",
      opts.fetchFn ?? fetch,
      undefined,
      opts.timeoutMs,
    );
    return parseRss(xml, opts.limit).map((item, i) => ({
      rank: i + 1,
      title: item.title,
      url: item.link || undefined,
    }));
  },
};
