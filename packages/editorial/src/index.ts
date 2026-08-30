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
 * Dates : le DOMAINE stocke de l'ISO (`YYYY-MM-DD`) ; le RENDU au format
 * SeneSource vit ici (handoff : « 18.08 », « 21.08.2026 »). Ces fonctions
 * seront branchées quand le web sera alimenté par des dates ISO (B2/B3) ;
 * elles n'affectent pas le rendu MDX actuel.
 */
const ISO_JOUR = /^(\d{4})-(\d{2})-(\d{2})/;

/** ISO `2026-08-18` → « 18.08 » (jour.mois, sans année). */
export function dateJourMois(iso: string): string {
  const m = ISO_JOUR.exec(iso);
  return m ? `${m[3]}.${m[2]}` : iso;
}

/** ISO `2026-08-21` → « 21.08.2026 » (jour.mois.année). */
export function dateComplete(iso: string): string {
  const m = ISO_JOUR.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
}

/**
 * ISO avec fuseau → « 30 août 2026 à 15 h 49 », toujours à l'heure de Dakar.
 * À utiliser uniquement lorsqu'un véritable horodatage est disponible.
 */
export function dateHeureDakar(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const fuseau = 'Africa/Dakar';
  const dateLisible = new Intl.DateTimeFormat('fr-FR', {
    timeZone: fuseau,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  const heure = new Intl.DateTimeFormat('fr-FR', {
    timeZone: fuseau,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const h = heure.find((p) => p.type === 'hour')?.value;
  const min = heure.find((p) => p.type === 'minute')?.value;

  return h && min ? `${dateLisible} à ${h} h ${min}` : dateLisible;
}

/**
 * Espaces fines insécables (U+202F) : séparateur de milliers et espace avant
 * « F ». Un montant ne se coupe jamais en fin de ligne (handoff §2).
 */
export function fines(s: string): string {
  return s.replace(/(\d) (?=\d)/g, '$1 ').replace(/(\d) F/g, '$1 F');
}

/**
 * Ponctuation française haute : le signe reste attaché au mot qui le précède.
 * Cette règle évite notamment qu'un « : », « ; », « ! » ou « ? » se retrouve
 * seul au début d'une ligne dans un titre, sur le web comme dans la future app.
 */
export function ponctuationInsecable(s: string): string {
  return s.replace(/[ \u00a0\u202f]+([:;!?])/g, '\u00a0$1');
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
