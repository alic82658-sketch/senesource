# SeneSource

Média numérique sénégalais de vérification documentaire : dossiers numérotés, verdicts,
conséquences chiffrées, preuves, registre public.

## État du projet

**Phase : analyse d'architecture pré-V0.** Aucun code produit n'est encore écrit.

⛔ **Bloquant :** le handoff Claude Design (source de vérité visuelle) est introuvable et
doit être déposé dans `design/` avant tout démarrage de la phase V0.

## Documentation

| Document | Contenu |
|---|---|
| [`docs/architecture/00-synthese.md`](docs/architecture/00-synthese.md) | Synthèse, décisions, risques, plan de fichiers, roadmap V0 → V0.1 → V1 |
| [`docs/architecture/01-design-system.md`](docs/architecture/01-design-system.md) | Structure des tokens, composants V0, les 47 questions au handoff |
| [`docs/architecture/02-modele-de-donnees.md`](docs/architecture/02-modele-de-donnees.md) | Modèle Supabase/PostgreSQL (10 tables), statuts, RLS |
| [`docs/architecture/03-frontend-et-cms.md`](docs/architecture/03-frontend-et-cms.md) | Arborescence App Router, SEO/ClaimReview, contrat de données, CMS |
| [`docs/architecture/04-qa-protocoles.md`](docs/architecture/04-qa-protocoles.md) | Protocoles d'audit, seuils, états dégradés, conditions GO/NO-GO |

## Stack retenue (à valider)

Next.js (App Router) · TypeScript strict · Tailwind CSS v4 (tokens SeneSource exclusifs,
défauts purgés) · Supabase (Postgres, Auth, Storage — à partir de V1) · Vercel.
