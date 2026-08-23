# SeneSource

Média numérique sénégalais de vérification documentaire : dossiers numérotés, verdicts,
conséquences chiffrées, preuves, registre public.

## État du projet

**Phase : étude d'architecture app-first validée ; prêt à démarrer la Phase A (monorepo).**

Parcours : design system V0 ✅ · prototype web V0.1 (homepage + Dossier 041) ✅ · V0.2 web
**suspendue** (changement de stratégie, préservée sur la branche `claude/senesource-v0.2-web-wip`).

**Décision stratégique (2026-08-23) : app-first.** L'application mobile devient le produit
principal ; le web Astro devient un site public léger (acquisition, SEO, partage, lecture
publique, redirection vers l'app). Architecture validée :

- **Mobile :** Expo / React Native (New Architecture, EAS Build+Update).
- **Source de contenu :** **Sanity** pour la V1 (Directus reversé en migration ultérieure).
- **Structure :** monorepo pnpm + Turborepo — `apps/web`, `apps/mobile`, `apps/studio`,
  `packages/{types, editorial, design-tokens}`.
- **Prochaine étape :** Phase A — fondations monorepo + assainissement de la couche d'accès
  (`src/lib/contenu.ts` fuit encore le type Astro). En attente de validation pour démarrer.

Le handoff Claude Design (`design/handoff/`) reste la **source de vérité visuelle unique**.

## Documentation

| Document | Contenu |
|---|---|
| [`docs/architecture/00-synthese.md`](docs/architecture/00-synthese.md) | **Synthèse v2** : stack Astro (comparatif vs Next.js), structure du dépôt, composants V0, pages V0.1, points bloquants |
| [`docs/architecture/01-design-system.md`](docs/architecture/01-design-system.md) | Structure des tokens, Tailwind v4 purgé, composants V0, les 47 questions au handoff |
| [`docs/architecture/02-modele-de-donnees.md`](docs/architecture/02-modele-de-donnees.md) | *Référence future* — modèle base de données pour la phase CMS/backend différée |
| [`docs/architecture/03-frontend-et-cms.md`](docs/architecture/03-frontend-et-cms.md) | Routes, SEO/ClaimReview, états par gabarit (valides) ; section CMS différée |
| [`docs/architecture/04-qa-protocoles.md`](docs/architecture/04-qa-protocoles.md) | Protocoles d'audit, seuils, états dégradés, conditions GO/NO-GO |
| [`docs/architecture/05-contenu-mdx.md`](docs/architecture/05-contenu-mdx.md) | Modèle de contenu MDX (source des dossiers V0.1 ; migre vers Sanity en Phase B) |
| [`docs/architecture/06-rapport-v0.md`](docs/architecture/06-rapport-v0.md) · [`07-rapport-v01.md`](docs/architecture/07-rapport-v01.md) | Rapports QA V0 (design system) et V0.1 (homepage + Dossier 041) |
| [`docs/architecture/08-etude-app-first.md`](docs/architecture/08-etude-app-first.md) | **Étude app-first** : Expo, Sanity, monorepo, notifications, deep links, migration, roadmap |

## Stack retenue

- **App (produit principal)** : Expo / React Native, TypeScript strict, jetons SeneSource.
- **Web (public léger)** : Astro statique, TypeScript strict, Tailwind v4 (tokens exclusifs,
  défauts purgés), fontes self-hostées.
- **Contenu** : Sanity (V1) — source unique alimentant app et web via `packages/editorial`.
- **Monorepo** : pnpm + Turborepo.

Le contenu des dossiers vit aujourd'hui en MDX (`src/content/`) ; il migrera vers Sanity en
Phase B, derrière la même couche d'accès, sans réécrire les gabarits.
