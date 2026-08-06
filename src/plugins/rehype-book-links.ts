import type { Root, Element } from "hast";
import { visit } from "unist-util-visit";
import { join } from "node:path";
import { readdirSync } from "node:fs";
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

const EN_BOOK = "https://doc.rust-lang.org/book/";

let siteSlugs: Set<string> | undefined;
let upstreamSlugs: Set<string> | undefined;
const warned = new Set<string>();

/** Pages this site publishes — the Summary is the authority. */
function getSiteSlugs(): Set<string> {
  if (!siteSlugs) {
    const summary = readSummary(join(process.cwd(), "src-fa", "SUMMARY.md"));
    siteSlugs = new Set(summary.map((p) => p.slug));
  }
  return siteSlugs;
}

/**
 * Every page of the upstream book, from the vendored English source.
 *
 * Needed to tell a deliberately dropped page apart from a broken link. The
 * appendices and front matter are out of scope for this translation, but the
 * prose still references them 13 times — those readers are better served by the
 * English original than by a 404.
 */
function getUpstreamSlugs(): Set<string> {
  if (!upstreamSlugs) {
    upstreamSlugs = new Set(
      readdirSync(join(process.cwd(), "src-en"))
        .filter((f) => f.endsWith(".md") && f !== "SUMMARY.md")
        .map((f) => f.replace(/\.md$/, "")),
    );
  }
  return upstreamSlugs;
}

export function rehypeBookLinks() {
  return (tree: Root): void => {
    const translated = getTranslatedSlugs();
    const site = getSiteSlugs();
    const upstream = getUpstreamSlugs();

    visit(tree, "element", (node: Element) => {
      if (node.tagName === "a") rewriteAnchor(node, site, upstream, translated);
      else if (node.tagName === "img") rewriteImage(node);
    });
  };
}

function rewriteAnchor(
  node: Element,
  site: Set<string>,
  upstream: Set<string>,
  translated: Set<string>,
): void {
  const href = node.properties?.["href"];
  if (typeof href !== "string" || href === "") return;

  const match = BOOK_LINK_RE.exec(href);
  if (!match) return; // absolute URL, in-page fragment, or something else

  const slug = match[1]!;
  const hash = match[2] ?? "";

  if (!site.has(slug)) {
    // A real page of the book that this translation does not carry (the
    // appendices and front matter): send the reader to the English original,
    // which is more use than a dead link.
    if (upstream.has(slug)) {
      node.properties!["href"] = `${EN_BOOK}${slug}.html${hash}`;
      node.properties!["class"] = "link-en";
      node.properties!["hreflang"] = "en";
      node.properties!["title"] = "این بخش ترجمه نشده — نسخه انگلیسی";
      return;
    }

    // Not a book page at all. Left alone: better an untouched link than a
    // confidently wrong one.
    if (!warned.has(href)) {
      warned.add(href);
      console.warn(
        `[book-links] "${href}" looks like a book link but "${slug}" is not a ` +
          `page of the book — left unchanged.`,
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
