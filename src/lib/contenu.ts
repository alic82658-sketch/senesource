/**
 * Couche d'accès au contenu — SEUL point du code où la forme Astro
 * (`CollectionEntry`, `entry.data`, `entry.id`) est manipulée. Elle mappe
 * les collections MDX locales vers le modèle de DOMAINE neutre
 * (`src/domain/dossier.ts`) et n'expose que lui. Les gabarits ne voient
 * jamais Astro : ils consomment des `Dossier` plats.
 *
 * Migration (A2 / Phase B) : remplacer `mapDossier` + `getCollection` par
 * une autre implémentation (paquet `editorial`, source Sanity…) sans toucher
 * aux gabarits — c'est précisément ce que cette frontière rend possible.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import type { Dossier } from '../domain/dossier';

// Le type de domaine est ré-exporté ici pour que les gabarits l'importent
// depuis la couche d'accès (un seul point d'entrée), sans connaître `astro:content`.
export type { Dossier } from '../domain/dossier';

/**
 * Mapping Astro → domaine. Le `slug` (identité d'URL) vient de `entry.id`
 * (nom de fichier « 041-… »), les champs éditoriaux de `entry.data`.
 *
 * Garde de dérive au compile : le retour est typé `Dossier`. Si le schéma
 * de contenu (content.config.ts) cessait de fournir un champ attendu par le
 * domaine, TypeScript échouerait ici — le mapper est le point de contrôle.
 */
function mapDossier(entry: CollectionEntry<'dossiers'>): Dossier {
  return { ...entry.data, slug: entry.id };
}

/** Formate un numéro de dossier sur trois chiffres : 41 → « 041 ». */
export function numeroAffiche(n: number): string {
  return String(n).padStart(3, '0');
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

/** Nombre de pièces obtenues — journal de collecte, jamais un score. */
export function collecte(d: Dossier): { obtenues: number; total: number } {
  const total = d.pieces.length;
  const obtenues = d.pieces.filter((p) => p.obtenue).length;
  return { obtenues, total };
}

/** Espace fine insécable (U+202F) en séparateur de milliers — règle §2. */
export function fines(s: string): string {
  return s.replace(/(\d) (?=\d)/g, '$1 ').replace(/(\d) F/g, '$1 F');
}

/**
 * Découpe un texte contenant des renvois « [n] » en segments,
 * pour rendre chaque renvoi avec son style (§6.2 : passage souligné ocre).
 */
export type Segment = { type: 'texte'; valeur: string } | { type: 'renvoi'; valeur: string };
export function segmentsRenvois(texte: string): Segment[] {
  const out: Segment[] = [];
  let reste = texte;
  const re = /\[(\d+)\]/;
  let m: RegExpExecArray | null;
  while ((m = re.exec(reste))) {
    if (m.index > 0) out.push({ type: 'texte', valeur: reste.slice(0, m.index) });
    out.push({ type: 'renvoi', valeur: m[0] });
    reste = reste.slice(m.index + m[0].length);
  }
  if (reste) out.push({ type: 'texte', valeur: reste });
  return out;
}
