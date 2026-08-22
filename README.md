# SeneSource

Média numérique sénégalais de vérification documentaire : dossiers numérotés, verdicts,
conséquences chiffrées, preuves, registre public.

## État du projet

**Phase : analyse d'architecture pré-V0 (synthèse v2 validée dans son principe, révisée
Astro-first).** Aucun code produit n'est encore écrit.

⛔ **Bloquant :** le handoff Claude Design (source de vérité visuelle) sera fourni
séparément et devra être déposé dans `design/handoff/` avant le démarrage de la phase V0.

## Documentation

| Document | Contenu |
|---|---|
| [`docs/architecture/00-synthese.md`](docs/architecture/00-synthese.md) | **Synthèse v2** : stack Astro (comparatif vs Next.js), structure du dépôt, composants V0, pages V0.1, points bloquants |
| [`docs/architecture/01-design-system.md`](docs/architecture/01-design-system.md) | Structure des tokens, Tailwind v4 purgé, composants V0, les 47 questions au handoff |
| [`docs/architecture/02-modele-de-donnees.md`](docs/architecture/02-modele-de-donnees.md) | *Référence future* — modèle base de données pour la phase CMS/backend différée |
| [`docs/architecture/03-frontend-et-cms.md`](docs/architecture/03-frontend-et-cms.md) | Routes, SEO/ClaimReview, états par gabarit (valides) ; section CMS différée |
| [`docs/architecture/04-qa-protocoles.md`](docs/architecture/04-qa-protocoles.md) | Protocoles d'audit, seuils, états dégradés, conditions GO/NO-GO |
| [`docs/architecture/05-contenu-mdx.md`](docs/architecture/05-contenu-mdx.md) | **Modèle de contenu V1** : collections MDX, schémas frontmatter/Zod, taxonomies, flux de publication Git |

## Stack retenue (à valider)

Astro (sortie statique) · TypeScript strict · Tailwind CSS v4 (tokens SeneSource
exclusifs, défauts purgés) · MDX + Content Collections + Zod · Cloudflare Pages.
Aucune base de données ni CMS en V1 initiale : le contenu vit dans `src/content/` (Git).
