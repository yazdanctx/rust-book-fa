/**
 * Copies the Pagefind bundle into the Vercel output directory.
 *
 * The Vercel adapter copies `dist/` into `.vercel/output/static/` during
 * `astro build` — before Pagefind has run. Indexing `dist/` therefore produces a
 * bundle that exists only where `astro preview` looks, and the deployed site
 * would 404 on `/pagefind/pagefind-ui.js`. Indexing after the copy and then
 * syncing the bundle keeps both paths correct with a single index build.
 */

import { cpSync, existsSync } from "node:fs";
import { join } from "node:path";

const source = join(process.cwd(), "dist", "pagefind");
const target = join(process.cwd(), ".vercel", "output", "static", "pagefind");

if (!existsSync(source)) {
  console.error(
    "✗ dist/pagefind not found — did `pagefind --site dist` run before this?",
  );
  process.exit(1);
}

// Absent when building without the adapter (e.g. a plain `astro build` locally).
if (!existsSync(join(process.cwd(), ".vercel", "output", "static"))) {
  console.log("· no .vercel output directory; nothing to sync");
  process.exit(0);
}

cpSync(source, target, { recursive: true });
console.log("✓ synced pagefind bundle to .vercel/output/static/pagefind");
