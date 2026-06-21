import type { Source } from "../types.js";
import { hackernews } from "./hackernews.js";
import { reddit } from "./reddit.js";
import { wikipedia } from "./wikipedia.js";
import { hatena } from "./hatena.js";
import { googlenews } from "./googlenews.js";

/** Every built-in source, in display order. */
export const ALL_SOURCES: Source[] = [hackernews, reddit, wikipedia, hatena, googlenews];

/** Look up sources by id, preserving the given order and erroring on unknowns. */
export function selectSources(ids: string[]): Source[] {
  return ids.map((id) => {
    const source = ALL_SOURCES.find((s) => s.id === id);
    if (!source) {
      throw new Error(`unknown source "${id}" (available: ${ALL_SOURCES.map((s) => s.id).join(", ")})`);
    }
    return source;
  });
}

export { hackernews, reddit, wikipedia, hatena, googlenews };
