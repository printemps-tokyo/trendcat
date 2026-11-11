# trendcat

> Aggregate what's trending now from Hacker News, Lobsters, Reddit, Wikipedia, Hatena, and Google News. Zero-dependency CLI.

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

- Node.js >= 22 (uses the built-in `fetch`)

## Install

Not published to npm yet — install from source:

```bash
git clone https://github.com/printemps-tokyo/trendcat
cd trendcat
npm install && npm run build
npm link   # optional: puts the `trendcat` command on your PATH
```

Then run `trendcat …` (after `npm link`), or `node dist/cli.js …` from the clone.

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
| `--timeout <ms>` | Per-request network timeout in milliseconds | `10000` |
| `--format <md\|json>` | Output format | `md` |
| `-o, --output <file>` | Write to a file | stdout |

## Sources

| Id | Source | How it's fetched |
| --- | --- | --- |
| `hackernews` | Hacker News front page | Official Firebase API |
| `lobsters` | Lobsters hottest stories | Public JSON endpoint (no auth) |
| `reddit` | r/popular top of the day | Public Atom feed (no auth) |
| `wikipedia` | Most-viewed articles (prev. day) | Wikimedia Pageviews REST API |
| `hatena` | Hatena Bookmark hot entries (JP) | Public RSS |
| `googlenews` | Google News top stories | Public RSS |

`--lang ja` (the default) makes the Wikipedia and Google News sources return
Japanese/Japan results; `--lang en` switches them to English/US. The other
sources are global.

If a source fails (network error, rate limit, timeout, ...), trendcat prints
it as `_unavailable_` and still shows the rest. Every request is aborted after
`--timeout` milliseconds (10 seconds by default), so a stalled endpoint cannot
hang the CLI. Reddit blocks its `.json` API for
non-browser clients, so trendcat reads Reddit's public Atom feed instead; that
feed can still rate-limit (`HTTP 429`) under frequent use, which also degrades
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
