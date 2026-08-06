import type { APIRoute } from "astro";

/**
 * robots.txt, generated from `site` in astro.config.mjs.
 *
 * Previously a static file in `public/` with the domain written out by hand,
 * which meant the domain lived in two places and could disagree with the
 * canonical URLs and sitemap. Deriving it makes that impossible.
 */
export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error("`site` must be set in astro.config.mjs");

  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${new URL("sitemap-index.xml", site).href}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
