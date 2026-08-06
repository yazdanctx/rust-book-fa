import { getBookPages } from "./pages.ts";

export interface Progress {
  translated: number;
  total: number;
  /** Whole percent, 0–100. */
  percent: number;
}

/**
 * Translation progress, derived from the same byte-length test as everything
 * else (ADR-0002). Nothing to maintain: it moves the moment a page gains a line.
 */
export async function getProgress(): Promise<Progress> {
  const pages = await getBookPages();
  const translated = pages.filter((p) => p.translated).length;
  const total = pages.length;
  return {
    translated,
    total,
    percent: total === 0 ? 0 : Math.round((translated / total) * 100),
  };
}
