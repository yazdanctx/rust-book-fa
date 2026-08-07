import type { Root, Element } from "hast";
import { visit, SKIP } from "unist-util-visit";

/**
 * Wraps every code block in a positioning context and adds a copy button.
 *
 * Done here rather than in client script so the button is in the HTML the
 * server ships: no wrapper appears after hydration, so the block cannot shift
 * once the page has painted. The click handler lives in `BaseLayout.astro`;
 * this only emits the markup it binds to.
 *
 * The wrapper is also what makes the block scrollable in isolation — the
 * `<pre>` scrolls horizontally inside it while the button stays put.
 *
 * Matches bare `<pre>` rather than `.astro-code`, so it does not depend on
 * whether Astro's Shiki pass has already run when this plugin is reached.
 */

const COPY_LABEL = "کپی کد";
const COPY_TEXT = "کپی";

export function rehypeCodeCopy() {
  return (tree: Root): void => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "pre" || parent === undefined || index === undefined)
        return;

      const wrapper: Element = {
        type: "element",
        tagName: "div",
        properties: { className: ["code-block"] },
        children: [node, copyButton()],
      };

      parent.children[index] = wrapper;

      // The wrapper's only element child is the `<pre>` just handled, so
      // descending into it would be wasted work — and re-wrapping is only
      // avoided because this skips.
      return [SKIP, index + 1];
    });
  };
}

function copyButton(): Element {
  return {
    type: "element",
    tagName: "button",
    properties: {
      type: "button",
      className: ["code-copy"],
      "data-code-copy": "",
      // Chrome-injected UI text, not part of the book: keep it out of search.
      "data-pagefind-ignore": "all",
      "aria-label": COPY_LABEL,
      title: COPY_LABEL,
    },
    children: [
      {
        type: "element",
        tagName: "span",
        properties: { className: ["code-copy-text"] },
        children: [{ type: "text", value: COPY_TEXT }],
      },
    ],
  };
}
