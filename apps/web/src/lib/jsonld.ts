/**
 * Données structurées (schema.org / JSON-LD) — INVISIBLES.
 *
 * Ces balises n'affichent rien ; elles décrivent le site et les articles aux
 * moteurs de recherche et d'actualité. Toutes les URL sont résolues en absolu
 * sur le domaine du site (`Astro.site`, cf. astro.config.mjs).
 *
 * NOM_AUTEUR n'étant pas encore décidé, l'auteur des articles est
 * provisoirement l'organisation SeneSource (à revoir quand le directeur de la
 * publication sera fixé — cf. tâche 3 du brief d'indexation).
 */

export const SITE_NOM = 'SeneSource';
export const SITE_SLOGAN = 'L’actualité qui vous instruit.';
export const SITE_DESCRIPTION =
  'SeneSource explique l’actualité sénégalaise à partir des faits, des documents et de leurs conséquences concrètes.';
export const SITE_CONTACT = 'contact@senesource.com';

/** Résout un chemin en URL absolue sur le domaine du site. */
function abs(chemin: string, site: URL): string {
  return new URL(chemin, site).href;
}

/** Organisation SeneSource, éditeur/publisher — avec logo raster. */
export function editeurLD(site: URL) {
  return {
    '@type': 'Organization',
    '@id': abs('/#organisation', site),
    name: SITE_NOM,
    url: abs('/', site),
    logo: {
      '@type': 'ImageObject',
      url: abs('/og/logo.png', site),
      width: 512,
      height: 128,
    },
    email: SITE_CONTACT,
    description: SITE_DESCRIPTION,
  };
}

/** JSON-LD de l'accueil : Organization + WebSite. */
export function organisationEtSiteLD(site: URL) {
  return [
    {
      '@context': 'https://schema.org',
      ...editeurLD(site),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': abs('/#site', site),
      url: abs('/', site),
      name: SITE_NOM,
      description: SITE_DESCRIPTION,
      inLanguage: 'fr',
      publisher: { '@id': abs('/#organisation', site) },
    },
  ];
}

interface ArticleLDEntree {
  site: URL;
  /** URL canonique absolue de l'article. */
  urlCanonique: string;
  titre: string;
  description: string;
  /** Chemin (ou URL) de l'illustration en aperçu — sera résolu en absolu. */
  image?: string;
  /** Date de première publication, ISO `YYYY-MM-DD`. */
  datePublication?: string;
  /** Date de mise à jour, ISO `YYYY-MM-DD`. */
  dateMiseAJour?: string;
}

/** JSON-LD d'un article : NewsArticle. */
export function articleLD(e: ArticleLDEntree) {
  const datePub = e.datePublication ?? e.dateMiseAJour;
  const dateMaj = e.dateMiseAJour ?? e.datePublication;
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: e.titre,
    description: e.description,
    ...(e.image ? { image: [abs(e.image, e.site)] } : {}),
    ...(datePub ? { datePublished: datePub } : {}),
    ...(dateMaj ? { dateModified: dateMaj } : {}),
    // Auteur provisoire = organisation SeneSource (NOM_AUTEUR non défini).
    author: { '@type': 'Organization', name: SITE_NOM, url: abs('/', e.site) },
    publisher: editeurLD(e.site),
    mainEntityOfPage: { '@type': 'WebPage', '@id': e.urlCanonique },
    inLanguage: 'fr',
  };
}
