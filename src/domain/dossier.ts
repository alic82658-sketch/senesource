/**
 * Modèle de domaine SeneSource — NEUTRE.
 *
 * Ce module ne dépend d'AUCUN framework : ni Astro, ni Sanity, ni Expo, ni
 * Zod. Ce sont des types TypeScript purs, écrits à la main. Ils constituent
 * le contrat que toutes les surfaces (web Astro aujourd'hui, app et CMS
 * demain) partageront à l'identique.
 *
 * Sens des dépendances (architecture app-first, docs 08) :
 *     domain  ←  editorial  ←  (web, mobile)
 * `domain` est la feuille : il n'importe personne, tout le monde l'importe.
 * Le schéma de validation (Zod) et le mapping vivent en dehors d'ici — dans
 * la couche Astro (`src/lib/contenu.ts`) en A1, puis `packages/editorial`
 * en A2 — et se conforment à ces types, jamais l'inverse.
 *
 * NB (A1) : ce dossier deviendra `packages/domain` en A2, par simple
 * déplacement — aucun de ces types ne référence quoi que ce soit d'externe.
 */

/** Les cinq verdicts autorisés (handoff §4.1) — jamais d'autres. */
export const VERDICTS = [
  'Exact',
  'Exact, mais partiel',
  'Trompeur',
  'Faux',
  'Invérifiable',
] as const;
export type Verdict = (typeof VERDICTS)[number];

/** Un dossier n'est pas forcément un fact-check (modèle multi-type). */
export type TypeDossier = 'verification' | 'impact' | 'document' | 'explication';

/** Statuts publics d'un dossier (« brouillon » = draft, hors modèle public). */
export type StatutDossier = 'en_instruction' | 'publie' | 'archive';

export interface Affirmation {
  texte: string;
  provenance?: string;
  provenanceLongue?: string;
}

export interface VerdictRendu {
  mot: Verdict;
  resume: string;
  resumeCourt?: string;
}

export interface Instruction {
  explication: string;
  prochainPoint: string;
}

export interface Preuve {
  texte: string;
  texteCourt?: string;
  etabli: boolean;
  meta?: string;
  mobile: boolean;
}

export interface PointCle {
  texte: string;
  etabli: boolean;
}

/**
 * Une pièce = un état de collecte documentaire. JAMAIS agrégée en score de
 * vérité : aucun champ ordinal, aucun booléen sommable au-delà du décompte
 * « obtenues / total » (règle produit).
 */
export interface Piece {
  n: number;
  titre: string;
  titreCourt?: string;
  meta?: string;
  obtenue: boolean;
  rail: boolean;
}

export interface TexteOfficiel {
  texte: string;
  texteCourt?: string;
  cote: string;
  action?: string;
  actionCourte?: string;
}

/** Un chiffre-conséquence est toujours accompagné de son hypothèse (§7). */
export interface Consequence {
  profil: string;
  chiffre: string;
  qualification: string;
  qualificationDesktop?: string;
  hypothese?: string;
  note?: string;
  noteAccent?: string;
  action?: string;
}

export interface EncartAbsence {
  label: string;
  texte: string;
}

export interface ChiffreCle {
  valeur: string;
  qualification: string;
}

export interface EntreeHistorique {
  version: number;
  date: string;
  note: string;
}

/**
 * Champs éditoriaux d'un dossier, indépendants de la source.
 * Le `Dossier` complet (ci-dessous) y ajoute l'identité de ressource (`slug`).
 */
export interface DossierChamps {
  numero: number;
  type: TypeDossier;
  titre: string;
  titreCourt?: string;
  rubrique: string;
  statut: StatutDossier;
  ouvertLe?: string;
  version?: number;
  misAJourLe?: string;
  resume?: string;

  affirmation?: Affirmation;
  verdict?: VerdictRendu;
  instruction?: Instruction;

  preuves: Preuve[];
  nonEtabliMeta?: string;
  pointsCles: PointCle[];

  pieces: Piece[];

  texteOfficiel?: TexteOfficiel;

  consequenceHome?: Consequence;
  consequenceDossier?: Consequence;
  encartAbsence?: EncartAbsence;

  chiffreCle?: ChiffreCle;

  historique: EntreeHistorique[];

  pageComplete: boolean;
}

/**
 * Le Dossier tel que le consomment les gabarits : ses champs éditoriaux
 * plus son identité de ressource stable `slug` (« 041-taxe-… »), qui porte
 * l'URL permanente `/dossier/{slug}`. Aucun objet d'infrastructure
 * (`entry.data`, `entry.id`…) ne franchit cette frontière.
 */
export interface Dossier extends DossierChamps {
  slug: string;
}
