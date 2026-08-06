# Rust Book FA — Specification

A Persian translation of *The Rust Programming Language*, served as a static
Astro site on Vercel, styled to match [yazdan.me](https://yazdan.me). The book is
translated incrementally; untranslated pages appear in navigation as disabled,
labelled links.

Vocabulary in this document is defined in [`../CONTEXT.md`](../CONTEXT.md).
Decisions are recorded in [`adr/`](./adr/).

---

## 1. Repository layout

```
/
├── astro.config.mjs
├── package.json
├── CONTEXT.md
├── LICENSE-MIT              # from upstream
├── LICENSE-APACHE           # from upstream
├── docs/
│   ├── SPEC.md
│   ├── TICKETS.md
│   └── adr/
├── fonts/                   # all 10 Peyda weights (source; only 3 ship)
├── scripts/
│   ├── resolve.ts           # src-en/ + listings tree -> src-en-resolved/
│   └── scaffold.ts          # -> 111 zero-byte files in src-fa/
├── src-en/                  # vendored upstream English source, never modified
├── src-en-resolved/         # generated + committed; the translation worksheet
├── src-fa/                  # the translation. SUMMARY.md + 111 page files
├── public/
│   ├── fonts/               # 3 shipped weights
│   └── img/                 # copied from src-en/img
└── src/                     # Astro code
    ├── content.config.ts
    ├── lib/
    │   ├── summary.ts       # parse SUMMARY.md -> nav tree
    │   ├── digits.ts        # Latin -> Persian-Indic numerals
    │   └── progress.ts      # translation progress
    ├── plugins/
    │   ├── rehype-shift-headings.ts
    │   └── rehype-book-links.ts
    ├── components/
    ├── layouts/
    └── pages/
        ├── index.astro
        ├── 404.astro
        └── [slug].astro
```

`src-en/`, `src-en-resolved/` and `src-fa/` sit **outside** `src/`, so the
content collection must use a glob loader with an explicit `base`.

## 2. Content pipeline

### 2.1 `scripts/resolve.ts` (one-off, local, output committed)

Reads `src-en/*.md`, writes `src-en-resolved/*.md`. Takes the Listings Tree path
as `--listings <path>`, defaulting to `../rust-book`.

Per file, in order:

1. **Resolve Include Directives** (707 total). Three anchor forms must be
   handled:
   - bare — whole file (`{{#include ../listings/…/Cargo.toml}}`)
   - named — `:here` (294 uses), `:all`, `:there`, and ~20 one-off names,
     matched against `// ANCHOR: name` … `// ANCHOR_END: name` comments in the
     target
   - numeric — `:7`, `:3`, `:10` — line selection
   Anchor comment lines themselves are stripped from the emitted code.
   `{{#include}}` and `{{#rustdoc_include}}` are treated identically; the
   rustdoc variant's hidden `#`-prefixed lines are dropped.
2. **Map fence attributes** to a Ferris Badge marker and discard the rest.
   `does_not_compile`, `panics`, `not_desired_behavior` become badges;
   `ignore`, `noplayground`, `no_run`, `should_panic`, `test_harness`,
   `editionYYYY` are dropped. The emitted fence keeps only the language
   (`rust`, `console`, `text`, `toml`, `powershell`, `html`, …).
3. **Flatten Listings.** `<Listing number file-name caption>` and the loose
   `<span class="filename">` / `<span class="caption">` markers become plain
   markdown: a filename line above the block, a caption line below it, prefixed
   `لیستینگ ‹number›` with Persian numerals.
4. **Strip `<!-- ignore -->`** markers (mdbook link-check hints).
5. **Preserve** `<a id="…">` legacy anchors, `<img>` tags with their `class` and
   inline styles, `<figure>`/`<figcaption>` (9 uses), `<kbd>`, tables, and
   reference-style link definitions.

**Fails the whole run, loudly, on any unresolvable include or unknown anchor.**
With 707 directives, silent partial failure is invisible.

`SUMMARY.md` is not processed by this script.

### 2.2 `scripts/scaffold.ts` (re-runnable, strictly additive)

Creates one zero-byte file in `src-fa/` for each of the 111 pages the Summary
links. **Never** writes to a file that already exists — no `--force` flag
exists. Prints `created N, skipped M`. See ADR-0002.

### 2.3 Translating a page

```sh
cp src-en-resolved/ch01-01-installation.md src-fa/ch01-01-installation.md
```

The page is live from that moment, in English, and is translated in place. Alt
text on images and Listing captions are prose and are part of the translation.

## 3. Navigation

`src-fa/SUMMARY.md` is the source of truth: it mirrors the upstream structure
(three ungrouped prefix links — title page, foreword, introduction — then 21
chapter groups with nested sections, then the appendices) with **Farsi titles**.
It is hand-translated once, up front.

- Parsed into a nav tree: `{ title, slug, depth, children }`, max depth 2.
- **Numbering** is derived from nesting (`۱`, `۱.۱`, `۱.۲`) using
  Persian-Indic digits. Prefix links and appendices are unnumbered.
- **Sidebar behaviour** (mdbook-like): all chapter groups listed; sub-sections
  expanded only for the active chapter; active item highlighted. On mobile it is
  a drawer opening from the **right** (RTL).
- A page listed in the Summary but absent from `src-fa/` is a **build error**;
  a file in `src-fa/` absent from the Summary is a **build warning**.

### 3.1 Untranslated pages

A zero-byte page is not routed and renders as a Disabled Link — muted
(`--color-muted-foreground`), `aria-disabled="true"`, with the label
**در دست نگارش** — in all three places it can appear:

- the sidebar
- prev/next pagination (ADR-0006: strict order, never skipped)
- inline cross-references in prose (§4.3)

## 4. Page rendering

Route: `src/pages/[slug].astro`, `getStaticPaths` over translated pages only.

### 4.1 Structure

`h1` is the Farsi Summary title; body headings shift down one level (ADR-0005).
Prose column is `max-w-3xl`, matching yazdan.me.

### 4.2 Code

- Shiki with a **custom monochrome theme** built from the existing palette
  greys — comments and strings differentiated by tone and weight only, no hue.
- `<html dir="rtl" lang="fa">`; `pre, code` forced to `direction: ltr;
  text-align: left`.
- Ferris Badge rendered beside flagged blocks using the three existing SVGs,
  with Farsi `alt`/`title` text.
- Persian numerals are a **presentation transform on nav and captions only** —
  never applied to code, terminal output, or version strings.

### 4.3 Links (`rehype-book-links.ts`)

- `.md` targets (112 inline + 6 reference-style) → `/slug/`, preserving `#hash`.
- Target is an Untranslated Page → rendered as a Disabled Link inline, keeping
  the link text. This makes a 404 impossible by construction.
- External links unchanged.

### 4.4 Images

`src-en/img/**` (28 files, SVG + PNG, including 3 Ferris icons) is copied to
`public/img/`, so the source `src="img/…"` paths need only a leading-slash
rewrite. Inline `width` styles and `class="center"` are preserved.

### 4.5 Per-page footer

- Prev/next (ADR-0006)
- Link to the corresponding English page on `doc.rust-lang.org`
- `<link rel="alternate" hreflang="en">` to the same
- Attribution: translation of the Rust Book, dual MIT / Apache-2.0

## 5. Design system

Ported from yazdan.me, dark-only, Tailwind v4 `@theme`:

| Token | Value |
|---|---|
| `--color-background` / `--color-foreground` | `#000` / `#fff` |
| `--color-card` / `--color-muted` | `#1b1918` |
| `--color-border` / `--color-input` | `#443f3c` |
| `--color-primary` / `--color-primary-foreground` | `#d6d3d1` / `#000` |
| `--color-secondary` / `--color-accent` | `#292624` |
| `--color-muted-foreground` / `--color-ring` | `#78726d` |
| links / visited | `#54a2ff` / `#ac4bff` |
| inline code | `#a36100` |

Also carried over: `.prose blockquote` as a bordered card with a 💡 marker,
`.prose img` bordered and full-width, square corners on `pre`, `scroll-margin-top: 80px`
on headings, non-italic `em`/`cite` (italics read poorly in Persian).

**Fonts**: three Peyda weights only — Regular 400, SemiBold 600, Bold 700 — as
`@font-face` with `font-display: swap`, Regular preloaded. Peyda is Persian-only;
Latin and code fall through to a system/mono stack. The other seven weights stay
in `fonts/` unreferenced and unshipped.

## 6. Site-level

- **Search**: Pagefind, indexed post-build, mounted in the sidebar header.
- **Progress**: `۱۲ از ۱۱۱ صفحه` plus a percentage, on the homepage and in the
  sidebar header, derived from file sizes.
- **Homepage**: book title, short intro, progress, entry link to chapter 1.
- **404**, `sitemap.xml`, `robots.txt`, and OG/Twitter meta.
- No in-page heading ToC — at ~3.6 headings per page it would be an empty rail.

## 7. Explicit non-goals

- No English fallback rendering for untranslated pages.
- No Rust playground / "Run" buttons — code is not executable here.
- No light mode, no theme toggle.
- No MDX (ADR-0003).
- No i18n framework or second locale (ADR-0004).
- No automated upstream sync (ADR-0001).
