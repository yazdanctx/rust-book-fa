import { readFileSync } from "node:fs";
import { toPersianDigits } from "./digits.ts";

/**
 * Parser for `src-fa/SUMMARY.md`, the single source of truth for which pages
 * exist, their order, their nesting and their Farsi titles (SPEC §3).
 */

export type PageKind = "prefix" | "chapter" | "section";

export interface SummaryPage {
  /** Filename without extension, e.g. `ch01-01-installation`. */
  slug: string;
  /** Farsi title, raw — may contain inline `code` spans. */
  title: string;
  /** 0 for prefix links and chapters, 1 for sections within a chapter. */
  depth: number;
  kind: PageKind;
  /** Persian-digit label such as `۱` or `۱.۲`. Absent for prefix links and appendices. */
  number?: string;
  /** Position in reading order, used for prev/next. */
  order: number;
}

export interface SummaryNode extends SummaryPage {
  children: SummaryNode[];
}

const PREFIX_LINK_RE = /^\[([^\]]+)\]\(([^)]+)\)\s*$/;
const LIST_ITEM_RE = /^(\s*)-\s+\[([^\]]+)\]\(([^)]+)\)\s*$/;

/**
 * Appendices are ordinary list items in the Summary, but their titles already
 * carry their own letters ("A - Keywords"), so a derived "۲۲.۱" would be both
 * redundant and wrong.
 */
function isAppendix(slug: string): boolean {
  return slug.startsWith("appendix");
}

export function parseSummary(markdown: string): SummaryPage[] {
  const pages: SummaryPage[] = [];
  let chapterNo = 0;
  let sectionNo = 0;
  let order = 0;

  const lines = markdown.replace(/\r\n/g, "\n").split("\n");

  for (const line of lines) {
    if (line.trim() === "" || line.startsWith("#")) continue;

    const prefix = PREFIX_LINK_RE.exec(line);
    if (prefix) {
      pages.push({
        slug: toSlug(prefix[2]!),
        title: prefix[1]!,
        depth: 0,
        kind: "prefix",
        order: order++,
      });
      continue;
    }

    const item = LIST_ITEM_RE.exec(line);
    if (!item) continue;

    const [, indent = "", title = "", href = ""] = item;
    const depth = Math.min(Math.floor(indent.length / 2), 1);
    const slug = toSlug(href);
    const appendix = isAppendix(slug);

    let number: string | undefined;
    if (depth === 0) {
      if (!appendix) {
        chapterNo++;
        number = toPersianDigits(String(chapterNo));
      }
      sectionNo = 0;
    } else if (!appendix && chapterNo > 0) {
      sectionNo++;
      number = toPersianDigits(`${chapterNo}.${sectionNo}`);
    }

    pages.push({
      slug,
      title,
      depth,
      kind: depth === 0 ? "chapter" : "section",
      number,
      order: order++,
    });
  }

  return pages;
}

function toSlug(href: string): string {
  return href.replace(/\.md$/, "").replace(/^\.\//, "");
}

/** Nests sections under the chapter that precedes them, for sidebar rendering. */
export function toTree(pages: SummaryPage[]): SummaryNode[] {
  const tree: SummaryNode[] = [];
  for (const page of pages) {
    const node: SummaryNode = { ...page, children: [] };
    if (page.depth === 0 || tree.length === 0) {
      tree.push(node);
    } else {
      tree.at(-1)!.children.push(node);
    }
  }
  return tree;
}

/**
 * Renders a Summary title as HTML.
 *
 * Titles are markdown fragments — several contain inline code (the `match`
 * control flow construct, the `use` keyword) — but only backticks and curly
 * quotes appear in practice, so a full markdown pass would be overkill.
 */
export function titleToHtml(title: string): string {
  const escaped = title
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/`([^`]+)`/g, "<code>$1</code>");
}

export function readSummary(path: string): SummaryPage[] {
  return parseSummary(readFileSync(path, "utf8"));
}
