import type { FetchOptions, Source, TrendItem } from "../types.js";
import { fetchJson } from "../http.js";

const API = "https://lobste.rs/hottest.json";

/** The shape of a Lobsters story we care about. */
export interface LobstersStory {
  title?: string;
  url?: string;
  score?: number;
  comment_count?: number;
  comments_url?: string;
  short_id_url?: string;
}

/** Convert a Lobsters story into a normalized trend item (pure). Text-only
 * submissions have an empty `url`, so fall back to the discussion page. */
export function parseLobstersStory(story: LobstersStory, rank: number): TrendItem {
  return {
    rank,
    title: story.title ?? "(untitled)",
    url: story.url || story.comments_url || story.short_id_url || undefined,
    score: story.score,
  };
}

/** Lobsters hottest stories via the public keyless JSON endpoint. */
export const lobsters: Source = {
  id: "lobsters",
  label: "Lobsters",
  async fetchTrends(opts: FetchOptions): Promise<TrendItem[]> {
    const fetchFn = opts.fetchFn ?? fetch;
    const stories = await fetchJson<LobstersStory[]>(API, fetchFn, undefined, opts.timeoutMs);
    return stories
      .filter((s): s is LobstersStory => Boolean(s && s.title))
      .slice(0, opts.limit)
      .map((s, i) => parseLobstersStory(s, i + 1));
  },
};
