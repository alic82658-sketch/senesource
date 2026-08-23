/**
 * @senesource/editorial — règles éditoriales PARTAGEABLES entre le web,
 * la future app Expo et le futur CMS. Formatage, verdicts, présentation des
 * impacts, calculs de collecte. Dépend UNIQUEMENT de `@senesource/domain`
 * (aucun framework, aucune bibliothèque de rendu).
 *
 * Règle de périmètre : n'entre ici que ce qui a une vocation RÉELLE de
 * partage. L'accès aux données propre à Astro (`getCollection`, le mapping
 * `entry.data` → domaine) reste dans `apps/web` (couche d'adaptation).
 */
import type { Dossier } from '@senesource/domain';

/** Formate un numéro de dossier sur trois chiffres : 41 → « 041 ». */
export function numeroAffiche(n: number): string {
  return String(n).padStart(3, '0');
}

/**
 * Espaces fines insécables (U+202F) : séparateur de milliers et espace avant
 * « F ». Un montant ne se coupe jamais en fin de ligne (handoff §2).
 */
export function fines(s: string): string {
  return s.replace(/(\d) (?=\d)/g, '$1 ').replace(/(\d) F/g, '$1 F');
}

/**
 * Nombre de pièces obtenues sur le total — journal de collecte documentaire,
 * JAMAIS un score de vérité (règle produit).
 */
export function collecte(d: Dossier): { obtenues: number; total: number } {
  const total = d.pieces.length;
  const obtenues = d.pieces.filter((p) => p.obtenue).length;
  return { obtenues, total };
}

/**
 * Découpe un texte contenant des renvois « [n] » en segments, pour rendre
 * chaque renvoi avec son style (handoff §6.2 : passage souligné ocre).
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
