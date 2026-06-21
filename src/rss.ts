/**
 * A minimal RSS / RDF item extractor.
 *
 * It is not a full XML parser: it pulls `<item>` blocks and reads their
 * `<title>` and `<link>`, which is all the feeds trendcat consumes (RSS 2.0
 * from Google News and RDF/RSS 1.0 from Hatena) actually need. Keeping it to a
 * pure string transform makes it trivial to unit test against fixtures.
 */

export interface RssItem {
  title: string;
  link: string;
}

const ITEM_RE = /<item[\s>][\s\S]*?<\/item>/gi;
const TITLE_RE = /<title[^>]*>([\s\S]*?)<\/title>/i;
const LINK_RE = /<link[^>]*>([\s\S]*?)<\/link>/i;

/** Strip a CDATA wrapper and decode the handful of XML entities feeds use. */
export function decodeXmlText(raw: string): string {
  let text = raw.trim();
  const cdata = /^<!\[CDATA\[([\s\S]*?)\]\]>$/.exec(text);
  if (cdata) {
    text = cdata[1] as string;
  }
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex: string) => codePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec: string) => codePoint(parseInt(dec, 10)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

/** Safely turn a numeric character reference into its character. */
function codePoint(value: number): string {
  return Number.isFinite(value) && value >= 0 && value <= 0x10ffff ? String.fromCodePoint(value) : "";
}

/** Extract up to `limit` items (title + link) from RSS or RDF feed text. */
export function parseRss(xml: string, limit = Infinity): RssItem[] {
  const items: RssItem[] = [];
  const blocks = xml.match(ITEM_RE) ?? [];
  for (const block of blocks) {
    if (items.length >= limit) {
      break;
    }
    const titleMatch = TITLE_RE.exec(block);
    const linkMatch = LINK_RE.exec(block);
    if (!titleMatch) {
      continue;
    }
    const title = decodeXmlText(titleMatch[1] as string);
    const link = linkMatch ? decodeXmlText(linkMatch[1] as string) : "";
    if (title !== "") {
      items.push({ title, link });
    }
  }
  return items;
}
