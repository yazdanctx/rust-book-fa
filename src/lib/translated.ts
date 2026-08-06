import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Slugs whose `src-fa/` file has content — the byte-length test from ADR-0002.
 *
 * Read straight from the filesystem rather than the content collection, because
 * the rehype plugin that needs this runs inside the markdown pipeline, where
 * `getCollection` is not available. Recomputed on every call: a page can gain
 * its first line of content while the dev server is running, and a cached set
 * would keep rendering its inbound links as disabled.
 */
export function getTranslatedSlugs(dir = join(process.cwd(), "src-fa")): Set<string> {
  const slugs = new Set<string>();
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".md") || file === "SUMMARY.md") continue;
    if (statSync(join(dir, file)).size > 0) {
      slugs.add(file.replace(/\.md$/, ""));
    }
  }
  return slugs;
}
