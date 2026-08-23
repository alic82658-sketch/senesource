import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemaTypes';
import { structure } from './structure';

/**
 * Studio SeneSource (B1) — schémas uniquement.
 *
 * Connecté au projet Sanity réel `oug8iag3` / dataset `production`.
 * `projectId`/`dataset` restent surchargeables par l'environnement
 * (`SANITY_STUDIO_PROJECT_ID` / `SANITY_STUDIO_DATASET`). Le projectId
 * n'est pas un secret (il est exposé dans le bundle client). L'édition et
 * le déploiement des schémas exigent une authentification Sanity
 * (`sanity login` ou `SANITY_AUTH_TOKEN`).
 */
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'oug8iag3';
const dataset = process.env.SANITY_STUDIO_DATASET || 'production';

export default defineConfig({
  name: 'senesource',
  title: 'SeneSource',
  projectId,
  dataset,
  plugins: [structureTool({ structure }), visionTool()],
  schema: { types: schemaTypes },
});
