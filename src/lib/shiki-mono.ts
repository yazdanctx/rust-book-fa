import type { ThemeRegistration } from "shiki";

/**
 * Monochrome syntax theme (SPEC §4.2).
 *
 * Structure is carried entirely by tone and weight: keywords take pure white
 * and bold, types and functions sit just below it, variables and constants step
 * down again, strings and attributes further still, and comments and
 * punctuation recede to the muted greys. Read down the ramp below and it is a
 * single value scale from #fff to #78726d.
 *
 * There is no colour in here at all. Red was reserved for keywords, macros and
 * the shell prompt, but a code block is the densest content on the page, and
 * the accent is worth more spent on the chrome around it — the language pip,
 * the copy confirmation, the aside marker — where it still means something.
 *
 * Shiki emits inline styles and cannot read CSS variables, so these are
 * literals; keep them in sync with `global.css`.
 *
 * The background is transparent and the base colour is the page foreground, so
 * the block takes its surface from `.code-block` rather than from here. Shiki
 * writes both into an inline style on the `<pre>`, which would otherwise win
 * over any rule in `global.css`.
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
      ],
      settings: { foreground: "#ffffff" },
    },
    {
      // `println!` appears in nearly every listing, so a macro is the token most
      // likely to repeat inside one block. It sits at the same level as a plain
      // function rather than above it, to keep dense lines even.
      scope: ["entity.name.function.macro", "support.macro"],
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
      // Terminal transcripts. The prompt is the one glyph that tells you a
      // block is something you type into rather than something you compile, so
      // it stays at full white while the command beside it does not.
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
      settings: { foreground: "#ffffff" },
    },
    {
      scope: ["invalid", "invalid.illegal"],
      settings: { foreground: "#ffffff", fontStyle: "underline" },
    },
  ],
};
