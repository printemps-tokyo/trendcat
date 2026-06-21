# trendcat

> Aggregate what's trending now from Hacker News, Reddit, Wikipedia, Hatena, and Google News. Zero-dependency CLI.

[![CI](https://github.com/printemps-tokyo/trendcat/actions/workflows/ci.yml/badge.svg)](https://github.com/printemps-tokyo/trendcat/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

`trendcat` pulls the current top items from several public sources and prints
one combined digest, so you can see what's trending across the web (and Japan)
from your terminal.

```console
$ trendcat --limit 3
# Trending now (2026-06-21 08:13 UTC)

## Hacker News
1. Developers don't understand CORS (155) <https://fosterelli.co/...>

## Wikipedia
1. 大谷翔平 (75,491)

## Hatena Bookmark
1. 男は暮らしに興味がないのか <https://anond.hatelabo.jp/...>
```

It uses only public endpoints that need no API key, has no runtime npm
dependencies, and fetches every source independently so one failure does not
sink the rest.

## Requirements

- Node.js >= 20 (uses the built-in `fetch`)

## Install

```bash
npm install -g @printemps-tokyo/trendcat
# or run once:
npx @printemps-tokyo/trendcat
```

## Usage

```bash
trendcat                          # all sources, 10 items each, Markdown
trendcat --limit 5                # fewer items per source
trendcat --source hackernews,reddit
trendcat --lang en                # Wikipedia + Google News in English/US
trendcat --format json -o trends.json
```

| Option | Description | Default |
| --- | --- | --- |
| `--source <list>` | Comma list of sources | all |
| `--limit <n>` | Max items per source | `10` |
| `--lang <ja\|en>` | Region/language for Wikipedia and Google News | `ja` |
| `--format <md\|json>` | Output format | `md` |
| `-o, --output <file>` | Write to a file | stdout |

## Sources

| Id | Source | How it's fetched |
| --- | --- | --- |
| `hackernews` | Hacker News front page | Official Firebase API |
| `reddit` | r/popular top of the day | Public `.json` (no auth) |
| `wikipedia` | Most-viewed articles (prev. day) | Wikimedia Pageviews REST API |
| `hatena` | Hatena Bookmark hot entries (JP) | Public RSS |
| `googlenews` | Google News top stories | Public RSS |

`--lang ja` (the default) makes the Wikipedia and Google News sources return
Japanese/Japan results; `--lang en` switches them to English/US. The other
sources are global.

If a source fails (network error, rate limit, ...), trendcat prints it as
`_unavailable_` and still shows the rest. Reddit's unauthenticated endpoint in
particular may return `403` from some networks; that is expected and handled
gracefully.

## Notes

- trendcat makes network requests to public endpoints. Respect each service's
  terms of use and rate limits; run it on a sensible schedule, not in a tight
  loop.
- This is the one networked tool in the printemps-tokyo lineup; it still ships
  with zero runtime dependencies.

## Extending

A source is just an object with a `fetchTrends` method that returns normalized
`TrendItem`s. The network call is kept separate from a pure parser, so new
sources are easy to add and test:

```ts
import { parseRedditListing, renderMarkdown } from "@printemps-tokyo/trendcat";

const items = parseRedditListing(listingJson, 10); // pure, no network
```

## License

[MIT](./LICENSE) (c) printemps.tokyo
