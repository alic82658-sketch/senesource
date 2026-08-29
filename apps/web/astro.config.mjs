// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';

// V0.1 : sortie statique pure, contenu en collections MDX locales.
export default defineConfig({
  site: 'https://senesource.com',
  integrations: [mdx()],
  // Renumérotation des dossiers par ordre de première publication (tâche 6) :
  // 043 → 002, 044 → 003. Les numéros figurant dans les URL, on redirige les
  // anciennes adresses vers les nouvelles (301). Astro génère, en sortie
  // statique, une page de redirection avec canonical vers la cible.
  // Redirection au niveau de l'hébergeur recommandée pour un 301 « dur ».
  redirects: {
    '/article/electrification-rurale-senegal-6471-localites-2029':
      '/article/002-electrification-rurale-senegal-6471-localites-2029/',
    '/dossier/electrification-rurale-senegal-6471-localites-2029':
      '/dossier/002-electrification-rurale-senegal-6471-localites-2029/',
    '/article/044-elections-locales-date-inconnue':
      '/article/003-elections-locales-date-inconnue/',
    '/dossier/044-elections-locales-date-inconnue':
      '/dossier/003-elections-locales-date-inconnue/',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
