import type { FetchOptions, Source, TrendItem } from "../types.js";
import { fetchJson } from "../http.js";

/** The slice of Reddit's listing JSON we read. */
export interface RedditListing {
  data?: {
    children?: { data?: { title?: string; permalink?: string; url?: string; score?: number } }[];
  };
}

/** Convert Reddit's top listing into normalized trend items (pure). */
export function parseRedditListing(listing: RedditListing, limit: number): TrendItem[] {
  const children = listing.data?.children ?? [];
  const items: TrendItem[] = [];
  for (const child of children) {
    const post = child.data;
    if (!post?.title) {
      continue;
    }
    items.push({
      rank: items.length + 1,
      title: post.title,
      url: post.permalink ? `https://www.reddit.com${post.permalink}` : post.url,
      score: post.score,
    });
    if (items.length >= limit) {
      break;
    }
  }
  return items;
}

/** Reddit's top posts of the day from r/popular (no auth required). */
export const reddit: Source = {
  id: "reddit",
  label: "Reddit",
  async fetchTrends(opts: FetchOptions): Promise<TrendItem[]> {
    const url = `https://www.reddit.com/r/popular/top.json?t=day&limit=${opts.limit}`;
    const listing = await fetchJson<RedditListing>(url, opts.fetchFn ?? fetch);
    return parseRedditListing(listing, opts.limit);
  },
};
