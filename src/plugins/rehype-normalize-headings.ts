import type { Root, Element } from "hast";
import { visit } from "unist-util-visit";

/**
 * Normalizes body headings so the shallowest one becomes `h2` (ADR-0005).
 *
 * The layout supplies the page's single `h1` from the Summary title, so bodies
 * must start at `h2`. A fixed +1 shift will not do it: source pages open at
 * inconsistent levels (26 at `h1`, 85 at `h2`, one at `h3`), so shifting every
 * page equally would leave an `h1 → h3` gap on the majority of them. Deriving
 * the offset per document keeps the relative hierarchy intact and lands the top
 * level on `h2` regardless of what the file happens to use.
 *
 * Runs after Astro's slug plugin, so heading ids are already assigned and
 * survive the tag change — in-page anchors keep working.
 */
export function rehypeNormalizeHeadings() {
  return (tree: Root): void => {
    const headings: Element[] = [];
    let shallowest = 6;

    visit(tree, "element", (node: Element) => {
      const match = /^h([1-6])$/.exec(node.tagName);
      if (!match) return;
      headings.push(node);
      shallowest = Math.min(shallowest, Number(match[1]));
    });

    if (headings.length === 0) return;

    const offset = 2 - shallowest;
    if (offset === 0) return;

    for (const node of headings) {
      const level = Number(/^h([1-6])$/.exec(node.tagName)![1]);
      node.tagName = `h${Math.min(Math.max(level + offset, 2), 6)}`;
    }
  };
}
