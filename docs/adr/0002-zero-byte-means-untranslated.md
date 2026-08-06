---
status: accepted
---

# A zero-byte file is the only marker of an untranslated page

Translation state is derived entirely from file size: a `src-fa/` page of
exactly zero bytes is untranslated, anything else is translated. There is no
`status` field, no frontmatter, and no manifest of progress.

## Considered options

- **Frontmatter flag (`status: todo`).** Rejected: it is a second source of
  truth that a human must remember to flip. The failure mode is silent and
  embarrassing — a finished chapter still labelled "being written", or worse, an
  empty page advertised as done.
- **Omit untranslated files from `src-fa/` entirely.** Rejected: the Summary
  already enumerates all 111 pages, so absence carries no extra information,
  and a missing file is indistinguishable from an accidentally deleted one.

## Consequences

Starting a page is a single `cp` from `src-en-resolved/`, and the page goes live
the moment it has any content — including when it is still entirely English.
That is accepted: the alternative is bookkeeping, and bookkeeping decays.

It also means `scripts/scaffold.ts` must be strictly additive and never
overwrite an existing file. `src-fa/` is original work with no other copy; a
script able to zero a finished chapter is an unacceptable footgun.
