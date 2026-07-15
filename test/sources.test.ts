import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseHnStory } from "../src/sources/hackernews.js";
import { parseLobstersStory, lobsters, type LobstersStory } from "../src/sources/lobsters.js";
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

describe("lobsters", () => {
  const fixturePath = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "lobsters-hottest.json");
  const fixtureText = readFileSync(fixturePath, "utf8");
  const fixture = JSON.parse(fixtureText) as [LobstersStory, LobstersStory, LobstersStory];

  it("parses a story and falls back to the discussion page for text posts", () => {
    expect(parseLobstersStory(fixture[0], 1)).toEqual({
      rank: 1,
      title: "A tiny allocator in 200 lines",
      url: "https://example.com/tiny-allocator",
      score: 42,
    });
    expect(parseLobstersStory(fixture[1], 2).url).toBe(
      "https://lobste.rs/s/def456/what_are_you_working_on_this_week",
    );
    expect(parseLobstersStory({}, 3)).toEqual({ rank: 3, title: "(untitled)", url: undefined, score: undefined });
  });

  it("fetches, limits, and ranks stories from the hottest feed", async () => {
    const fetchFn = (async (url: unknown) => {
      expect(String(url)).toBe("https://lobste.rs/hottest.json");
      return new Response(fixtureText, { status: 200 });
    }) as typeof fetch;
    const items = await lobsters.fetchTrends({ limit: 2, lang: "en", fetchFn });
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.rank)).toEqual([1, 2]);
    expect(items[1]?.title).toBe("What are you working on this week?");
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
