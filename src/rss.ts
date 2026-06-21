/**
 * A minimal RSS / RDF / Atom item extractor.
 *
 * It is not a full XML parser: it pulls `<item>` (RSS) and `<entry>` (Atom)
 * blocks and reads their `<title>` and link, which is all the feeds trendcat
 * consumes (RSS 2.0 from Google News, RDF/RSS 1.0 from Hatena, and Atom from
 * Reddit) actually need. RSS links are element text (`<link>url</link>`);
 * Atom links are an attribute (`<link href="url"/>`). Keeping this a pure
 * string transform makes it trivial to unit test against fixtures.
 */

export interface RssItem {
  title: string;
  link: string;
}

const BLOCK_RE = /<(item|entry)[\s>][\s\S]*?<\/\1>/gi;
const TITLE_RE = /<title[^>]*>([\s\S]*?)<\/title>/i;
const LINK_TEXT_RE = /<link[^>]*>([\s\S]*?)<\/link>/i;
const LINK_HREF_RE = /<link[^>]*\bhref="([^"]+)"/i;

/** Read a link from an item/entry: RSS element text or Atom `href` attribute. */
function extractLink(block: string): string {
  const text = LINK_TEXT_RE.exec(block);
  if (text && (text[1] as string).trim() !== "") {
    return decodeXmlText(text[1] as string);
  }
  const href = LINK_HREF_RE.exec(block);
  return href ? decodeXmlText(href[1] as string) : "";
}

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
  const blocks = xml.match(BLOCK_RE) ?? [];
  for (const block of blocks) {
    if (items.length >= limit) {
      break;
    }
    const titleMatch = TITLE_RE.exec(block);
    if (!titleMatch) {
      continue;
    }
    const title = decodeXmlText(titleMatch[1] as string);
    if (title !== "") {
      items.push({ title, link: extractLink(block) });
    }
  }
  return items;
}
