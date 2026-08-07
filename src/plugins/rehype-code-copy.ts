import type { Root, Element } from "hast";
import { visit, SKIP } from "unist-util-visit";

/**
 * Frames every code block as a terminal window: a wrapper, a chrome bar naming
 * the language, and a copy button.
 *
 * Done here rather than in client script so the chrome is in the HTML the
 * server ships: nothing appears after hydration, so the block cannot shift once
 * the page has painted. The click handler lives in `BaseLayout.astro`; this
 * only emits the markup it binds to.
 *
 * The wrapper is also what makes the block scrollable in isolation — the
 * `<pre>` scrolls horizontally inside it while the bar stays put.
 *
 * Matches bare `<pre>` rather than `.astro-code`, so it does not depend on
 * whether Astro's Shiki pass has already run when this plugin is reached. The
 * language label does depend on it: Shiki writes `data-language`, and a block
 * that never reached it falls back to a generic label rather than an empty bar.
 */

const COPY_LABEL = "کپی کد";
const COPY_TEXT = "کپی";
const DEFAULT_LANG = "text";

export function rehypeCodeCopy() {
  return (tree: Root): void => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "pre" || parent === undefined || index === undefined)
        return;

      const wrapper: Element = {
        type: "element",
        tagName: "div",
        properties: { className: ["code-block"] },
        children: [chromeBar(language(node)), node],
      };

      parent.children[index] = wrapper;

      // The wrapper's only element child of interest is the `<pre>` just
      // handled, so descending into it would be wasted work — and re-wrapping is
      // only avoided because this skips.
      return [SKIP, index + 1];
    });
  };
}

function language(pre: Element): string {
  const value = pre.properties?.["dataLanguage"];
  return typeof value === "string" && value.length > 0 ? value : DEFAULT_LANG;
}

function chromeBar(lang: string): Element {
  return {
    type: "element",
    tagName: "div",
    // Chrome, not content: keep the whole bar out of the search index.
    properties: { className: ["code-bar"], "data-pagefind-ignore": "all" },
    children: [
      {
        type: "element",
        tagName: "span",
        properties: { className: ["code-lang"] },
        children: [{ type: "text", value: lang }],
      },
      copyButton(),
    ],
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
