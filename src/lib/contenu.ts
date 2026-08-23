/**
 * Couche d'accès au contenu — seule porte vers les collections.
 * En V0.1 elle lit les collections MDX locales ; une future source
 * (CMS, base) se branchera ici sans toucher aux gabarits.
 */
import { getCollection, type CollectionEntry } from 'astro:content';

export type Dossier = CollectionEntry<'dossiers'>;

/** Formate un numéro de dossier sur trois chiffres : 41 → « 041 ». */
export function numeroAffiche(n: number): string {
  return String(n).padStart(3, '0');
}

/** Dossiers visibles du public (publiés ou en instruction), plus récents d'abord. */
export async function listeDossiers(): Promise<Dossier[]> {
  const tous = await getCollection('dossiers', ({ data }) =>
    ['publie', 'en_instruction'].includes(data.statut),
  );
  return tous.sort((a, b) => b.data.numero - a.data.numero);
}

/** Dossiers disposant d'une page complète (V0.1 : le 041 uniquement). */
export async function dossiersAvecPage(): Promise<Dossier[]> {
  return (await listeDossiers()).filter((d) => d.data.pageComplete);
}

/** Nombre de pièces obtenues — journal de collecte, jamais un score. */
export function collecte(d: Dossier): { obtenues: number; total: number } {
  const total = d.data.pieces.length;
  const obtenues = d.data.pieces.filter((p) => p.obtenue).length;
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
