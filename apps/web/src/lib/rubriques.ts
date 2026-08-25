import type { Categorie } from '@senesource/domain';

export const RUBRIQUES: ReadonlyArray<{ nom: Categorie; slug: string }> = [
  { nom: 'Politique', slug: 'politique' },
  { nom: 'Économie', slug: 'economie' },
  { nom: 'Société', slug: 'societe' },
  { nom: 'Justice', slug: 'justice' },
  { nom: 'Santé', slug: 'sante' },
  { nom: 'Sport', slug: 'sport' },
  { nom: 'Faits divers', slug: 'faits-divers' },
  { nom: 'International', slug: 'international' },
];

export function rubriqueParSlug(slug: string) {
  return RUBRIQUES.find((rubrique) => rubrique.slug === slug);
}
