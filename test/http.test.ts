import { describe, expect, it } from "vitest";
import { fetchText, DEFAULT_TIMEOUT_MS } from "../src/http.js";

/** Build a stub fetch that records the request init and returns `body`. */
function stubFetch(body: string, seen: { signal?: AbortSignal | null }): typeof fetch {
  return (async (_url: unknown, init?: RequestInit) => {
    seen.signal = init?.signal;
    return new Response(body, { status: 200 });
  }) as typeof fetch;
}

describe("fetchText timeout", () => {
  it("passes an abort signal to fetch by default", async () => {
    const seen: { signal?: AbortSignal | null } = {};
    await expect(fetchText("https://example.test/", stubFetch("ok", seen))).resolves.toBe("ok");
    expect(seen.signal).toBeInstanceOf(AbortSignal);
    expect(DEFAULT_TIMEOUT_MS).toBe(10_000);
  });

  it("turns a timeout abort into a descriptive error", async () => {
    const timeoutFetch = (async () => {
      throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
    }) as typeof fetch;
    await expect(fetchText("https://slow.test/", timeoutFetch, undefined, 25)).rejects.toThrow(
      "timed out after 25ms for https://slow.test/",
    );
  });

  it("aborts a fetch that never settles on its own", async () => {
    const hangingFetch = ((_url: unknown, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(init.signal?.reason as Error);
        });
      })) as typeof fetch;
    await expect(fetchText("https://hang.test/", hangingFetch, undefined, 20)).rejects.toThrow(
      "timed out after 20ms for https://hang.test/",
    );
  });
});
