// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// V0 : sortie statique pure, aucune intégration supplémentaire.
export default defineConfig({
  site: 'https://senesource.sn',
  vite: {
    plugins: [tailwindcss()],
  },
});
