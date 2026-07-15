import type { FetchOptions, Source, TrendItem } from "../types.js";
import { fetchJson } from "../http.js";

const API = "https://hacker-news.firebaseio.com/v0";

/** The shape of a Hacker News item we care about. */
export interface HnStory {
  title?: string;
  url?: string;
  score?: number;
  id?: number;
}

/** Convert a Hacker News item into a normalized trend item (pure). */
export function parseHnStory(story: HnStory, rank: number): TrendItem {
  return {
    rank,
    title: story.title ?? "(untitled)",
    url: story.url ?? (story.id ? `https://news.ycombinator.com/item?id=${story.id}` : undefined),
    score: story.score,
  };
}

/** Hacker News front-page stories via the official Firebase API. */
export const hackernews: Source = {
  id: "hackernews",
  label: "Hacker News",
  async fetchTrends(opts: FetchOptions): Promise<TrendItem[]> {
    const fetchFn = opts.fetchFn ?? fetch;
    const ids = await fetchJson<number[]>(`${API}/topstories.json`, fetchFn, undefined, opts.timeoutMs);
    const top = ids.slice(0, opts.limit);
    const stories = await Promise.all(
      top.map((id) => fetchJson<HnStory>(`${API}/item/${id}.json`, fetchFn, undefined, opts.timeoutMs)),
    );
    return stories
      .filter((s): s is HnStory => Boolean(s && s.title))
      .map((s, i) => parseHnStory(s, i + 1));
  },
};
