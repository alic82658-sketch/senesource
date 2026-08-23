import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'oug8iag3',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
});
