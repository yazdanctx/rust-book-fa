import { getCollection, type CollectionEntry } from "astro:content";
import { readSummary, toTree, type SummaryPage, type SummaryNode } from "./summary.ts";
import { join } from "node:path";
import { existsSync } from "node:fs";

export interface BookPage extends SummaryPage {
  /** False when the `src-fa/` file is empty — see ADR-0002. */
  translated: boolean;
  entry?: CollectionEntry<"book">;
}

export interface BookNode extends BookPage {
  children: BookNode[];
}

const SUMMARY_PATH = join(process.cwd(), "src-fa", "SUMMARY.md");

let cache: BookPage[] | undefined;

/**
 * The book, in reading order, with translation state resolved.
 *
 * The Summary decides which pages exist and in what order; the content
 * collection decides whether each one has been written yet.
 */
export async function getBookPages(): Promise<BookPage[]> {
  if (cache) return cache;

  const summary = readSummary(SUMMARY_PATH);
  const entries = await getCollection("book");
  const byId = new Map(entries.map((e) => [e.id, e]));

  const missing: string[] = [];
  const pages: BookPage[] = summary.map((page) => {
    const entry = byId.get(page.slug);
    if (!entry) missing.push(page.slug);
    return {
      ...page,
      entry,
      translated: Boolean(entry && entry.body && entry.body.trim() !== ""),
    };
  });

  if (missing.length > 0) {
    // Distinguish the two very different causes of "no file". If the files are
    // sitting on disk, the content collection failed to load them — almost
    // always a stale content-layer cache — and telling someone to run
    // `pnpm scaffold` would send them chasing the wrong problem.
    const onDisk = missing.filter((slug) =>
      existsSync(join(process.cwd(), "src-fa", `${slug}.md`)),
    );

    if (onDisk.length === missing.length) {
      throw new Error(
        `The 'book' content collection is empty, but all ${missing.length} ` +
          `page file(s) exist in src-fa/.\n` +
          `This is a stale content-layer cache, not missing content. Fix it with:\n` +
          `  rm -rf .astro && pnpm build\n` +
          `(It usually happens when a dev server was running while ` +
          `src/content.config.ts or src-fa/ changed.)`,
      );
    }

    throw new Error(
      `SUMMARY.md links ${missing.length} page(s) with no file in src-fa/:\n` +
        missing.map((s) => `  ${s}.md`).join("\n") +
        `\nRun \`pnpm scaffold\` to create them.` +
        (onDisk.length > 0
          ? `\n\nNote: ${onDisk.length} of these DO exist on disk but did not ` +
            `load — try \`rm -rf .astro\` as well.`
          : ""),
    );
  }

  const listed = new Set(summary.map((p) => p.slug));
  const unlisted = entries.filter((e) => !listed.has(e.id));
  if (unlisted.length > 0) {
    console.warn(
      `[book] ${unlisted.length} file(s) in src-fa/ are not linked from ` +
        `SUMMARY.md and will not be reachable: ` +
        unlisted.map((e) => `${e.id}.md`).join(", "),
    );
  }

  cache = pages;
  return pages;
}

export async function getBookTree(): Promise<BookNode[]> {
  const pages = await getBookPages();
  return toTree(pages) as BookNode[];
}

/** Only translated pages get routes; the rest render as Disabled Links. */
export async function getTranslatedPages(): Promise<BookPage[]> {
  return (await getBookPages()).filter((p) => p.translated);
}

/**
 * Immediate neighbours in strict Summary order, translated or not (ADR-0006).
 * Untranslated neighbours are shown disabled rather than skipped.
 */
export async function getNeighbours(
  slug: string,
): Promise<{ prev?: BookPage; next?: BookPage }> {
  const pages = await getBookPages();
  const index = pages.findIndex((p) => p.slug === slug);
  if (index === -1) return {};
  return { prev: pages[index - 1], next: pages[index + 1] };
}

export type { SummaryNode };
