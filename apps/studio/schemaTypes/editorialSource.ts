import { defineField, defineType } from 'sanity';

export const editorialSource = defineType({
  name: 'editorialSource',
  title: 'Source éditoriale',
  type: 'document',
  fields: [
    defineField({
      name: 'nom',
      title: 'Nom',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
    }),
    defineField({
      name: 'typeSource',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Institutionnelle', value: 'institutionnelle' },
          { title: 'Média', value: 'media' },
          { title: 'Club / organisation', value: 'club_organisation' },
          { title: 'Réseau social officiel', value: 'reseau_officiel' },
          { title: 'Base de données', value: 'base_donnees' },
          { title: 'Autre', value: 'autre' },
        ],
      },
    }),
    defineField({
      name: 'fiabilite',
      title: 'Fiabilité',
      type: 'string',
      options: {
        list: [
          { title: 'Primaire', value: 'primaire' },
          { title: 'Élevée', value: 'elevee' },
          { title: 'Moyenne', value: 'moyenne' },
          { title: 'À recouper', value: 'a_recouper' },
        ],
      },
      initialValue: 'moyenne',
    }),
    defineField({
      name: 'medias',
      title: 'Médias concernés',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'SeneSource', value: 'senesource' },
          { title: 'XamXam', value: 'xamxam' },
          { title: 'Lions', value: 'lions' },
        ],
      },
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'actif',
      title: 'Source active',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'nom',
      subtitle: 'typeSource',
    },
  },
});
