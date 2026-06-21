/**
 * Public API for trendcat.
 *
 * `trendcat` aggregates what is trending now from several public sources
 * (Hacker News, Reddit, Wikipedia, Hatena Bookmark, Google News) into one
 * Markdown or JSON digest. Each source separates its network fetch from a pure
 * parser, and those parsers are exported here so they can be reused and tested
 * without touching the network.
 */

export type { TrendItem, FetchOptions, Source } from "./types.js";

export { parseRss, decodeXmlText } from "./rss.js";
export type { RssItem } from "./rss.js";

export { ALL_SOURCES, selectSources, hackernews, reddit, wikipedia, hatena, googlenews } from "./sources/index.js";
export { parseHnStory } from "./sources/hackernews.js";
export { parseRedditListing } from "./sources/reddit.js";
export { parseWikipediaTop, wikiProject, wikiDatePath } from "./sources/wikipedia.js";
export { googleNewsUrl } from "./sources/googlenews.js";

export { renderMarkdown, renderJson } from "./render.js";
export type { SourceResult } from "./render.js";
