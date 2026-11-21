// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Domain production (dipakai canonical, OG, sitemap, robots.txt).
const SITE = 'https://devs.web.id';

/**
 * Cegah deploy dengan domain contoh: canonical/sitemap akan menunjuk ke example.com.
 * Build lokal hanya memberi peringatan; di CI (termasuk Cloudflare Workers Builds) build digagalkan.
 * @returns {import('astro').AstroIntegration}
 */
function guardPlaceholderSite() {
  return {
    name: 'guard-placeholder-site',
    hooks: {
      'astro:build:start': ({ logger }) => {
        if (new URL(SITE).hostname !== 'example.com') return;
        const msg = '`site` di astro.config.mjs masih https://example.com. Ganti dengan domain production.';
        if (process.env.CI || process.env.WORKERS_CI) throw new Error(msg);
        logger.warn(msg);
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: SITE,
  // WAJIB static (lihat AGENTS.md §2). Jangan tambah adapter SSR.
  output: 'static',
  build: {
    // CSP style-src 'self' tanpa unsafe-inline → jangan diubah (AGENTS.md §3).
    inlineStylesheets: 'never',
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Astro meng-inline <script> kecil ke HTML → diblokir CSP script-src 'self'. 0 = selalu file eksternal.
      assetsInlineLimit: 0,
    },
  },
  integrations: [guardPlaceholderSite(), sitemap()],
});
