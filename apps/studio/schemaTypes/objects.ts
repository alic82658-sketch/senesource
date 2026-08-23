/**
 * Sous-objets du dossier — miroir EXACT des interfaces de `@senesource/domain`.
 * Le schéma Sanity s'adapte au domaine, jamais l'inverse : chaque champ, son
 * type et son caractère requis/optionnel reproduisent le modèle neutre.
 * Les dates sont stockées en ISO (`type: 'date'`, `YYYY-MM-DD`) ; le rendu
 * « 18.08 » / « 21.08.2026 » appartient à `packages/editorial`.
 */
import { defineField, defineType } from 'sanity';
import { VERDICTS } from '@senesource/domain';

/** domain.Affirmation */
export const affirmation = defineType({
  name: 'affirmation',
  title: "Affirmation vérifiée",
  type: 'object',
  fields: [
    defineField({ name: 'texte', title: 'Texte de l’affirmation', type: 'text', rows: 3, validation: (r) => r.required() }),
    defineField({ name: 'provenance', title: 'Provenance (courte)', type: 'string', description: 'Ex. « Facebook · 18 août · 12 400 partages »' }),
    defineField({ name: 'provenanceLongue', title: 'Provenance (longue, desktop)', type: 'string' }),
  ],
  preview: { select: { title: 'texte' } },
});

/** domain.VerdictRendu */
export const verdictRendu = defineType({
  name: 'verdictRendu',
  title: 'Verdict',
  type: 'object',
  fields: [
    defineField({
      name: 'mot',
      title: 'Verdict',
      type: 'string',
      options: { list: VERDICTS.map((v) => ({ title: v, value: v })), layout: 'radio' },
      validation: (r) => r.required(),
      description: 'Un des cinq verdicts autorisés — jamais d’autre.',
    }),
    defineField({ name: 'resume', title: 'Résumé (avec renvois [n])', type: 'text', rows: 3, validation: (r) => r.required() }),
    defineField({ name: 'resumeCourt', title: 'Résumé court (mobile)', type: 'text', rows: 2 }),
  ],
  preview: { select: { title: 'mot', subtitle: 'resume' } },
});

/** domain.Instruction */
export const instruction = defineType({
  name: 'instruction',
  title: 'En instruction',
  type: 'object',
  fields: [
    defineField({ name: 'explication', title: 'Explication', type: 'text', rows: 3, validation: (r) => r.required() }),
    defineField({ name: 'prochainPoint', title: 'Prochain point', type: 'date', options: { dateFormat: 'YYYY-MM-DD' }, validation: (r) => r.required(), description: 'Date ISO ; l’affichage « 28.08 » est produit par packages/editorial.' }),
  ],
});

/** domain.Preuve */
export const preuve = defineType({
  name: 'preuve',
  title: 'Preuve',
  type: 'object',
  fields: [
    defineField({ name: 'texte', title: 'Énoncé (phrase complète)', type: 'text', rows: 2, validation: (r) => r.required() }),
    defineField({ name: 'texteCourt', title: 'Énoncé court (colonnes desktop)', type: 'string' }),
    defineField({ name: 'etabli', title: 'Établi ?', type: 'boolean', initialValue: false, validation: (r) => r.required() }),
    defineField({ name: 'meta', title: 'Métadonnée', type: 'string', description: 'Ex. « Établi · Pièce [1] ».' }),
    defineField({ name: 'mobile', title: 'Afficher sur mobile ?', type: 'boolean', initialValue: true, validation: (r) => r.required() }),
  ],
  preview: { select: { title: 'texte', subtitle: 'meta' } },
});

/** domain.PointCle */
export const pointCle = defineType({
  name: 'pointCle',
  title: 'Point-clé',
  type: 'object',
  fields: [
    defineField({ name: 'texte', title: 'Texte', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'etabli', title: 'Établi ?', type: 'boolean', initialValue: true, validation: (r) => r.required() }),
  ],
  preview: { select: { title: 'texte' } },
});

/**
 * domain.Piece — journal de collecte documentaire. JAMAIS un score : pas de
 * champ ordinal, pas d'agrégat. Seulement l'état « obtenue / non » par pièce.
 */
export const piece = defineType({
  name: 'piece',
  title: 'Pièce',
  type: 'object',
  fields: [
    defineField({ name: 'n', title: 'N° de pièce', type: 'number', validation: (r) => r.required().integer().positive() }),
    defineField({ name: 'titre', title: 'Titre', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'titreCourt', title: 'Titre court (rail)', type: 'string' }),
    defineField({ name: 'meta', title: 'Métadonnée', type: 'string', description: 'Ex. « Obtenu 19.08 · PDF 48 p. » ou « Demandée 04.08 · Sans réponse ».' }),
    defineField({ name: 'obtenue', title: 'Obtenue ?', type: 'boolean', initialValue: false, validation: (r) => r.required() }),
    defineField({ name: 'rail', title: 'Afficher dans le rail « ce qui manque » ?', type: 'boolean', initialValue: false, validation: (r) => r.required() }),
    // Relation Piece → Document : VRAIE référence Sanity ; le mapper la
    // normalise en `documentId` neutre (pas le slug). Optionnelle.
    defineField({ name: 'document', title: 'Document lié', type: 'reference', to: [{ type: 'documentSource' }] }),
  ],
  preview: { select: { n: 'n', title: 'titre', obtenue: 'obtenue' }, prepare: ({ n, title, obtenue }) => ({ title: `[${n}] ${title}`, subtitle: obtenue ? 'Obtenue' : 'Manquante' }) },
});

/** domain.TexteOfficiel */
export const texteOfficiel = defineType({
  name: 'texteOfficiel',
  title: 'Texte officiel cité',
  type: 'object',
  fields: [
    defineField({ name: 'texte', title: 'Citation (longue)', type: 'text', rows: 4, validation: (r) => r.required() }),
    defineField({ name: 'texteCourt', title: 'Citation tronquée (mobile)', type: 'text', rows: 3 }),
    defineField({ name: 'cote', title: 'Cote', type: 'string', validation: (r) => r.required(), description: 'Ex. « LFR 2025 · Art. 12 al. 1 · P. 14 ».' }),
    defineField({ name: 'action', title: 'Libellé d’action', type: 'string', description: 'Ex. « Ouvrir le document → ».' }),
    defineField({ name: 'actionCourte', title: 'Libellé d’action (mobile)', type: 'string' }),
  ],
});

/**
 * domain.Consequence — « Ce que ça change ». Un chiffre est TOUJOURS
 * accompagné de son hypothèse (validation croisée côté document pour
 * `consequenceDossier`).
 */
export const consequence = defineType({
  name: 'consequence',
  title: 'Conséquence chiffrée',
  type: 'object',
  fields: [
    defineField({ name: 'profil', title: 'Profil / sélecteur', type: 'string', validation: (r) => r.required(), description: 'Ex. « Taxi », « Choisir ».' }),
    defineField({ name: 'chiffre', title: 'Chiffre', type: 'string', validation: (r) => r.required(), description: 'Ex. « 78 000 F ». Les espaces fines sont posées à l’affichage.' }),
    defineField({ name: 'qualification', title: 'Qualification', type: 'text', rows: 2, validation: (r) => r.required() }),
    defineField({ name: 'qualificationDesktop', title: 'Qualification (desktop)', type: 'text', rows: 2 }),
    defineField({ name: 'hypothese', title: 'Hypothèse de calcul', type: 'text', rows: 2, description: 'Ex. « Hypothèse : 30 000 F/semaine · 52 semaines ».' }),
    defineField({ name: 'note', title: 'Note', type: 'string' }),
    defineField({ name: 'noteAccent', title: 'Note (accent)', type: 'string' }),
    defineField({ name: 'action', title: 'Libellé d’action', type: 'string' }),
  ],
  preview: { select: { title: 'chiffre', subtitle: 'profil' } },
});

/** domain.EncartAbsence — pourquoi aucun chiffre (§7 : jamais de vide). */
export const encartAbsence = defineType({
  name: 'encartAbsence',
  title: 'Encart « pourquoi pas de chiffre »',
  type: 'object',
  fields: [
    defineField({ name: 'label', title: 'Label', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'texte', title: 'Texte', type: 'text', rows: 3, validation: (r) => r.required() }),
  ],
});

/** domain.ChiffreCle — chiffre-clé d'une carte de dossier secondaire. */
export const chiffreCle = defineType({
  name: 'chiffreCle',
  title: 'Chiffre-clé (carte)',
  type: 'object',
  fields: [
    defineField({ name: 'valeur', title: 'Valeur', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'qualification', title: 'Qualification', type: 'string', validation: (r) => r.required() }),
  ],
});

/** domain.EntreeHistorique — mise à jour éditoriale publique et datée. */
export const entreeHistorique = defineType({
  name: 'entreeHistorique',
  title: 'Entrée d’historique',
  type: 'object',
  fields: [
    defineField({ name: 'version', title: 'Version', type: 'number', validation: (r) => r.required().integer() }),
    defineField({ name: 'date', title: 'Date', type: 'date', options: { dateFormat: 'YYYY-MM-DD' }, validation: (r) => r.required(), description: 'Date ISO ; l’affichage est produit par packages/editorial.' }),
    defineField({ name: 'note', title: 'Note', type: 'string', validation: (r) => r.required() }),
  ],
  preview: { select: { v: 'version', date: 'date', note: 'note' }, prepare: ({ v, date, note }) => ({ title: `V${v} · ${date}`, subtitle: note }) },
});

export const objectTypes = [
  affirmation,
  verdictRendu,
  instruction,
  preuve,
  pointCle,
  piece,
  texteOfficiel,
  consequence,
  encartAbsence,
  chiffreCle,
  entreeHistorique,
];
