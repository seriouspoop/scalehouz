// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
// Static generation (SSG) by default → deploys to the Cloudflare Pages edge.
// Update `site` to the production domain so canonical + OG URLs resolve.
export default defineConfig({
  site: 'https://scalehouz.com',
  integrations: [sitemap()],
  adapter: cloudflare(),
});