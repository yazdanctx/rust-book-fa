import type { ThemeRegistration } from "shiki";

/**
 * Monochrome syntax theme (SPEC §4.2).
 *
 * The site palette has no hue available for code, so structure is carried by
 * tone and weight instead: comments recede to the muted grey, strings sit one
 * step below the text colour, and keywords take the full white plus bold. The
 * greys are the existing theme tokens, not new values.
 *
 * The background is transparent and the base colour is the page foreground:
 * blocks sit on the page itself, bounded by their border alone. Shiki writes
 * both into an inline style on the `<pre>`, which would otherwise win over any
 * rule in `global.css` — so they are set here rather than overridden there.
 */
export const shikiMono: ThemeRegistration = {
  name: "mono",
  type: "dark",
  colors: {
    "editor.foreground": "#ffffff",
    "editor.background": "#00000000",
  },
  fg: "#ffffff",
  bg: "#00000000",
  settings: [
    {
      scope: ["comment", "punctuation.definition.comment", "string.comment"],
      settings: { foreground: "#78726d" },
    },
    {
      scope: [
        "string",
        "string.quoted",
        "constant.character",
        "constant.other.symbol",
        "meta.attribute string",
      ],
      settings: { foreground: "#b1ada9" },
    },
    {
      scope: [
        "keyword",
        "keyword.control",
        "keyword.operator.new",
        "storage",
        "storage.type",
        "storage.modifier",
        "variable.language",
        "keyword.other.rust",
      ],
      settings: { foreground: "#ffffff", fontStyle: "bold" },
    },
    {
      scope: [
        "entity.name.function",
        "support.function",
        "meta.function-call",
        "entity.name.function.macro",
      ],
      settings: { foreground: "#ffffff" },
    },
    {
      scope: [
        "entity.name.type",
        "entity.name.class",
        "entity.name.struct",
        "entity.name.enum",
        "entity.name.trait",
        "entity.name.namespace",
        "support.type",
        "support.class",
      ],
      settings: { foreground: "#f5f5f4" },
    },
    {
      scope: [
        "constant.numeric",
        "constant.language",
        "constant.other",
        "variable.other.constant",
      ],
      settings: { foreground: "#d6d3d1" },
    },
    {
      scope: ["variable", "variable.other", "variable.parameter"],
      settings: { foreground: "#e7e5e4" },
    },
    {
      scope: [
        "punctuation",
        "punctuation.definition",
        "punctuation.separator",
        "punctuation.terminator",
        "keyword.operator",
        "meta.brace",
      ],
      settings: { foreground: "#8f8985" },
    },
    {
      scope: ["entity.name.tag", "meta.tag"],
      settings: { foreground: "#ffffff", fontStyle: "bold" },
    },
    {
      scope: ["entity.other.attribute-name", "meta.attribute"],
      settings: { foreground: "#b1ada9" },
    },
    {
      // Terminal transcripts: keep the prompt visible but quiet.
      scope: ["meta.prompt", "punctuation.definition.prompt"],
      settings: { foreground: "#78726d" },
    },
    {
      scope: ["invalid", "invalid.illegal"],
      settings: { foreground: "#ffffff", fontStyle: "underline" },
    },
  ],
};
