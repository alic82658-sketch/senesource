import { defineField, defineType } from 'sanity';

export const editorialItem = defineType({
  name: 'editorialItem',
  title: 'Sujet éditorial',
  type: 'document',
  fields: [
    defineField({
      name: 'titre',
      title: 'Sujet',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'media',
      title: 'Média',
      type: 'string',
      options: {
        layout: 'radio',
        list: [
          { title: 'SeneSource', value: 'senesource' },
          { title: 'XamXam', value: 'xamxam' },
          { title: 'Lions', value: 'lions' },
          { title: 'À décider', value: 'a_decider' },
        ],
      },
      initialValue: 'a_decider',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'statut',
      title: 'Statut',
      type: 'string',
      options: {
        list: [
          { title: 'Radar', value: 'radar' },
          { title: 'À valider', value: 'a_valider' },
          { title: 'Validé', value: 'valide' },
          { title: 'Publié', value: 'publie' },
          { title: 'Rejeté', value: 'rejete' },
          { title: 'Archivé', value: 'archive' },
        ],
      },
      initialValue: 'radar',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'urgence',
      title: 'Urgence',
      type: 'string',
      options: {
        list: [
          { title: 'Faible', value: 'faible' },
          { title: 'Normale', value: 'normale' },
          { title: 'Haute', value: 'haute' },
          { title: 'Immédiate', value: 'immediate' },
        ],
      },
      initialValue: 'normale',
    }),
    defineField({
      name: 'score',
      title: 'Score /10',
      type: 'number',
      validation: (Rule) => Rule.min(0).max(10),
    }),
    defineField({
      name: 'scoreDetail',
      title: 'Détail du score',
      type: 'object',
      fields: [
        { name: 'impact', title: 'Impact /3', type: 'number', validation: (Rule) => Rule.min(0).max(3) },
        { name: 'fiabilite', title: 'Fiabilité /2', type: 'number', validation: (Rule) => Rule.min(0).max(2) },
        { name: 'nouveaute', title: 'Nouveauté /2', type: 'number', validation: (Rule) => Rule.min(0).max(2) },
        { name: 'utilite', title: 'Utilité /2', type: 'number', validation: (Rule) => Rule.min(0).max(2) },
        { name: 'audience', title: 'Potentiel audience /1', type: 'number', validation: (Rule) => Rule.min(0).max(1) },
      ],
    }),
    defineField({
      name: 'angle',
      title: 'Angle proposé',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'resume',
      title: 'Fait essentiel',
      type: 'text',
      rows: 5,
    }),
    defineField({
      name: 'sources',
      title: 'Sources',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'editorialSource' }] }],
    }),
    defineField({
      name: 'sourceUrls',
      title: 'Liens sources rapides',
      type: 'array',
      of: [{ type: 'url' }],
    }),
    defineField({
      name: 'brouillon',
      title: 'Brouillon / notes',
      type: 'text',
      rows: 14,
    }),
    defineField({
      name: 'social',
      title: 'Déclinaisons réseaux',
      type: 'object',
      fields: [
        { name: 'x', title: 'X', type: 'text', rows: 5 },
        { name: 'facebook', title: 'Facebook', type: 'text', rows: 6 },
        { name: 'linkedin', title: 'LinkedIn', type: 'text', rows: 6 },
        { name: 'whatsapp', title: 'WhatsApp', type: 'text', rows: 5 },
      ],
    }),
    defineField({
      name: 'briefVisuel',
      title: 'Brief visuel',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'urlPubliee',
      title: 'URL publiée',
      type: 'url',
    }),
    defineField({
      name: 'dateDetection',
      title: 'Détecté le',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'datePublication',
      title: 'Publié le',
      type: 'datetime',
    }),
  ],
  preview: {
    select: {
      title: 'titre',
      media: 'media',
      statut: 'statut',
      score: 'score',
    },
    prepare({ title, media, statut, score }) {
      const scoreLabel = typeof score === 'number' ? ` · ${score}/10` : '';
      return {
        title,
        subtitle: `${media || 'a_decider'} · ${statut || 'radar'}${scoreLabel}`,
      };
    },
  },
});
