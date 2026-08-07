import type { ThemeRegistration } from "shiki";

/**
 * Near-monochrome syntax theme (SPEC §4.2).
 *
 * Structure is carried by tone and weight — comments recede to the muted grey,
 * strings sit one step below the text colour, punctuation drops away — with the
 * brand red reserved for the two things that make a block scannable at a
 * glance: the keywords that give it its shape, and the shell prompt that says a
 * block is a transcript rather than a program. Everything else stays grey, so
 * the red never has to compete with itself.
 *
 * The greys are the existing theme tokens and the reds are `--color-brand` and
 * a lighter step of it. Shiki emits inline styles, so these are literals here
 * and cannot read the CSS variables; keep them in sync with `global.css`.
 *
 * The background is transparent and the base colour is the page foreground:
 * blocks sit on the page itself, bounded by their frame alone. Shiki writes
 * both into an inline style on the `<pre>`, which would otherwise win over any
 * rule in `global.css` — so they are set here rather than overridden there.
 */

/** `--color-brand`. */
const BRAND = "#e5484d";
/** The brand lifted toward white, for tokens that sit inside dense lines. */
const BRAND_LIGHT = "#ff8f8f";
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
      settings: { foreground: BRAND, fontStyle: "bold" },
    },
    {
      scope: [
        "entity.name.function",
        "support.function",
        "meta.function-call",
      ],
      settings: { foreground: "#ffffff" },
    },
    {
      // Macros are the loudest thing in most Rust listings — `println!` appears
      // in nearly every one — so they take the lighter red rather than the full
      // brand, which would put two saturated reds on the same line as `fn`.
      scope: ["entity.name.function.macro", "support.macro"],
      settings: { foreground: BRAND_LIGHT },
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
      settings: { foreground: BRAND, fontStyle: "bold" },
    },
    {
      scope: ["entity.other.attribute-name", "meta.attribute"],
      settings: { foreground: "#b1ada9" },
    },
    {
      // Terminal transcripts. The prompt is the one glyph that tells you a
      // block is something you type into rather than something you compile, so
      // it gets the brand red — the same marker as the chrome bar's cursor.
      //
      // This only reaches ```console blocks, where the grammar really does emit
      // a prompt scope (`punctuation.separator.prompt.shell-session`). The
      // ```cmd and ```powershell grammars tokenise their `>` as an operator —
      // `keyword.operator.js` and `keyword.operator.redirection.powershell` —
      // which is indistinguishable from a genuine redirection, so those prompts
      // stay grey rather than being reached by colouring operators red.
      scope: [
        "meta.prompt",
        "punctuation.definition.prompt",
        "punctuation.separator.prompt",
        "entity.other.prompt",
      ],
      settings: { foreground: BRAND },
    },
    {
      scope: ["invalid", "invalid.illegal"],
      settings: { foreground: "#ffffff", fontStyle: "underline" },
    },
  ],
};
