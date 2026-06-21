import { describe, expect, it } from "vitest";
import { renderMarkdown, renderJson, type SourceResult } from "../src/render.js";

const results: SourceResult[] = [
  {
    id: "hackernews",
    label: "Hacker News",
    items: [
      { rank: 1, title: "A cool project", url: "https://a", score: 1234 },
      { rank: 2, title: "Another", score: 50 },
    ],
  },
  { id: "reddit", label: "Reddit", items: [], error: "HTTP 429 for ..." },
];

describe("renderMarkdown", () => {
  it("formats items with score and link, and notes failures", () => {
    const md = renderMarkdown(results, "Trending now");
    expect(md).toContain("# Trending now");
    expect(md).toContain("## Hacker News");
    expect(md).toContain("1. A cool project (1,234) <https://a>");
    expect(md).toContain("2. Another (50)");
    expect(md).toContain("## Reddit");
    expect(md).toContain("_unavailable: HTTP 429 for ..._");
  });
});

describe("renderJson", () => {
  it("includes items for ok sources and error for failed ones", () => {
    const parsed = JSON.parse(renderJson(results, "Trending now"));
    expect(parsed.heading).toBe("Trending now");
    expect(parsed.sources[0].items).toHaveLength(2);
    expect(parsed.sources[1].error).toContain("429");
    expect(parsed.sources[1].items).toBeUndefined();
  });
});
