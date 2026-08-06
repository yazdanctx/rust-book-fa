---
status: accepted
---

# Page titles come from the Summary, and body headings shift down one level

26 source files open with an `h1`, 85 open with an `h2`, one with an `h3`. Rather
than normalise this per file, the layout renders the page's Farsi title from
`src-fa/SUMMARY.md` as the sole `h1`, and a rehype plugin demotes every in-body
heading one level so bodies uniformly start at `h2`.

## Consequences

`<title>`, the visible `h1`, the sidebar label and any breadcrumb all read from
one string and cannot disagree. An in-progress translation still shows a correct
Farsi title above an empty body, which is what makes the Summary usable as the
project's spine.

The trade-off is that the title is no longer visible in the markdown file a
translator is editing — page titles are translated in `SUMMARY.md`, separately
from page bodies. Since the Summary is translated once up front and bodies are
translated over months, this separation is a feature rather than a hazard.
