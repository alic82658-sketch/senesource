// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';

// V0.1 : sortie statique pure, contenu en collections MDX locales.
export default defineConfig({
  site: 'https://senesource.sn',
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
});
