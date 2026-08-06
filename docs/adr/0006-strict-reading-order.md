---
status: accepted
---

# Prev/next follows strict Summary order and does not skip untranslated pages

Pagination shows the true neighbouring page in reading order. When that
neighbour is untranslated it renders as a Disabled Link rather than skipping
ahead to the nearest translated page.

## Consequences

Early on, most pages will have two disabled neighbours and offer no forward
navigation from the footer. This is deliberate and should not be "fixed":
skipping would silently teleport a reader from chapter 4 to chapter 11 with no
indication that anything existed between them, misrepresenting the book's
structure. Showing the real neighbour, greyed, tells the truth and doubles as a
progress signal. The sidebar remains the way to reach a distant translated page.
