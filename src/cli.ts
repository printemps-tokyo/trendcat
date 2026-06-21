#!/usr/bin/env node
import { parseArgs } from "node:util";
import { readFile, writeFile } from "node:fs/promises";

import { ALL_SOURCES, selectSources } from "./sources/index.js";
import { renderJson, renderMarkdown, type SourceResult } from "./render.js";
import type { FetchOptions } from "./types.js";

const HELP = `trendcat - aggregate what's trending now from public sources

Usage:
  trendcat [options]

Collects trending items from Hacker News, Reddit, Wikipedia (most-viewed),
Hatena Bookmark, and Google News, and prints a Markdown or JSON digest. Each
source is fetched independently; if one fails, the others still appear.

Options:
  --source <list>   Comma list of sources (default: all)
                    available: ${ALL_SOURCES.map((s) => s.id).join(", ")}
  --limit <n>       Max items per source (default: 10)
  --lang <ja|en>    Region/language for Wikipedia and Google News (default: ja)
  --format <md|json>  Output format (default: md)
  -o, --output <file> Write to a file (default: stdout)
  -h, --help        Show this help
  -v, --version     Show version

Note: trendcat makes network requests to public endpoints. Respect each
service's terms of use and rate limits.
`;

async function readVersion(): Promise<string> {
  const { fileURLToPath } = await import("node:url");
  const { join, dirname } = await import("node:path");
  const here = dirname(fileURLToPath(import.meta.url));
  try {
    const raw = await readFile(join(here, "..", "package.json"), "utf8");
    return (JSON.parse(raw) as { version: string }).version;
  } catch {
    return "0.0.0";
  }
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  if (argv.includes("-h") || argv.includes("--help")) {
    process.stdout.write(HELP);
    return 0;
  }
  if (argv.includes("-v") || argv.includes("--version")) {
    process.stdout.write((await readVersion()) + "\n");
    return 0;
  }

  let values;
  try {
    values = parseArgs({
      args: argv,
      allowPositionals: false,
      options: {
        source: { type: "string" },
        limit: { type: "string" },
        lang: { type: "string" },
        format: { type: "string" },
        output: { type: "string", short: "o" },
      },
    }).values;
  } catch (err) {
    process.stderr.write(`error: ${(err as Error).message}\n`);
    return 1;
  }

  const limit = values.limit ? Number(values.limit) : 10;
  if (!Number.isInteger(limit) || limit < 1) {
    process.stderr.write(`error: --limit must be a positive integer\n`);
    return 1;
  }
  const lang = values.lang ?? "ja";
  const format = values.format ?? "md";
  if (format !== "md" && format !== "json") {
    process.stderr.write(`error: --format must be md or json\n`);
    return 1;
  }

  let sources;
  try {
    sources = values.source ? selectSources(values.source.split(",").map((s) => s.trim())) : ALL_SOURCES;
  } catch (err) {
    process.stderr.write(`error: ${(err as Error).message}\n`);
    return 1;
  }

  const opts: FetchOptions = { limit, lang };
  const results: SourceResult[] = await Promise.all(
    sources.map(async (source): Promise<SourceResult> => {
      try {
        return { id: source.id, label: source.label, items: await source.fetchTrends(opts) };
      } catch (err) {
        return { id: source.id, label: source.label, items: [], error: (err as Error).message };
      }
    }),
  );

  const heading = `Trending now (${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC)`;
  const output = format === "json" ? renderJson(results, heading) : renderMarkdown(results, heading);

  if (values.output) {
    try {
      await writeFile(values.output, output, "utf8");
    } catch (err) {
      process.stderr.write(`error: cannot write "${values.output}": ${(err as Error).message}\n`);
      return 1;
    }
    process.stderr.write(`trendcat: wrote ${values.output}\n`);
  } else {
    process.stdout.write(output);
  }

  // A non-zero exit only if every source failed.
  return results.every((r) => r.error) ? 1 : 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err: unknown) => {
    process.stderr.write(`error: ${(err as Error).message}\n`);
    process.exitCode = 1;
  });
