# Rust Book FA

A Persian (Farsi) translation of *The Rust Programming Language*, published as a
static Astro site. The English source is vendored as markdown; translation
happens file-by-file over a long period, so the site must render a partially
complete book honestly.

## Language

### Content

**Page**:
One chapter or section of the book, corresponding to exactly one markdown file
in `src-fa/`. There are 101 of them: the introduction plus chapters 1–21. The
appendices and front matter are out of scope.
_Avoid_: Chapter (a Page may be a section within a chapter), Article, Post

**Slug**:
A Page's URL path segment, identical to its source filename without the
extension — e.g. `ch01-01-installation`. Inherited unchanged from mdbook so
that inbound links and in-book cross-references keep working.
_Avoid_: Path, ID, Permalink

**Summary**:
`src-fa/SUMMARY.md` — the single source of truth for which Pages exist, their
reading order, their nesting, and their Farsi titles. Not itself a Page.
_Avoid_: TOC, Index, Sidebar, Manifest

**Untranslated Page**:
A Page whose `src-fa/` file is exactly zero bytes. It has a Farsi title (from
the Summary) but no body, is not routed, and appears everywhere in the UI as a
Disabled Link.
_Avoid_: Empty page, Missing page, Draft, Stub

**Translated Page**:
A Page whose `src-fa/` file has any content at all. The first keystroke
promotes an Untranslated Page to a Translated one; there is no explicit status
to maintain.
_Avoid_: Published page, Complete page

**Disabled Link**:
How an Untranslated Page is presented wherever it would otherwise be a link —
in the Summary sidebar, in prev/next, and in cross-references inside prose. A
muted, unclickable element labelled **در دست نگارش** ("being written").
_Avoid_: Greyed link, Broken link, Placeholder

**Translation Progress**:
The count of Translated Pages out of 101, derived on every build from file
sizes alone.

### Source material

**Resolved Source**:
`src-en-resolved/` — the English book with every Include Directive replaced by
the real code it referenced and every Listing flattened to plain markdown. It
is generated, committed, and never served; it is the worksheet a translator
copies from when starting a Page.
_Avoid_: Compiled source, Build output, Dist

**Include Directive**:
An mdbook `{{#include}}` or `{{#rustdoc_include}}` marker in the English
source pointing at a real file in the upstream book's `listings/` tree. There
are 707 of them, and none survive into `src-en-resolved/`.
_Avoid_: Import, Transclusion, Macro

**Anchor**:
The suffix on an Include Directive selecting part of the target file — either a
name matching an `// ANCHOR:` comment (`:here`, `:all`) or a line number.

**Listings Tree**:
The upstream Rust Book's `listings/` directory of compilable example crates and
captured terminal output. Not vendored into this repo; supplied by path when
generating the Resolved Source.

**Listing**:
A code block presented as a numbered, captioned figure — optionally with the
filename it belongs to. Written as an mdbook `<Listing>` element upstream;
flattened to a filename line, a fenced block, and a caption line.
_Avoid_: Snippet, Example, Figure

**Ferris Badge**:
The crab icon marking a code block as deliberately broken — it does not
compile, it panics, or it does not do what it appears to do. Derived from the
attributes on the upstream code fence, which carry no other meaning here.
_Avoid_: Warning, Callout, Admonition

## Translation terminology

The convention: **general computing concepts get a Persian word; Rust-specific
jargon gets the transliteration Persian developers actually say; identifiers,
keywords and macro names stay in Latin inside code spans** (`match`, `Result`,
`Box<T>`, `Send`, `cargo install`).

These choices propagate through 182,828 words, so they are expensive to revise
later. Draft status — review before translating chapter bodies.

| English | Farsi | Note |
|---|---|---|
| ownership | مالکیت | |
| borrowing | قرض‌گرفتن | not وام‌گیری |
| reference | ارجاع | |
| slice | برش | |
| struct | استراکت | transliterated, to keep it distinct from "structure" generally |
| enum | انیوم | transliterated |
| trait | تریت | transliterated; trait object → تریت‌آبجکت |
| crate | کریت | |
| package | پکیج | |
| module | ماژول | |
| scope | دامنه | |
| generic | جنریک | |
| lifetime | طول‌عمر | |
| closure | کلوژر | not بستار |
| iterator | ایتریتور | not تکرارگر |
| collection | مجموعه | |
| vector | وکتور | |
| string | رشته | translated, unlike most type names |
| hash map | هش‌مپ | |
| smart pointer | اشاره‌گر هوشمند | |
| heap | هیپ | |
| thread | ترد | not نخ |
| concurrency | همروندی | |
| async | ناهمگام | `async`/`await` themselves stay in Latin |
| future | فیوچر | |
| stream | استریم | |
| task | تسک | |
| pattern matching | تطبیق الگو | |
| refutability | ردشدنی بودن | |
| unsafe | ناایمن | |
| macro | ماکرو | |
| edition | ادیشن | transliterated, so it is not confused with a version number |
| mutability | تغییرپذیری | interior mutability → تغییرپذیری درونی |
| error handling | مدیریت خطا | recoverable → قابل جبران, unrecoverable → جبران‌ناپذیر |
| Cargo | کارگو | but `cargo` the command stays Latin |

The appendices are not part of this translation (ADR-0007), so the prose's 13
references to them resolve to the English original rather than to a page here.
