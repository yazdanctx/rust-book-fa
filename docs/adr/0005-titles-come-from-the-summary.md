---
status: accepted
---

# Page titles come from the Summary, and body headings shift down one level

26 source files open with an `h1`, 85 open with an `h2`, one with an `h3` — and in
all 111 cases that leading heading *is* the page title. The layout renders the
page's Farsi title from `src-fa/SUMMARY.md` as the sole `h1`; `resolve.ts` drops
the duplicate leading heading from the body; and a rehype plugin normalises the
remaining headings so the shallowest becomes `h2`.

Note the normalisation is a *derived per-document offset*, not a fixed +1 shift.
A uniform shift only suits the 26 pages that open at `h1`; applied to the 85 that
open at `h2` it produces an `h1 → h3` gap. Deriving the offset from the
shallowest heading in each document lands the top level on `h2` either way and
preserves relative hierarchy.

Stripping the duplicate title in `resolve.ts` rather than at render time keeps
the transformation visible in the committed worksheet, and means a translator
never has to wonder why a heading they typed vanished.

## Consequences

`<title>`, the visible `h1`, the sidebar label and any breadcrumb all read from
one string and cannot disagree. An in-progress translation still shows a correct
Farsi title above an empty body, which is what makes the Summary usable as the
project's spine.

The trade-off is that the title is no longer visible in the markdown file a
translator is editing — page titles are translated in `SUMMARY.md`, separately
from page bodies. Since the Summary is translated once up front and bodies are
translated over months, this separation is a feature rather than a hazard.
