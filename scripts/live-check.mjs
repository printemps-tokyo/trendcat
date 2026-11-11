#!/usr/bin/env node
/* global process, console */
// Live check: run the built CLI against the real sources and fail when one of
// them stops returning items. The unit tests stub the network, so they cannot
// notice a feed that moved or changed shape; this does.
//
// HTTP 403, 429 and 5xx are reported but do not fail the run: they say the
// source refused or could not serve this runner right now, not that the
// format changed. Anything else (a 404, a parse error, zero items) fails.
//
// Usage: npm run build && node scripts/live-check.mjs
import { execFileSync } from "node:child_process";

const runs = [
  { lang: "ja", sources: null },
  { lang: "en", sources: "wikipedia,googlenews" },
];
const transient = /^HTTP (403|429|5\d\d)\b/;

let failed = 0;
const rows = [];
for (const run of runs) {
  const args = ["dist/cli.js", "--format", "json", "--limit", "3", "--lang", run.lang];
  if (run.sources) args.push("--source", run.sources);
  let out;
  try {
    out = execFileSync(process.execPath, args, { encoding: "utf8" });
  } catch (err) {
    // The CLI exits 1 only when every source failed; its JSON is still on stdout.
    out = err.stdout ?? "";
  }
  let parsed;
  try {
    parsed = JSON.parse(out);
  } catch {
    console.error(`lang=${run.lang}: the CLI did not print JSON`);
    process.exit(1);
  }
  for (const s of parsed.sources) {
    const n = s.items?.length ?? 0;
    let status;
    if (s.error) {
      status = transient.test(s.error) ? "warn" : "FAIL";
    } else {
      status = n > 0 ? "ok" : "FAIL";
    }
    if (status === "FAIL") failed++;
    rows.push(`| ${s.id} | ${run.lang} | ${status} | ${n} | ${(s.error ?? "").replaceAll("|", "\\|")} |`);
  }
}

const table = ["| Source | Lang | Status | Items | Error |", "| --- | --- | --- | --- | --- |", ...rows].join("\n");
console.log(table);
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFileSync } = await import("node:fs");
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## trendcat live check\n\n${table}\n`);
}
if (failed > 0) {
  console.error(`\n${failed} source(s) failed`);
  process.exit(1);
}
