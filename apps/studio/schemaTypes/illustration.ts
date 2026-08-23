/**
 * Objet `illustration` — miroir de `@senesource/domain.Illustration`.
 * FACULTATIF partout. Type `image` avec `hotspot` (point focal + cadrage) ;
 * le mapper résoudra l'asset en `src` + dimensions et le hotspot en `focal`.
 * `alt` obligatoire dès qu'une image est posée (accessibilité).
 */
import { defineField, defineType } from 'sanity';

export const illustration = defineType({
  name: 'illustration',
  title: 'Illustration',
  type: 'image',
  options: { hotspot: true }, // point focal / cadrage responsive
  fields: [
    defineField({
      name: 'alt',
      title: 'Texte alternatif',
      type: 'string',
      validation: (r) => r.required(),
      description: 'Obligatoire (accessibilité). Décrit l’image pour les lecteurs d’écran.',
    }),
    defineField({ name: 'legende', title: 'Légende', type: 'string' }),
    defineField({ name: 'credit', title: 'Crédit', type: 'string' }),
    defineField({ name: 'sourceUrl', title: 'URL de la source', type: 'url' }),
    defineField({ name: 'droits', title: 'Information de droits', type: 'string', description: 'Licence, autorisation, mention obligatoire…' }),
  ],
});
