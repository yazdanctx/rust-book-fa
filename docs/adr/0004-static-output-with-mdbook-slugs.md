---
status: accepted
---

# Static output on Vercel, at root-level mdbook slugs

The site builds with `output: 'static'` via `@astrojs/vercel` — 111 prerendered
pages, no serverless functions. URLs are the unchanged mdbook slugs at the root
of the domain (`/ch01-01-installation/`), with no `/fa/` locale prefix.

## Considered options

- **SSR.** Rejected: a book has no dynamic data. Static means no cold starts, no
  runtime cost, and a deploy that cannot fail at request time.
- **A `/fa/` locale prefix.** Rejected: the entire site is Farsi. A locale
  segment earns its keep only when a second locale exists, and adding one later
  is a redirect, whereas removing one breaks every published link.

## Consequences

URLs are effectively permanent, so this is the least reversible decision here.
Keeping mdbook slugs means the ~118 in-book cross-references resolve with a
mechanical `.md` → `/slug/` rewrite and no mapping table, and readers arriving
from the English book's URL shape land in the right place.
