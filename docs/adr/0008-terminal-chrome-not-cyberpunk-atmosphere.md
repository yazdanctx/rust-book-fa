---
status: accepted
---

# The interface is terminal chrome, not cyberpunk atmosphere

The audience is Rust developers, so the interface leans into the terminal — but
only through *semantic* chrome: glyphs that a developer reads as meaning
something (`##` for heading depth, `[!]` for a diagnostic, `todo!()` for an
unwritten page, a path prefix for a slug). Surface-level cyberpunk atmosphere —
scanlines, CRT bloom, glitch, chromatic aberration, neon gradients — is
rejected outright. It fights 182,828 words of Persian prose at 17px/1.9, it
carries no information, and it dates.

## Consequences

Four budgets follow, and they are the point of this ADR — each one is a place
where a future reader will otherwise "fix" something deliberate.

**Typography is frozen.** Peyda is the interface font and no Persian text ever
changes face. New chrome may use `--font-mono`, but only on Latin-only glyphs,
which is what that token already does for `##`, `[!]`, `.code-lang` and
`.pager-title code`. No new font files, no new families. This is why the sidebar
is a path listing rather than `tree` output: box-drawing connectors need a mono
metric Peyda cannot supply, and they point the wrong way in RTL besides.

**Red gains range, not territory.** The Brand Ramp grows to five steps so red
can be dim, base or hot within its existing surfaces. It does not spread to new
ones, and no second accent hue is introduced. Red reads as the terminal's own
colour precisely because nothing else on the page is coloured; widening it is
the one change that would destroy the effect it is meant to strengthen.

*One carve-out*: the Panic Page. It is the only surface with no long-form
reading to protect and nobody reaches it deliberately, so it is allowed to be
loud — and a panic message that is not red is not a panic message. This is the
sole place red occupies ground it did not already hold, and it is deliberate.
Table headers, by contrast, were left neutral for exactly the reason this rule
exists; if red is ever wanted there, it is an amendment to this ADR, not a
tweak.

**Motion is caused, not ambient.** Hover and focus may move things. A blinking
cursor was designed, costed and rejected — a hard on/off at ~1Hz in the
periphery is a different thing from a seven-second sweep, and it is not wanted
on a surface people read for hours.

*Amended.* There are now two permanent animations, not one: the travelling arc
on `.prose blockquote`, and the same arc on the homepage panel. The rule this
leaves behind is narrower but still real — **ambient motion is the lit-frame
arc and nothing else.** A second effect would have made this a site that moves;
the same effect used twice is one idiom applied consistently, which is why the
panel reuses the blockquote's technique verbatim rather than inventing a glow of
its own. Both are off under `prefers-reduced-motion`, redrawn as a static
symmetric gradient so the frame stays lit without travelling.

**The inside of a code block is exempt.** The frame is chrome and may be
themed; the syntax tokens stay monochrome. If they go neon, `[!]`, the language
pip and the copy confirmation all stop registering — the block is the densest
content on the page, and red is the budget that pays for meaning everywhere
else.

*Amended.* The syntax theme is now **fully** monochrome, not near-monochrome:
red has been removed from keywords, macros, tags and the shell prompt, leaving a
single value scale from `#fff` to the muted grey. Structure is carried by tone
and weight alone. This tightens the budget rather than relaxing it — the accent
buys more in the chrome around the block, where it still means something.

In the same change the block gained its own **dark blue surface**, the one place
the interface leaves black. This is a real exception to "no second hue", and it
is narrow on purpose: it is a value, not an accent. At that depth the blue reads
as "not the page" rather than as a colour, which is why it can sit beside the
brand red without either fighting the other. It applies to the code block
surface, its bar and its edge — nowhere else. Links remain the only other
non-brand colour in the interface.

The general rule the budgets share: **bounded elements may carry character;
repeating body elements may not.** A `kbd`, an `hr`, a table header or a pager
appears every few screens. A list bullet appears fifty times a page.

## Scripts

The theme ships two, and no more. Arrow-key navigation on reading pages, so the
Pager Window's advertised bindings are honest; and three lines on the Panic Page
that fill in the requested path, which a static build cannot know at build time.
Both degrade to a correct page when they do not run.
