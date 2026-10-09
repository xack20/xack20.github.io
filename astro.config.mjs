import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://xack20.github.io',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  // Shiki writes inline styles that the strict CSP blocks; the content has no code blocks to highlight.
  markdown: { syntaxHighlight: false },
  // Keep every asset (font subsets included) as a same-origin file so the CSP needs no data: fonts.
  vite: { build: { assetsInlineLimit: 0 } },
  integrations: [sitemap({ filter: (page) => !page.includes('/404'), lastmod: new Date() })],
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'none'",
      ],
    },
  },
});
