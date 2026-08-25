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
 * Le schéma de validation (Zod) vit dans `apps/web` (content.config.ts) et
 * le mapping/les règles dans `packages/editorial` — tous se conforment à ces
 * types, jamais l'inverse.
 */

/**
 * Date au format ISO `YYYY-MM-DD`. C'est la SEULE représentation de date du
 * domaine. Le rendu éditorial (« 18.08 », « 21.08.2026 ») vit dans
 * `packages/editorial` (dateJourMois, dateComplete). Jamais de date d'affichage
 * partielle dans le domaine.
 */
export type DateISO = string;

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
export const TYPES_DOSSIER = ['verification', 'impact', 'document', 'explication'] as const;
export type TypeDossier = (typeof TYPES_DOSSIER)[number];

export const CATEGORIES = [
  'Politique',
  'Économie',
  'Société',
  'Justice',
  'Santé',
  'Sport',
  'Faits divers',
  'International',
] as const;
export type Categorie = (typeof CATEGORIES)[number];

/** Statuts publics d'un dossier (« brouillon » = draft, hors modèle public). */
export const STATUTS_DOSSIER = ['en_instruction', 'publie', 'archive'] as const;
export type StatutDossier = (typeof STATUTS_DOSSIER)[number];

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
  prochainPoint: DateISO;
}

export interface Preuve {
  texte: string;
  texteCourt?: string;
  etabli: boolean;
  meta?: string;
  mobile: boolean;
}

/**
 * Un passage cité d'un document, à une page précise.
 */
export interface ExtraitDocument {
  page: number;
  citation: string;
  annotation?: string;
}

/**
 * Document original, réutilisable entre plusieurs dossiers.
 * `id` est l'identifiant NEUTRE (normalisé depuis `_id` Sanity par l'adapter) ;
 * `slug` est une propriété ÉDITORIALE (porte l'URL /documents/{slug}), jamais
 * la clé de relation. Le sens inverse « dossiers citant ce document » est
 * CALCULÉ (jamais stocké ici).
 */
export interface Document {
  id: string;
  slug: string;
  titre: string;
  emetteur: string; // organisme émetteur — chaîne en V1
  type: string; // « Texte de loi », « Réponse administrative »… (chaîne V1)
  date?: DateISO;
  urlOriginale?: string;
  fichierUrl?: string;
  fichierType?: string;
  pages?: number;
  extraits: ExtraitDocument[];
}

/** Référence légère vers un dossier (pour le sens inverse calculé). */
export interface DossierRef {
  numero: number;
  slug: string;
  titre: string;
}

/** Point focal normalisé (0–1), pour le cadrage responsive. */
export interface PointFocal {
  x: number;
  y: number;
}

/**
 * Illustration FACULTATIVE. Un dossier reste visuellement complet sans image ;
 * aucune illustration n'est obligatoire. En l'absence d'illustration, le bloc
 * n'est pas rendu — jamais de placeholder vide côté lecteur (règle produit,
 * voir docs/architecture/14-illustrations-spec.md).
 *
 * `alt` est obligatoire dès qu'une image existe (accessibilité). `src`,
 * dimensions et `focal` sont résolus par l'adapter (Sanity/CDN) ; les autres
 * champs sont éditoriaux.
 */
export interface Illustration {
  src: string; // URL de l'image (résolue par l'adapter)
  alt: string; // texte alternatif — requis si image présente
  largeur?: number;
  hauteur?: number;
  focal?: PointFocal; // point focal / cadrage
  legende?: string;
  credit?: string;
  sourceUrl?: string;
  droits?: string; // information de droits / licence
}

/** Vue calculée : un document + les dossiers qui le citent (non stockée). */
export interface DocumentAvecUsages extends Document {
  utilisePar: DossierRef[];
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
  /**
   * Lien vers le document original — par son identifiant NEUTRE (`Document.id`),
   * jamais par son slug. Dans Sanity c'est une vraie référence ; le mapper la
   * normalise en `documentId`. Optionnel : une pièce peut n'en avoir aucun.
   */
  documentId?: string;
  /**
   * Lien EXTERNE direct vers la source originale (URL publique du document).
   * Facultatif — permet au lecteur d'atteindre la pièce sans passer par une
   * entité `Document` (« Les faits, jusqu'à la source »). N'introduit aucune
   * architecture de documents ; complémentaire de `documentId`.
   */
  url?: string;
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
  date: DateISO;
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
  categorie: Categorie;
  statut: StatutDossier;
  ouvertLe?: DateISO;
  version?: number;
  misAJourLe?: DateISO;
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

  // Illustrations — toutes FACULTATIVES (un dossier fonctionne sans image).
  illustration?: Illustration; // 1. illustration principale du dossier
  illustrationsContenu?: Illustration[]; // 2. illustrations intégrées au contenu
  partageSocial?: Illustration; // 3. visuel de partage social (sinon défaut de marque)

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
