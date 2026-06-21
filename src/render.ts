import type { TrendItem } from "./types.js";

/** One source's results (or the error that prevented collecting them). */
export interface SourceResult {
  id: string;
  label: string;
  items: TrendItem[];
  error?: string;
}

function formatScore(score: number | undefined): string {
  return score === undefined ? "" : ` (${score.toLocaleString("en-US")})`;
}

/** Render collected results as a Markdown digest. */
export function renderMarkdown(results: SourceResult[], heading: string): string {
  const lines: string[] = [`# ${heading}`, ""];
  for (const result of results) {
    lines.push(`## ${result.label}`);
    if (result.error) {
      lines.push(`_unavailable: ${result.error}_`, "");
      continue;
    }
    if (result.items.length === 0) {
      lines.push("_no items_", "");
      continue;
    }
    for (const item of result.items) {
      const link = item.url ? ` <${item.url}>` : "";
      lines.push(`${item.rank}. ${item.title}${formatScore(item.score)}${link}`);
    }
    lines.push("");
  }
  return lines.join("\n").replace(/\n+$/, "\n");
}

/** Render collected results as JSON. */
export function renderJson(results: SourceResult[], heading: string): string {
  return (
    JSON.stringify(
      {
        heading,
        sources: results.map((r) => ({
          id: r.id,
          label: r.label,
          ...(r.error ? { error: r.error } : { items: r.items }),
        })),
      },
      null,
      2,
    ) + "\n"
  );
}
