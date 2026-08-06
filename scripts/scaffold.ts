/**
 * Scaffolds the Farsi translation directory (SPEC §2.2, ADR-0002).
 *
 * Creates one zero-byte file in `src-fa/` for every page the Summary links, and
 * seeds `src-fa/SUMMARY.md` from the English one if it does not exist yet.
 *
 *   pnpm scaffold
 *
 * Strictly additive: an existing file is never written to, and there is
 * deliberately no --force flag. `src-fa/` is original work with no other copy,
 * and a zero-byte file is what marks a page untranslated — a script able to
 * overwrite one could silently erase a finished chapter and mark it as not
 * started.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  statSync,
} from "node:fs";
import { join, resolve as resolvePath } from "node:path";
import { parseSummary } from "../src/lib/summary.ts";

const REPO_ROOT = resolvePath(import.meta.dirname, "..");
const EN_DIR = join(REPO_ROOT, "src-en");
const FA_DIR = join(REPO_ROOT, "src-fa");

function main(): void {
  mkdirSync(FA_DIR, { recursive: true });

  const faSummaryPath = join(FA_DIR, "SUMMARY.md");
  let seededSummary = false;

  if (!existsSync(faSummaryPath)) {
    // Seeded with the English titles in place so they can be translated
    // line-by-line rather than retyped from scratch.
    writeFileSync(
      faSummaryPath,
      readFileSync(join(EN_DIR, "SUMMARY.md"), "utf8"),
      "utf8",
    );
    seededSummary = true;
  }

  // The page list comes from whichever Summary is authoritative now: the Farsi
  // one once it exists, so a page added there is scaffolded on the next run.
  const pages = parseSummary(readFileSync(faSummaryPath, "utf8"));

  let created = 0;
  let skipped = 0;
  const missingSource: string[] = [];

  for (const page of pages) {
    const target = join(FA_DIR, `${page.slug}.md`);

    if (existsSync(target)) {
      skipped++;
      continue;
    }

    if (!existsSync(join(EN_DIR, `${page.slug}.md`))) {
      missingSource.push(page.slug);
      continue;
    }

    writeFileSync(target, "", "utf8");
    created++;
  }

  if (seededSummary) {
    console.log("  seeded src-fa/SUMMARY.md from src-en (titles need translating)");
  }

  console.log(`✓ created ${created}, skipped ${skipped}`);

  const translated = pages.filter((p) => {
    const target = join(FA_DIR, `${p.slug}.md`);
    return existsSync(target) && statSync(target).size > 0;
  }).length;
  console.log(`  ${translated} of ${pages.length} pages translated`);

  if (missingSource.length > 0) {
    console.error(
      `\n✗ ${missingSource.length} page(s) linked from the Summary have no ` +
        `counterpart in src-en/:\n` +
        missingSource.map((s) => `  ${s}.md`).join("\n"),
    );
    process.exit(1);
  }
}

main();
