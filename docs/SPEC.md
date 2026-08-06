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
    │   ├── rehype-normalize-headings.ts
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
   `{{#include}}` and `{{#rustdoc_include}}` are treated identically.
2. **Map fence attributes** to a Ferris Badge marker and discard the rest.
   `does_not_compile`, `panics`, `not_desired_behavior` become badges;
   `ignore`, `noplayground`, `no_run`, `should_panic`, `test_harness`,
   `editionYYYY` are dropped. The emitted fence keeps only the language
   (`rust`, `console`, `text`, `toml`, `powershell`, `html`, …).
3. **Flatten Listings.** `<Listing number file-name caption>` and the loose
   `<span class="filename">` / `<span class="caption">` markers become plain
   markdown: a filename line above the block, a caption line below it, prefixed
   `لیستینگ ‹number›` with Persian numerals.
4. **Strip `<!-- ignore -->`** markers (mdbook link-check hints). These are
   frequently split across a line break, because the source hard-wraps at 80
   columns — the strip must run on the whole document, not line by line.
5. **Drop the leading title heading.** Every page opens with a heading naming
   the page; the title is supplied by the layout instead (ADR-0005).
6. **Preserve** `<a id="…">` legacy anchors, `<img>` tags with their `class` and
   inline styles, `<figure>`/`<figcaption>` (9 uses), `<kbd>`, tables, and
   reference-style link definitions.

**Fails the whole run, loudly, on any unresolvable include or unknown anchor.**
With 707 directives, silent partial failure is invisible.

Two mdbook behaviours the resolver must match exactly, both found in the data
rather than the documentation:

- **An anchor name can cover several disjoint regions.** In `listing-14-06`,
  `here` opens at line 1, closes at line 7, then reopens at line 11; all regions
  with that name are concatenated in file order. Using only the first match
  yields plausible-looking but wrong code.
- **An out-of-range end line is clamped, not an error.** `Cargo.toml:6:12`
  against an 11-line file is load-bearing in ch20.

Also: `{{#rustdoc_include}}` needs no hidden-line handling — there are zero
`^# ` lines in the listings tree — captions contain `>` from Rust generics, and
one `<Listing>` is nested inside a blockquote.

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

`h1` is the Farsi Summary title. The body's duplicate title heading is already
gone (§2.1 step 5) and `rehype-normalize-headings` shifts the remainder by a
per-document offset so the shallowest lands on `h2` (ADR-0005). Prose column is
`max-w-3xl`, matching yazdan.me.

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

Cross-references are written as **`.html`** targets — mdbook's output filenames
— not `.md`. Of the 244 reference definitions in the prose: 202 point at
`chNN-….html`, 42 are external, and only 7 links anywhere use `.md`. Handling
only `.md` leaves 202 links pointing at pages that do not exist here.

> An earlier draft of this spec claimed "112 inline `.md` links". That count was
> wrong: it included `SUMMARY.md`'s own 111 links, which the resolver excludes.

- `slug.md` / `slug.html` (+ optional `#hash`) → `/slug/#hash`.
- The slug is validated against `SUMMARY.md`. An unrecognised target is left
  untouched and warned about, rather than confidently rewritten.
- Target is an Untranslated Page → the anchor becomes an inline Disabled Link,
  keeping its text. This makes a 404 impossible by construction.
- External links and in-page fragments unchanged.

**Known limitation:** `#fragment` targets are derived from the *English* heading
text. Once a page is translated its heading ids become Farsi, so inbound
fragments go stale and land at the top of the correct page. Fixing this means
updating fragments as pages are translated; no code can infer it.

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
`@font-face` with `font-display: swap`, Regular preloaded. The other seven
weights stay in `fonts/` unreferenced and unshipped.

**Digits.** `PeydaFaNumWeb` is the *FaNum* cut: it maps Latin digit codepoints to
Persian numeral glyphs. So all prose digits display as Persian automatically —
`Figure 4-1` in the HTML renders as `Figure ۴-۱` — which is the desired default
for a Persian book, and makes `toPersianDigits` belt-and-braces for navigation
(it produces genuine Persian codepoints, so copy-paste is correct too).

Two consequences:

- Code keeps Latin digits for free, because it falls through to the mono stack.
- Anything that must stay Latin in prose — version numbers, licence names —
  needs the `.latin` utility class. `dir="ltr"` does **not** help: this is font
  substitution, not bidi.

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
