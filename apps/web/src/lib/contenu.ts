/**
 * Couche d'accès au contenu — ADAPTATEUR Astro.
 *
 * C'est le seul endroit du code web qui manipule la forme Astro
 * (`getCollection`, `entry.data`, `entry.id`). Il mappe les collections MDX
 * locales vers le modèle de domaine neutre (`@senesource/domain`) et n'expose
 * que lui. Les règles partageables (formatage, verdicts, collecte, renvois)
 * viennent de `@senesource/editorial` et sont ré-exportées ici pour que les
 * gabarits gardent un point d'entrée unique, sans connaître les paquets.
 *
 * Migration (Phase B) : remplacer `getCollection` + `mapDossier` par une autre
 * source (Sanity…) sans toucher aux gabarits — c'est ce que cette frontière
 * rend possible.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import type { Dossier } from '@senesource/domain';

// Type de domaine ré-exporté depuis la couche d'accès (point d'entrée unique
// des gabarits, qui n'importent jamais `astro:content` ni les paquets).
export type { Dossier } from '@senesource/domain';
// Règles éditoriales partageables, ré-exportées telles quelles.
export { numeroAffiche, fines, collecte, segmentsRenvois, type Segment } from '@senesource/editorial';

/**
 * Mapping Astro → domaine. Le `slug` (identité d'URL) vient de `entry.id`
 * (nom de fichier « 041-… »), les champs éditoriaux de `entry.data`.
 *
 * Garde de dérive au compile : le retour est typé `Dossier`. Si le schéma de
 * contenu (content.config.ts) cessait de fournir un champ attendu par le
 * domaine, TypeScript échouerait ici — le mapper est le point de contrôle.
 */
function mapDossier(entry: CollectionEntry<'dossiers'>): Dossier {
  return { ...entry.data, slug: entry.id };
}

/** Dossiers visibles du public (publiés ou en instruction), plus récents d'abord. */
export async function listeDossiers(): Promise<Dossier[]> {
  const tous = await getCollection('dossiers', ({ data }) =>
    ['publie', 'en_instruction'].includes(data.statut),
  );
  return tous.map(mapDossier).sort((a, b) => b.numero - a.numero);
}

/** Dossiers disposant d'une page complète (V0.1 : le 041 uniquement). */
export async function dossiersAvecPage(): Promise<Dossier[]> {
  return (await listeDossiers()).filter((d) => d.pageComplete);
}
