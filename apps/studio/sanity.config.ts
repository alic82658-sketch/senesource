import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemaTypes';
import { structure } from './structure';

/**
 * Studio SeneSource (B1) — schémas uniquement.
 *
 * `projectId`/`dataset` viennent de l'environnement. Tant qu'aucun projet
 * Sanity n'est créé, une valeur de remplacement permet de compiler/valider
 * les schémas hors ligne ; se connecter à un vrai dataset (login + édition)
 * exige un projectId réel — voir docs/architecture/11-rapport-b1.md.
 */
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'placeholder-project-id';
const dataset = process.env.SANITY_STUDIO_DATASET || 'production';

export default defineConfig({
  name: 'senesource',
  title: 'SeneSource',
  projectId,
  dataset,
  plugins: [structureTool({ structure }), visionTool()],
  schema: { types: schemaTypes },
});
