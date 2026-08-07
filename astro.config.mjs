// @ts-check
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { shikiMono } from "./src/lib/shiki-mono.ts";
import { rehypeNormalizeHeadings } from "./src/plugins/rehype-normalize-headings.ts";
import { rehypeBookLinks } from "./src/plugins/rehype-book-links.ts";
import { rehypeCodeCopy } from "./src/plugins/rehype-code-copy.ts";

export default defineConfig({
  site: "https://rust-book.yazdan.me",
  output: "static",
  adapter: vercel(),
  integrations: [
    sitemap({
      // Untranslated pages have no route, so they are absent already; this only
      // keeps the error page out of the index.
      filter: (page) => !page.endsWith("/404/") && !page.endsWith("/404.html"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      theme: shikiMono,
      wrap: false,
    },
    rehypePlugins: [rehypeNormalizeHeadings, rehypeBookLinks, rehypeCodeCopy],
  },
});
