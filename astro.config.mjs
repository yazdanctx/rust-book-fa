// @ts-check
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { shikiMono } from "./src/lib/shiki-mono.ts";

export default defineConfig({
  site: "https://rust-book-fa.vercel.app",
  output: "static",
  adapter: vercel(),
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      theme: shikiMono,
      wrap: false,
    },
  },
});
