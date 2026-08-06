import type { Root, Element } from "hast";
import { visit } from "unist-util-visit";
import { join } from "node:path";
import { getTranslatedSlugs } from "../lib/translated.ts";
import { readSummary } from "../lib/summary.ts";

/**
 * Rewrites the book's own relative URLs (SPEC §4.3).
 *
 * Cross-references in the prose are overwhelmingly written as **`.html`**
 * targets — mdbook's output filenames — not `.md`: 202 of the 244 reference
 * definitions look like `ch03-02-data-types.html#storing-lists`. Only 7 use
 * `.md`. Both forms must be handled; matching only `.md` leaves 202 links
 * pointing at pages that do not exist on this site.
 *
 * A link whose target is an Untranslated Page becomes an inline Disabled Link
 * rather than a dead href, which makes a cross-page 404 impossible by
 * construction rather than by discipline. External links, in-page fragments and
 * unrecognised targets are left exactly as they are.
 */

const UNTRANSLATED = "در دست نگارش";

/** A bare `slug.md` or `slug.html`, optionally with a `#fragment`. */
const BOOK_LINK_RE = /^([A-Za-z0-9._-]+)\.(?:md|html)(#.*)?$/;

let knownSlugs: Set<string> | undefined;
const warned = new Set<string>();

function getKnownSlugs(): Set<string> {
  if (!knownSlugs) {
    const summary = readSummary(join(process.cwd(), "src-fa", "SUMMARY.md"));
    knownSlugs = new Set(summary.map((p) => p.slug));
  }
  return knownSlugs;
}

export function rehypeBookLinks() {
  return (tree: Root): void => {
    const translated = getTranslatedSlugs();
    const known = getKnownSlugs();

    visit(tree, "element", (node: Element) => {
      if (node.tagName === "a") rewriteAnchor(node, known, translated);
      else if (node.tagName === "img") rewriteImage(node);
    });
  };
}

function rewriteAnchor(
  node: Element,
  known: Set<string>,
  translated: Set<string>,
): void {
  const href = node.properties?.["href"];
  if (typeof href !== "string" || href === "") return;

  const match = BOOK_LINK_RE.exec(href);
  if (!match) return; // absolute URL, in-page fragment, or something else

  const slug = match[1]!;
  const hash = match[2] ?? "";

  // Anything that is not a page of this book is left alone: better an untouched
  // link than a confidently wrong one.
  if (!known.has(slug)) {
    if (!warned.has(href)) {
      warned.add(href);
      console.warn(
        `[book-links] "${href}" looks like a book link but "${slug}" is not a ` +
          `page in SUMMARY.md — left unchanged.`,
      );
    }
    return;
  }

  if (translated.has(slug)) {
    node.properties!["href"] = `/${slug}/${hash}`;
    return;
  }

  // Becomes a disabled span in place, keeping its children so the sentence
  // still reads correctly.
  node.tagName = "span";
  node.properties = {
    class: "link-todo",
    title: UNTRANSLATED,
    "aria-disabled": "true",
    "data-slug": slug,
  };
}

/**
 * Markdown-syntax images (`![alt](img/x.svg)`) that a translator might add.
 *
 * The 28 images inherited from upstream are raw HTML tags, which the markdown
 * pipeline keeps as opaque `raw` nodes that this plugin cannot see — those are
 * rewritten in `resolve.ts` instead. This is the safety net for the other form.
 */
function rewriteImage(node: Element): void {
  const src = node.properties?.["src"];
  if (typeof src !== "string" || !src.startsWith("img/")) return;
  node.properties!["src"] = `/${src}`;
}
