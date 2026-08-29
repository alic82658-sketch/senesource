import type { APIRoute } from 'astro';
import { listeDossiers, dossiersAvecPage } from '../lib/contenu';
import { RUBRIQUES } from '../lib/rubriques';
import { SITE_NOM, SITE_DESCRIPTION, SITE_CONTACT } from '../lib/jsonld';

/**
 * /llms.txt — présentation du site pour les assistants IA (standard llmstxt.org).
 * Fichier texte, invisible pour les lecteurs. Généré dynamiquement afin de
 * rester à jour à chaque publication (comme le sitemap).
 */
export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL('https://senesource.com');
  const abs = (chemin: string) => new URL(chemin, base).href;

  const articles = await dossiersAvecPage();
  const tous = await listeDossiers();
  const rubriquesNonVides = RUBRIQUES.filter((r) =>
    tous.some((d) => d.categorie === r.nom),
  );

  const lignes: string[] = [];
  lignes.push(`# ${SITE_NOM}`);
  lignes.push('');
  lignes.push(
    `> ${SITE_DESCRIPTION} Média sénégalais de vérification documentaire : dossiers numérotés, faits établis ou non, preuves, conséquences chiffrées et corrections publiques et datées.`,
  );
  lignes.push('');
  lignes.push(
    'SeneSource distingue clairement ce qui est établi de ce qui ne l’est pas, montre ses sources et corrige ses articles lorsque de nouveaux documents l’exigent. Directeur de la publication : Mouhamadou Fadal Diouf.',
  );
  lignes.push('');

  lignes.push('## À propos');
  lignes.push(`- [Notre méthode](${abs('/methode/')}) : hiérarchie des sources et vocabulaire de la preuve`);
  lignes.push(`- [Qui sommes-nous](${abs('/qui-sommes-nous/')})`);
  lignes.push(`- [Mentions légales](${abs('/mentions-legales/')})`);
  lignes.push(`- [Proposer une information](${abs('/contribuer/')})`);
  lignes.push('');

  lignes.push('## Articles');
  for (const d of articles) {
    lignes.push(`- [${d.titre}](${abs(`/article/${d.slug}/`)})`);
  }
  lignes.push('');

  if (rubriquesNonVides.length > 0) {
    lignes.push('## Rubriques');
    for (const r of rubriquesNonVides) {
      lignes.push(`- [${r.nom}](${abs(`/rubrique/${r.slug}/`)})`);
    }
    lignes.push('');
  }

  lignes.push('## Ressources');
  lignes.push(`- [Plan du site (sitemap)](${abs('/sitemap.xml')})`);
  lignes.push(`- [Flux RSS](${abs('/feed.xml')})`);
  lignes.push(`- Contact : ${SITE_CONTACT}`);
  lignes.push('');

  return new Response(lignes.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
