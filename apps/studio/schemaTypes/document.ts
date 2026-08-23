/**
 * Document `document` — miroir de `@senesource/domain.Document`.
 * Réutilisable entre dossiers : une pièce le référence (vraie référence
 * Sanity), le mapper B2 normalisera cette référence en `documentId` neutre
 * (jamais le slug — le slug reste une propriété éditoriale d'URL).
 * Le sens inverse « dossiers citant ce document » est CALCULÉ, jamais stocké.
 */
import { defineField, defineType } from 'sanity';

/** domain.ExtraitDocument */
export const extraitDocument = defineType({
  name: 'extraitDocument',
  title: 'Extrait cité',
  type: 'object',
  fields: [
    defineField({ name: 'page', title: 'Page', type: 'number', validation: (r) => r.required().integer().positive() }),
    defineField({ name: 'citation', title: 'Citation', type: 'text', rows: 3, validation: (r) => r.required() }),
    defineField({ name: 'annotation', title: 'Annotation', type: 'string' }),
  ],
  preview: { select: { page: 'page', citation: 'citation' }, prepare: ({ page, citation }) => ({ title: `p. ${page}`, subtitle: citation }) },
});

/** domain.Document */
export const document = defineType({
  name: 'documentSource',
  title: 'Document',
  type: 'document',
  fields: [
    defineField({ name: 'titre', title: 'Titre', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Slug (URL) — généré',
      type: 'slug',
      options: { source: 'titre', maxLength: 96 },
      validation: (r) => r.required(),
      description: 'Porte /documents/{slug}. Propriété éditoriale — n’est jamais la clé de relation.',
    }),
    defineField({ name: 'emetteur', title: 'Organisme émetteur', type: 'string', validation: (r) => r.required(), description: 'Chaîne en V1 (pas d’entité Organisation).' }),
    defineField({ name: 'type', title: 'Type de document', type: 'string', validation: (r) => r.required(), description: 'Ex. « Texte de loi », « Réponse administrative ».' }),
    defineField({ name: 'date', title: 'Date du document', type: 'date', options: { dateFormat: 'YYYY-MM-DD' }, description: 'Date ISO.' }),
    defineField({ name: 'urlOriginale', title: 'URL d’origine', type: 'url' }),
    defineField({ name: 'fichier', title: 'Fichier (PDF, etc.)', type: 'file', description: 'Le mapper en extraira l’URL et le type vers fichierUrl / fichierType.' }),
    defineField({ name: 'pages', title: 'Nombre de pages', type: 'number', validation: (r) => r.integer().positive() }),
    defineField({ name: 'extraits', title: 'Extraits cités', type: 'array', of: [{ type: 'extraitDocument' }] }),
  ],
  preview: { select: { title: 'titre', subtitle: 'emetteur' } },
});
