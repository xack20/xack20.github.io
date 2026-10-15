import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://xack20.github.io',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  // The dev toolbar sits over the page and shows up in screenshots.
  devToolbar: { enabled: false },
  // Shiki writes inline styles that the strict CSP blocks; the content has no code blocks to highlight.
  markdown: { syntaxHighlight: false },
  // Keep every asset (font subsets included) as a same-origin file so the CSP needs no data: fonts.
  vite: { plugins: [tailwindcss()], build: { assetsInlineLimit: 0 } },
  integrations: [react(), sitemap({ filter: (page) => !page.includes('/404'), lastmod: new Date() })],
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
      // React and motion write style attributes on the home page's island. Style elements and scripts stay hash-only.
      styleDirective: { resources: [{ resource: "'unsafe-inline'", kind: 'attribute' }] },
    },
  },
});
