import { describe, expect, it } from "vitest";
import { parseRss, decodeXmlText } from "../src/rss.js";

describe("decodeXmlText", () => {
  it("unwraps CDATA and decodes entities", () => {
    expect(decodeXmlText("<![CDATA[Tom & Jerry]]>")).toBe("Tom & Jerry");
    expect(decodeXmlText("A &amp; B &lt;tag&gt; &#39;q&#39;")).toBe("A & B <tag> 'q'");
  });

  it("decodes decimal and hex numeric character references", () => {
    // &#x7537; is 男 (U+7537); &#26997; is 極 (U+6975).
    expect(decodeXmlText("&#x7537;と&#26997;")).toBe("男と極");
  });
});

describe("parseRss", () => {
  const rss = `<?xml version="1.0"?>
  <rss><channel>
    <item><title>First &amp; Best</title><link>https://example.com/1</link></item>
    <item><title><![CDATA[Second]]></title><link>https://example.com/2</link></item>
    <item><title>Third</title><link>https://example.com/3</link></item>
  </channel></rss>`;

  it("extracts titles and links in order", () => {
    const items = parseRss(rss);
    expect(items).toEqual([
      { title: "First & Best", link: "https://example.com/1" },
      { title: "Second", link: "https://example.com/2" },
      { title: "Third", link: "https://example.com/3" },
    ]);
  });

  it("honors the limit", () => {
    expect(parseRss(rss, 2)).toHaveLength(2);
  });

  it("parses RDF/RSS 1.0 items the same way", () => {
    const rdf = `<rdf:RDF><item rdf:about="https://h/1"><title>Hot Entry</title><link>https://h/1</link></item></rdf:RDF>`;
    expect(parseRss(rdf)).toEqual([{ title: "Hot Entry", link: "https://h/1" }]);
  });
});
