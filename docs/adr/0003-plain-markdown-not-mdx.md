---
status: accepted
---

# Content is plain markdown; listings are flattened rather than componentised

The upstream source wraps 424 code blocks in mdbook's `<Listing>` element and
adds 66 `<span class="filename">` / 28 `<span class="caption">` markers. The
resolve script flattens all of these into ordinary markdown — a filename line, a
fenced code block, a caption line — instead of rewriting them as Astro
component calls. `src-fa/` is `.md`, never `.mdx`.

## Considered options

- **MDX with a `<Listing>` component.** Rejected: it would mean every
  translator (human or LLM) editing a page must know Astro component syntax and
  must not break JSX while editing Persian prose containing quotes, brackets and
  bidirectional text. The cost lands on the activity we do 111 times.

## Consequences

Listing numbers stop being structured data — they become literal text in the
caption line (`لیستینگ ۲-۱`). Cross-references to listings by number are
therefore prose, not links. Acceptable: the upstream book rarely links to
listings by number, and styling is recoverable from CSS on the resulting
elements.
