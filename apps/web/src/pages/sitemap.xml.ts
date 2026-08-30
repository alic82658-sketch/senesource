import type { APIRoute } from 'astro';
import { listeDossiers, dossiersAvecPage } from '../lib/contenu';
import { RUBRIQUES } from '../lib/rubriques';

/**
 * sitemap.xml — plan du site pour les moteurs (invisible).
 * Contient : accueil, méthode, pages thématiques publiques, articles publiés
 * et rubriques NON vides. Exclus : /design-system (noindex), rubriques vides
 * (noindex), vues /dossier/* (dupliquées, canonical → /article/*).
 */
export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL('https://senesource.com');
  const abs = (chemin: string) => new URL(chemin, base).href;

  const articles = await dossiersAvecPage();
  const tous = await listeDossiers();

  // Rubriques ayant au moins un dossier visible.
  const rubriquesNonVides = RUBRIQUES.filter((r) =>
    tous.some((d) => d.categorie === r.nom),
  );

  const entrees: Array<{ loc: string; lastmod?: string }> = [
    { loc: abs('/') },
    { loc: abs('/methode/') },
    { loc: abs('/qui-sommes-nous/') },
    { loc: abs('/mentions-legales/') },
    { loc: abs('/contribuer/') },
    { loc: abs('/verifications/') },
    { loc: abs('/documents/') },
    { loc: abs('/ce-que-ca-change/') },
    ...articles.map((d) => ({
      loc: abs(`/article/${d.slug}/`),
      lastmod: d.misAJourA ?? d.misAJourLe ?? d.publieA ?? d.ouvertLe,
    })),
    ...rubriquesNonVides.map((r) => ({ loc: abs(`/rubrique/${r.slug}/`) })),
  ];

  const corps = entrees
    .map(({ loc, lastmod }) => {
      const l = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
      return `  <url>\n    <loc>${loc}</loc>${l}\n  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${corps}\n</urlset>\n`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
