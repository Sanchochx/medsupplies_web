// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Self-hosted fonts: only the `latin` subset (covers Spanish and English) in the weights the design
// uses, read from the installed @fontsource packages. The local provider is used instead of the npm
// one because the npm provider pulls every subset and cannot restrict preloads to latin.
const JAKARTA_FILES = '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin';
const INTER_FILES = '@fontsource/inter/files/inter-latin';

export default defineConfig({
  // Canonical origin: Open Graph tags need absolute URLs (`Astro.site` in BaseLayout).
  site: 'https://medsupplies-web.sas-ingenieria.workers.dev',
  fonts: [
    {
      name: 'Plus Jakarta Sans',
      cssVariable: '--font-plus-jakarta-sans',
      provider: fontProviders.local(),
      display: 'swap',
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          { weight: 600, style: 'normal', src: [`${JAKARTA_FILES}-600-normal.woff2`] },
          { weight: 700, style: 'normal', src: [`${JAKARTA_FILES}-700-normal.woff2`] },
        ],
      },
    },
    {
      name: 'Inter',
      cssVariable: '--font-inter',
      provider: fontProviders.local(),
      display: 'swap',
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          { weight: 400, style: 'normal', src: [`${INTER_FILES}-400-normal.woff2`] },
          { weight: 500, style: 'normal', src: [`${INTER_FILES}-500-normal.woff2`] },
          { weight: 600, style: 'normal', src: [`${INTER_FILES}-600-normal.woff2`] },
          { weight: 700, style: 'normal', src: [`${INTER_FILES}-700-normal.woff2`] },
        ],
      },
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
