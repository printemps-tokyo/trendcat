import { describe, expect, it } from "vitest";
import { parseHnStory } from "../src/sources/hackernews.js";
import { parseRedditListing } from "../src/sources/reddit.js";
import { parseWikipediaTop, wikiProject, wikiDatePath } from "../src/sources/wikipedia.js";
import { googleNewsUrl } from "../src/sources/googlenews.js";
import { selectSources, ALL_SOURCES } from "../src/sources/index.js";

describe("parseHnStory", () => {
  it("keeps the url or falls back to the HN item link", () => {
    expect(parseHnStory({ title: "A", url: "https://a", score: 12 }, 1)).toEqual({
      rank: 1,
      title: "A",
      url: "https://a",
      score: 12,
    });
    expect(parseHnStory({ title: "Ask HN", id: 42, score: 5 }, 2).url).toBe(
      "https://news.ycombinator.com/item?id=42",
    );
  });
});

describe("parseRedditListing", () => {
  it("builds full permalinks and ranks, honoring the limit", () => {
    const listing = {
      data: {
        children: [
          { data: { title: "One", permalink: "/r/x/1", score: 100 } },
          { data: { title: "Two", url: "https://two", score: 50 } },
          { data: { score: 0 } }, // no title -> skipped
          { data: { title: "Three", permalink: "/r/x/3", score: 10 } },
        ],
      },
    };
    const items = parseRedditListing(listing, 2);
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({ rank: 1, title: "One", url: "https://www.reddit.com/r/x/1", score: 100 });
    expect(items[1]?.url).toBe("https://two");
  });
});

describe("parseWikipediaTop", () => {
  it("drops non-article pages and turns underscores into spaces", () => {
    const data = {
      items: [
        {
          articles: [
            { article: "Main_Page", views: 999 },
            { article: "Special:Search", views: 800 },
            { article: "Climate_change", views: 700 },
            { article: "東京", views: 600 },
          ],
        },
      ],
    };
    const items = parseWikipediaTop(data, 10);
    expect(items.map((i) => i.title)).toEqual(["Climate change", "東京"]);
    expect(items[0]).toEqual({ rank: 1, title: "Climate change", url: undefined, score: 700 });
  });
});

describe("wikipedia helpers", () => {
  it("maps language to project and formats the date path in UTC", () => {
    expect(wikiProject("ja")).toBe("ja.wikipedia");
    expect(wikiProject("en")).toBe("en.wikipedia");
    expect(wikiDatePath(new Date(Date.UTC(2026, 5, 9)))).toBe("2026/06/09");
  });
});

describe("googleNewsUrl", () => {
  it("switches region by language", () => {
    expect(googleNewsUrl("ja")).toContain("ceid=JP:ja");
    expect(googleNewsUrl("en")).toContain("ceid=US:en");
  });
});

describe("selectSources", () => {
  it("resolves ids in order and rejects unknown ones", () => {
    expect(selectSources(["reddit", "hackernews"]).map((s) => s.id)).toEqual(["reddit", "hackernews"]);
    expect(ALL_SOURCES.map((s) => s.id)).toContain("wikipedia");
    expect(() => selectSources(["nope"])).toThrow();
  });
});
