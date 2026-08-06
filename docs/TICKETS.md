# Tickets

Derived from [`SPEC.md`](./SPEC.md). Dependency order; T1–T6 are the critical
path to a first rendered page.

---

## T1 — Astro project scaffold

**Depends on:** —

Initialise the Astro project at the repo root. `output: 'static'`,
`@astrojs/vercel` adapter, Tailwind v4 via the Vite plugin, TypeScript strict.
Add `.gitignore` (`node_modules`, `dist`, `.astro`, `.vercel`). Copy
`LICENSE-MIT` and `LICENSE-APACHE` from the upstream book. `package.json`
scripts: `dev`, `build`, `preview`, `resolve`, `scaffold`.

**Done when:** `pnpm build` produces an empty static site with no serverless
functions in the output.

---

## T2 — Design system and fonts

**Depends on:** T1

Port the yazdan.me tokens from SPEC §5 into a Tailwind v4 `@theme` block. Copy
Peyda Regular/SemiBold/Bold into `public/fonts/` and declare `@font-face` with
`font-display: swap`; preload Regular. Base layout with `<html dir="rtl"
lang="fa">`, `max-w-3xl` prose column, and the `[dir=rtl] pre, code { direction:
ltr; text-align: left }` rule. Port the blockquote / image / `pre` / heading
scroll-margin / non-italic-`em` prose rules.

**Done when:** a hardcoded sample page with Persian prose and a Rust code block
renders with correct RTL prose, LTR code, and no font flash of Latin fallback.

---

## T3 — `scripts/resolve.ts`

**Depends on:** T1

Implement SPEC §2.1. Takes `--listings <path>` (default `../rust-book`). Handles
all three anchor forms, drops rustdoc hidden lines, maps fence attributes to
Ferris markers, flattens `<Listing>` and the filename/caption spans, strips
`<!-- ignore -->`. Hard-fails on any unresolvable include.

**Done when:** all 111 files are written to `src-en-resolved/` and
`grep -r '{{#' src-en-resolved/` returns nothing. Spot-check
`ch02-00-guessing-game-tutorial.md` (the largest, 40 KB, heaviest listing user)
and `ch01-03-hello-cargo.md` against the published English book.

---

## T4 — `scripts/scaffold.ts`

**Depends on:** T3

Implement SPEC §2.2 — 111 zero-byte files in `src-fa/`, strictly additive, no
force flag, prints `created N, skipped M`.

**Done when:** first run reports `created 111, skipped 0`; a second run reports
`created 0, skipped 111` and leaves mtimes untouched.

---

## T5 — Farsi `SUMMARY.md`

**Depends on:** T4

Translate all 111 titles from `src-en/SUMMARY.md` into `src-fa/SUMMARY.md`,
preserving the exact structure: three ungrouped prefix links, 21 chapter groups
with nested sections, then appendices. Filenames and link targets unchanged.
Establish Farsi terminology for the recurring Rust vocabulary (ownership,
borrowing, trait, lifetime, crate…) — these choices propagate through the whole
book, so record them in `CONTEXT.md` as they settle.

**Done when:** every link target exists in `src-fa/`, and every `src-fa/` page
is linked exactly once.

---

## T6 — Content collection, Summary parser, and the page route

**Depends on:** T2, T5

- `src/content.config.ts`: glob loader over `src-fa/` with explicit `base`,
  excluding `SUMMARY.md`.
- `src/lib/summary.ts`: parse the Summary into `{ title, slug, depth, children }`
  with derived numbering; error on a Summary link missing from `src-fa/`, warn on
  an unlisted file.
- `src/lib/digits.ts`: Latin → Persian-Indic numerals.
- `src/pages/[slug].astro`: `getStaticPaths` over translated pages only; `h1`
  from the Summary; `rehype-normalize-headings` shifting body headings by a
  per-document offset so the shallowest lands on `h2`.

**Done when:** a page translated by hand-copying one file from
`src-en-resolved/` renders at its slug with the Farsi Summary title as `h1`, and
the other 110 pages build no routes.

---

## T7 — Sidebar

**Depends on:** T6

mdbook-style sidebar per SPEC §3: all chapter groups, sub-sections expanded for
the active chapter only, active item highlighted, Persian numbering. Untranslated
entries render as Disabled Links labelled **در دست نگارش** with
`aria-disabled="true"`. Mobile drawer opening from the right.

**Done when:** keyboard navigation skips disabled entries, and the sidebar is
usable at 375 px wide.

---

## T8 — Code blocks: monochrome Shiki + Ferris badges

**Depends on:** T6

Custom monochrome Shiki theme from the palette greys (SPEC §4.2). Render the
Ferris Badge markers emitted by T3 as the three existing SVGs with Farsi
`alt`/`title`. Verify the languages actually present: `rust`, `console`, `text`,
`toml`, `powershell`, `html`, `cmd`, `bash`, `json`.

**Done when:** a `rust,ignore,does_not_compile` block shows the correct Ferris
icon, and comments/strings remain visually distinguishable from code.

---

## T9 — `rehype-book-links.ts`

**Depends on:** T6

Rewrite `.md` link targets to `/slug/` preserving hashes, for both the 112 inline
and 6 reference-style links. Targets that are Untranslated Pages become inline
Disabled Links keeping their text. External links untouched. Preserve `<a id>`
legacy anchors.

**Done when:** across a fully-translated build, no internal link 404s and no
`.md` remains in any rendered `href`.

---

## T10 — Images

**Depends on:** T2

Copy `src-en/img/**` (28 files) to `public/img/`, rewrite `src="img/…"` to
`/img/…`, preserve `class` and inline widths, and style `<figure>`/`<figcaption>`
(9 uses).

**Done when:** the diagram-heavy pages (ch04, ch15, ch17) render at correct
widths in RTL without horizontal overflow.

---

## T11 — Page footer

**Depends on:** T7

Prev/next in strict Summary order with disabled neighbours (ADR-0006). Link to
the corresponding English page on `doc.rust-lang.org` plus
`<link rel="alternate" hreflang="en">`. Attribution and dual-licence notice.

**Done when:** the first and last pages render correctly with one missing
neighbour, and every English link resolves.

---

## T12 — Pagefind search

**Depends on:** T7

Run Pagefind as a post-build step over `dist/`, mount its UI in the sidebar
header, styled to the palette. Verify Persian tokenisation and RTL result
rendering.

**Done when:** searching a Persian phrase from a translated page returns that
page, and the index excludes sidebar/footer chrome.

---

## T13 — Progress readout and homepage

**Depends on:** T6

`src/lib/progress.ts` counts translated pages from file sizes. Homepage: title,
short intro, `۱۲ از ۱۱۱ صفحه` plus percentage, entry link to chapter 1. Same
figure in the sidebar header.

**Done when:** translating one more page changes both figures on the next build.

---

## T14 — Site-level polish

**Depends on:** T6

Custom 404 (in Farsi, with a link back to the contents), `@astrojs/sitemap`,
`robots.txt`, OG/Twitter meta with per-page titles.

**Done when:** `sitemap.xml` lists exactly the translated pages.

---

## T15 — Deploy to Vercel

**Depends on:** T1–T14

Connect the repo, confirm the build command and static output, set the
production domain. Verify Persian fonts, RTL layout and search on the deployed
site.

**Done when:** the production URL serves the translated pages and shows
untranslated ones as disabled.
