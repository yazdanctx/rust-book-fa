/**
 * Resolves the vendored English source into a self-contained worksheet.
 *
 * Reads `src-en/`, resolves every mdbook include directive against a local
 * checkout of the upstream book's `listings/` tree, flattens mdbook's custom
 * `<Listing>` element into plain markdown, and writes the result to
 * `src-en-resolved/`. See SPEC §2.1 and ADR-0001.
 *
 *   pnpm resolve [--listings ../rust-book] [--out src-en-resolved]
 *
 * The output is committed. This script is never run by the site build.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname, resolve as resolvePath } from "node:path";
import { toPersianDigits } from "../src/lib/digits.ts";

// ── Configuration ──────────────────────────────────────────────────────────

const REPO_ROOT = resolvePath(import.meta.dirname, "..");

/** Farsi labels the resolver emits. Prose from here on is the translator's. */
const LABEL = {
  filename: "نام فایل:",
  listing: "لیستینگ",
  table: "جدول",
  ferris: {
    does_not_compile: "این کد کامپایل نمی‌شود!",
    panics: "این کد پنیک می‌کند!",
    not_desired_behavior: "این کد رفتار مورد انتظار را ندارد.",
  },
} as const;

type FerrisKind = keyof typeof LABEL.ferris;

const FERRIS_ATTRS = new Set<string>(Object.keys(LABEL.ferris));

/**
 * mdbook fence attributes that carry no meaning without a Rust playground:
 * test directives and rendering hints. Dropped from the emitted fence.
 */
const DROPPED_FENCE_ATTRS = new Set([
  "ignore",
  "noplayground",
  "no_run",
  "should_panic",
  "test_harness",
  "compile_fail",
  "edition2015",
  "edition2018",
  "edition2021",
  "edition2024",
]);

// ── Errors ─────────────────────────────────────────────────────────────────

/**
 * Problems are collected and reported together rather than thrown on first
 * sight: with 707 directives, seeing all failures at once is the difference
 * between one fix cycle and twenty.
 */
const problems: string[] = [];

function problem(file: string, line: number, message: string): void {
  problems.push(`${file}:${line} — ${message}`);
}

// ── Include resolution ─────────────────────────────────────────────────────

const INCLUDE_RE = /\{\{#(rustdoc_)?include\s+([^}]+?)\}\}/;
const ANCHOR_RE = /^\s*(?:\/\/|#)\s*ANCHOR(_END)?:\s*(\S+)\s*$/;

const fileCache = new Map<string, string[]>();

function readLines(path: string): string[] | undefined {
  const cached = fileCache.get(path);
  if (cached) return cached;
  let lines: string[];
  try {
    lines = readFileSync(path, "utf8").replace(/\r\n/g, "\n").split("\n");
  } catch {
    return undefined;
  }
  // A trailing newline yields a final empty element; drop it so ranges and
  // whole-file includes don't gain a blank line.
  if (lines.at(-1) === "") lines.pop();
  fileCache.set(path, lines);
  return lines;
}

function isAnchorLine(line: string): boolean {
  return ANCHOR_RE.test(line);
}

/**
 * Collects every region tagged with `name` and concatenates them, in file
 * order.
 *
 * A name can legitimately open and close more than once — mdbook treats the
 * pieces as one snippet, which is how the book elides a middle section without
 * a `--snip--` comment. Returns undefined if the name never appears.
 */
function extractAnchor(lines: string[], name: string): string[] | undefined {
  const out: string[] = [];
  let found = false;
  let depth = 0;

  for (const line of lines) {
    const match = ANCHOR_RE.exec(line);
    if (match) {
      const isEnd = Boolean(match[1]);
      if (match[2] === name) {
        if (isEnd) depth--;
        else {
          depth++;
          found = true;
        }
      }
      // Anchor markers never appear in output, including nested ones.
      continue;
    }
    if (depth > 0) out.push(line);
  }

  return found ? out : undefined;
}

/** Parses mdbook's `:start:end` line selection. Both bounds are 1-based. */
function extractLineRange(
  lines: string[],
  spec: string,
): string[] | undefined {
  const parts = spec.split(":");
  if (parts.length === 1) {
    // `:10` selects line 10 alone.
    const n = Number(parts[0]);
    if (!Number.isInteger(n) || n < 1 || n > lines.length) return undefined;
    return [lines[n - 1]!];
  }
  if (parts.length === 2) {
    const start = parts[0] === "" ? 1 : Number(parts[0]);
    const rawEnd = parts[1] === "" ? lines.length : Number(parts[1]);
    if (!Number.isInteger(start) || !Number.isInteger(rawEnd)) return undefined;
    // mdbook clamps an end past the last line rather than failing, and the book
    // relies on it — several directives ask for more lines than the file has.
    const end = Math.min(rawEnd, lines.length);
    if (start < 1 || start > end) return undefined;
    return lines.slice(start - 1, end);
  }
  return undefined;
}

/**
 * Replaces a single include directive with the code it points at.
 *
 * `include` and `rustdoc_include` are treated identically: the upstream
 * listings contain no rustdoc hidden lines (verified: zero `^# ` lines across
 * the tree), so there is nothing to strip.
 */
function resolveInclude(
  spec: string,
  mdFile: string,
  lineNo: number,
  listingsRoot: string,
): string | undefined {
  // Split the path from a trailing anchor or line range. Anchors and ranges
  // never contain `/`, and paths here never contain `:`.
  const colon = spec.indexOf(":");
  const relPath = colon === -1 ? spec : spec.slice(0, colon);
  const selector = colon === -1 ? undefined : spec.slice(colon + 1);

  // Paths are written relative to the upstream `src/` directory.
  const target = resolvePath(join(listingsRoot, "src"), relPath.trim());
  const lines = readLines(target);
  if (!lines) {
    problem(mdFile, lineNo, `include target not found: ${relPath.trim()}`);
    return undefined;
  }

  if (selector === undefined || selector === "") {
    return lines.filter((l) => !isAnchorLine(l)).join("\n");
  }

  if (/^[0-9:]+$/.test(selector)) {
    const range = extractLineRange(lines, selector);
    if (!range) {
      problem(mdFile, lineNo, `line range out of bounds: ${spec.trim()}`);
      return undefined;
    }
    return range.filter((l) => !isAnchorLine(l)).join("\n");
  }

  const anchored = extractAnchor(lines, selector.trim());
  if (!anchored) {
    problem(
      mdFile,
      lineNo,
      `anchor "${selector.trim()}" not found in ${relPath.trim()}`,
    );
    return undefined;
  }
  return anchored.join("\n");
}

// ── Fence info strings ─────────────────────────────────────────────────────

interface FenceInfo {
  lang: string;
  ferris?: FerrisKind;
}

function parseFenceInfo(info: string, mdFile: string, lineNo: number): FenceInfo {
  const parts = info
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const lang = parts.shift() ?? "";
  let ferris: FerrisKind | undefined;

  for (const attr of parts) {
    if (FERRIS_ATTRS.has(attr)) {
      ferris = attr as FerrisKind;
    } else if (!DROPPED_FENCE_ATTRS.has(attr)) {
      problem(mdFile, lineNo, `unknown fence attribute: ${attr}`);
    }
  }

  return { lang, ferris };
}

function ferrisMarkup(kind: FerrisKind): string {
  const label = LABEL.ferris[kind];
  return `<img class="ferris" src="/img/ferris/${kind}.svg" alt="${label}" title="${label}" />`;
}

// ── Listing flattening ────────────────────────────────────────────────────

// Greedy up to the final `>`: caption attributes routinely contain `>` from
// Rust generics (`Option<i32>`), so a `[^>]*` class would truncate the tag.
// The optional `>` prefix is a blockquote — a few listings sit inside notes.
const LISTING_OPEN_RE = /^(\s*>\s*)?<Listing\b(.*)>\s*$/;
const LISTING_CLOSE_RE = /^(\s*>\s*)?<\/Listing>\s*$/;

function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const m of raw.matchAll(/([a-z-]+)="([^"]*)"/g)) {
    attrs[m[1]!] = m[2]!;
  }
  return attrs;
}

function filenameLine(fileName: string): string {
  return `<span class="filename">${LABEL.filename} ${fileName}</span>`;
}

function captionLine(number: string | undefined, caption: string): string {
  const prefix = number
    ? `${LABEL.listing} ${toPersianDigits(number)}: `
    : "";
  return `<span class="caption">${prefix}${caption}</span>`;
}

// ── Title heading ──────────────────────────────────────────────────────────

/**
 * Drops the page's leading heading, which is its title.
 *
 * Every one of the 111 pages opens with a heading naming the page, at an
 * inconsistent level (26 at `h1`, 85 at `h2`, one at `h3`). The site renders the
 * title from `SUMMARY.md` instead (ADR-0005), so leaving it in the body would
 * print it twice. Removing it here rather than at render time keeps the change
 * visible in the committed worksheet, and means a translator never has to
 * wonder why a heading they typed disappeared.
 */
function stripTitleHeading(lines: string[]): string[] {
  const index = lines.findIndex((l) => l.trim() !== "");
  if (index === -1) return lines;
  if (!/^#{1,6}\s+\S/.test(lines[index]!)) return lines;

  const rest = lines.slice(index + 1);
  while (rest[0]?.trim() === "") rest.shift();
  return rest;
}

// ── Document transform ─────────────────────────────────────────────────────

function transform(source: string, mdFile: string, listingsRoot: string): string {
  // mdbook link-check hints. Stripped before splitting into lines because the
  // source is hard-wrapped at 80 columns, so the comment is frequently split
  // across a line break (`…[msvc]<!--\nignore -->.`). Replacing the whole match
  // with nothing rejoins the two halves, which is what the prose wants.
  const normalized = source
    .replace(/\r\n/g, "\n")
    .replace(/<!--\s*ignore\s*-->/g, "");

  const lines = stripTitleHeading(normalized.split("\n"));
  const out: string[] = [];

  /** Pending caption to emit after the current <Listing> closes. */
  let openListing:
    | { number?: string; caption?: string; prefix: string }
    | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lineNo = i + 1;

    // ── <Listing> open
    const open = LISTING_OPEN_RE.exec(line);
    if (open) {
      const prefix = open[1] ?? "";
      const attrs = parseAttrs(open[2]!);
      openListing = {
        number: attrs["number"],
        caption: attrs["caption"],
        prefix,
      };
      if (attrs["file-name"]) {
        out.push(prefix + filenameLine(attrs["file-name"]), prefix.trimEnd());
      }
      continue;
    }

    // ── </Listing> close
    if (LISTING_CLOSE_RE.test(line)) {
      if (!openListing) {
        problem(mdFile, lineNo, "</Listing> without a matching <Listing>");
      } else if (openListing.caption !== undefined) {
        // Trailing blank lines inside the element would separate the caption
        // from its block; collapse them first.
        const prefix = openListing.prefix;
        while (out.at(-1) === "" || out.at(-1) === prefix.trimEnd()) out.pop();
        out.push(
          prefix.trimEnd(),
          prefix + captionLine(openListing.number, openListing.caption),
        );
      }
      openListing = undefined;
      continue;
    }

    // ── Fenced code block
    const fenceOpen = /^(\s*)(```+)(.*)$/.exec(line);
    if (fenceOpen) {
      const [, indent = "", ticks = "```", info = ""] = fenceOpen;
      const { lang, ferris } = parseFenceInfo(info, mdFile, lineNo);

      // Collect the body up to the closing fence.
      const body: string[] = [];
      let j = i + 1;
      let closed = false;
      for (; j < lines.length; j++) {
        const bodyLine = lines[j]!;
        if (new RegExp(`^\\s*${ticks}\\s*$`).test(bodyLine)) {
          closed = true;
          break;
        }
        body.push(bodyLine);
      }
      if (!closed) {
        problem(mdFile, lineNo, "unterminated code fence");
      }

      // Resolve any include directives inside the body.
      const resolved: string[] = [];
      for (const bodyLine of body) {
        const include = INCLUDE_RE.exec(bodyLine);
        if (!include) {
          resolved.push(bodyLine);
          continue;
        }
        const code = resolveInclude(include[2]!, mdFile, lineNo, listingsRoot);
        if (code === undefined) {
          resolved.push(bodyLine); // keep the directive so the failure is visible
        } else {
          resolved.push(...code.split("\n"));
        }
      }

      if (ferris) out.push(ferrisMarkup(ferris), "");
      out.push(`${indent}${ticks}${lang}`);
      out.push(...resolved);
      out.push(`${indent}${ticks}`);
      i = j;
      continue;
    }

    // ── Prose line
    let text = line;

    // Include directives should only ever appear inside fences.
    if (INCLUDE_RE.test(text)) {
      problem(mdFile, lineNo, "include directive outside a code fence");
    }

    // Image paths become site-absolute. Done here rather than in a rehype
    // plugin because these are raw HTML tags in the markdown, which the
    // markdown pipeline keeps as opaque `raw` nodes — a rehype plugin visiting
    // `element` nodes never sees them. `public/img/` mirrors `src-en/img/`, so
    // a leading slash is the whole transformation.
    text = text.replace(/(<img[^>]*\ssrc=")img\//g, "$1/img/");

    // Loose filename / caption markers (those not wrapped in <Listing>).
    text = text.replace(
      /<span class="filename">Filename:\s*/g,
      `<span class="filename">${LABEL.filename} `,
    );
    text = text.replace(
      /<span class="caption">Table\s+([A-Z0-9-]+):/g,
      (_m, id: string) =>
        `<span class="caption">${LABEL.table} ${toPersianDigits(id)}:`,
    );
    text = text.replace(
      /<span class="caption">Listing\s+([0-9-]+):/g,
      (_m, id: string) =>
        `<span class="caption">${LABEL.listing} ${toPersianDigits(id)}:`,
    );

    // Collapse runs of blank lines, which the emitted filename/caption spans
    // otherwise introduce. Applied only to prose: fence bodies are pushed as a
    // unit above, where blank lines are significant.
    if (text.trim() === "" && out.at(-1)?.trim() === "") continue;

    out.push(text);
  }

  if (openListing) {
    problem(mdFile, lines.length, "<Listing> was never closed");
  }

  return `${out.join("\n").replace(/\n{3,}$/, "\n")}`;
}

// ── Entry point ────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): { listings: string; out: string } {
  let listings = "../rust-book";
  let out = "src-en-resolved";
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--listings" && argv[i + 1]) listings = argv[++i]!;
    else if (argv[i] === "--out" && argv[i + 1]) out = argv[++i]!;
  }
  return { listings, out };
}

function main(): void {
  const { listings, out } = parseArgs(process.argv.slice(2));
  const listingsRoot = resolvePath(REPO_ROOT, listings);
  const srcDir = join(REPO_ROOT, "src-en");
  const outDir = resolvePath(REPO_ROOT, out);

  if (!readLines(join(listingsRoot, "book.toml"))) {
    console.error(
      `✗ No upstream book found at ${listingsRoot}\n` +
        `  Pass --listings <path> pointing at a checkout of rust-lang/book.`,
    );
    process.exit(1);
  }

  const files = readdirSync(srcDir)
    .filter((f) => f.endsWith(".md") && f !== "SUMMARY.md")
    .sort();

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  let includes = 0;
  for (const file of files) {
    const source = readFileSync(join(srcDir, file), "utf8");
    includes += (source.match(/\{\{#(rustdoc_)?include/g) ?? []).length;
    const result = transform(source, file, listingsRoot);
    writeFileSync(join(outDir, file), result, "utf8");
  }

  if (problems.length > 0) {
    console.error(`\n✗ ${problems.length} unresolved problem(s):\n`);
    for (const p of problems) console.error(`  ${p}`);
    console.error(
      `\nOutput in ${out} is incomplete. Fix the above and re-run.\n`,
    );
    process.exit(1);
  }

  console.log(
    `✓ resolved ${files.length} files, ${includes} include directives → ${out}`,
  );
}

main();
