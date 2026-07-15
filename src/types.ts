/** A single trending item, normalized across every source. */
export interface TrendItem {
  /** 1-based rank within its source. */
  rank: number;
  /** The headline, article title, or trending term. */
  title: string;
  /** A link to the item, when the source provides one. */
  url?: string;
  /** A source-specific popularity number (points, upvotes, views, ...). */
  score?: number;
}

/** Options passed to each source's fetcher. */
export interface FetchOptions {
  /** Max items to return. */
  limit: number;
  /** Language / region hint ("ja" or "en") for the region-aware sources. */
  lang: string;
  /** Per-request timeout in milliseconds (default: 10000). */
  timeoutMs?: number;
  /** Injectable fetch, so the network can be stubbed in tests. */
  fetchFn?: typeof fetch;
}

/** One trend source: an id, a display label, and a fetcher. */
export interface Source {
  id: string;
  label: string;
  fetchTrends(opts: FetchOptions): Promise<TrendItem[]>;
}
