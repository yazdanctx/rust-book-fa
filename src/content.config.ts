import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

/**
 * The Farsi book content.
 *
 * `src-fa/` sits outside `src/`, so the loader needs an explicit base. Entry
 * ids are the mdbook slug (filename without extension), which is also the URL
 * path — see ADR-0004.
 *
 * Untranslated pages are zero-byte files and are loaded like any other entry;
 * they are filtered out at the routing layer, not here, because the sidebar
 * needs to know they exist in order to disable them.
 */
const book = defineCollection({
  loader: glob({
    pattern: ["*.md", "!SUMMARY.md"],
    base: "./src-fa",
    generateId: ({ entry }) => entry.replace(/\.md$/, ""),
  }),
});

export const collections = { book };
