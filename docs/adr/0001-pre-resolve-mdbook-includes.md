---
status: accepted
---

# Pre-resolve mdbook includes instead of resolving at build time

The English source carries 707 `{{#include}}` / `{{#rustdoc_include}}`
directives pointing into the upstream book's 8.6 MB `listings/` tree, which is
not part of this repo. Rather than teach the Astro build to resolve them, a
one-off script (`scripts/resolve.ts`) resolves them against a local checkout of
the upstream book and writes a fully self-contained `src-en-resolved/`, which is
committed. The Astro build never sees a directive.

## Considered options

- **Vendor `listings/` and resolve during the build.** Rejected: adds 8.6 MB of
  Rust code that this repo has no other use for, and puts 707 filesystem
  lookups plus anchor parsing on the critical path of every build.
- **Git submodule the upstream book.** Rejected: submodules would make cloning
  and CI meaningfully more annoying in exchange for an upstream-sync ability we
  will not use — a translation diverges from its source by design.

## Consequences

The Listings Tree path is a CLI argument (default `../rust-book`), so the
script is reproducible by anyone with both repos checked out, but is *not*
runnable in CI. Its output being committed is what makes that acceptable: the
artifact, not the tool, is the thing the project depends on.

Upstream corrections to the Rust Book will not flow in automatically. Picking
them up means re-running the script and diffing — a deliberate act, which is
the right shape for a translation anyway.
