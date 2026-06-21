import type { FetchOptions, Source, TrendItem } from "../types.js";
import { fetchText } from "../http.js";
import { parseRss } from "../rss.js";

// Reddit blocks its public `.json` API for unauthenticated/non-browser
// clients (HTTP 403), but still serves the public Atom feed to a browser-like
// User-Agent. The feed carries titles and links but no score.
const REDDIT_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** Reddit's top posts of the day from r/popular, via the public Atom feed. */
export const reddit: Source = {
  id: "reddit",
  label: "Reddit",
  async fetchTrends(opts: FetchOptions): Promise<TrendItem[]> {
    const xml = await fetchText(
      "https://www.reddit.com/r/popular/top/.rss?t=day",
      opts.fetchFn ?? fetch,
      REDDIT_UA,
    );
    return parseRss(xml, opts.limit).map((item, i) => ({
      rank: i + 1,
      title: item.title,
      url: item.link || undefined,
    }));
  },
};
