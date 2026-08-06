---
status: accepted
---

# The translation covers the introduction and chapters 1–21 only

The appendices (`appendix-00` … `appendix-07`) and the front matter (`title-page`,
`foreword`) are out of scope. The book here is 101 pages: `ch00-00-introduction`
followed by chapters 1–21. They are absent from `src-fa/SUMMARY.md` and have no
files in `src-fa/`.

## Consequences

The prose references the dropped pages 13 times. Those links resolve to the
English original on `doc.rust-lang.org` rather than 404ing or rendering as
Disabled Links, because the material genuinely exists — it is just not here. They
carry `class="link-en"` and an `↗ EN` marker so the destination is clear before
the click.

This is why `rehype-book-links` distinguishes three cases rather than two: a slug
in the Summary, a slug that is a real upstream page but not in the Summary, and a
slug that is neither. Only the last is a suspect link worth warning about.

The English source for the dropped pages stays vendored in `src-en/` and
`src-en-resolved/`. Nothing serves it, and it costs nothing to keep — and the
upstream slug list is what lets the link rewriter tell a dropped page apart from a
typo. Reversing this decision means re-adding the Summary entries and re-running
`pnpm scaffold`.
