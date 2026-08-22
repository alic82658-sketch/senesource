# SeneSource — Synthèse d'architecture (Agent A, Lead / Product Architect)

**Version 2 — 2026-08-22** · Révisée après corrections du propriétaire du projet.
**Phase :** analyse pré-V0 · **Statut : EN ATTENTE DE VALIDATION — aucune ligne de code produit n'a été écrite.**

Corrections intégrées : Astro-first · contenu MDX · aucun backend initial · aucun CMS
initial · Cloudflare Pages · modèle éditorial multi-type (un dossier n'est pas forcément
un fact-check) · V0 = design system · V0.1 = homepage + Dossier 041 en données locales.

---

## 1. Stack finale recommandée : Astro

### Comparaison Astro vs Next.js pour CE besoin

Le besoin : média documentaire essentiellement statique, HTML au build, JS client minimal,
mobile 3G/4G sénégalais, SEO natif, coût d'infra minimal, contenu en MDX versionné Git,
pas de backend ni de CMS initial.

| Critère | Astro | Next.js (App Router) | Gagnant |
|---|---|---|---|
| JS client sur une page de lecture | **0 Ko par défaut** (HTML pur ; hydratation opt-in par îlot) | ~90–100 Ko de runtime même en 100 % Server Components | **Astro** — décisif sur Itel/Tecno en 3G |
| HTML au build | Modèle natif et unique (SSG par défaut) | Possible (SSG/`output: export`) mais le framework est pensé serveur-first ; l'export statique désactive une partie des APIs | **Astro** |
| Contenu MDX typé | **Content Collections natives** : frontmatter validé par Zod au build, références entre collections (`reference()`), rien à construire | MDX via config + contentlayer/couche maison à écrire et maintenir | **Astro** — c'est exactement le contrat de données dont V0.1 a besoin, offert par le framework |
| SEO (canonical, sitemap, JSON-LD, OG) | Contrôle total du `<head>` par page + `@astrojs/sitemap` ; JSON-LD = simple `<script>` rendu au build | Très bon aussi (metadata API) | Égalité |
| Cloudflare Pages | Sortie statique pure : hébergement direct, gratuit, sans adapter | Nécessite `@cloudflare/next-on-pages`/OpenNext, couche de compatibilité à maintenir | **Astro** |
| Coût d'infra | 0 (statique + CDN) | 0 en export statique, mais on paie alors Next sans utiliser ce qui le justifie | **Astro** |
| Simplicité (petite équipe) | `.astro` = HTML + props, pas de modèle mental RSC/hydratation | RSC/client components : puissance inutile ici, complexité réelle | **Astro** |
| Ce que Next apporterait | — | ISR, Server Actions, rendu par requête, middleware | **Sans objet en V1** : sans base ni CMS, le contenu change par commit → rebuild (~2–3 min) ; ISR n'a rien à revalider ; aucune mutation côté serveur |
| Évolution future | Adapters SSR (dont Cloudflare) et Content Layer loaders : un backend/CMS se branche plus tard **sans changer de framework** | Idem côté Next | Égalité |

**Décision : Astro.** Il n'existe aucun avantage Next.js démontrable pour cette V1 ; chaque
argument historique en faveur de Next (ISR par tag, Server Actions du formulaire, admin
`/admin`) tombait avec Supabase et le CMS, désormais retirés. Astro est littéralement
conçu pour ce profil : site de contenu, zéro JS, collections typées.

### Stack complète

| Brique | Choix | Note |
|---|---|---|
| Framework | **Astro 5** (sortie statique) | Zéro adapter en V1 ; `@astrojs/mdx`, `@astrojs/sitemap` |
| Langage | **TypeScript strict** | y compris dans les frontmatters via Zod |
| Styles | **Tailwind CSS v4** via `@tailwindcss/vite` | uniquement les tokens SeneSource, défauts purgés (`--color-*: initial`, `--radius-*: initial`, `--shadow-*: initial`…) — les interdits DA restent encodés mécaniquement, mécanisme inchangé (cf. `01-design-system.md` §1.3) |
| Contenu | **MDX + Content Collections + Zod** | schéma : `05-contenu-mdx.md` |
| Hébergement | **Cloudflare Pages** | build Git → CDN ; `_redirects` générés au build pour les anciens slugs |
| Dépendances en plus | **Aucune** côté runtime | dev uniquement : Playwright + axe-core + Lighthouse CI (outillage QA Agent F, inchangé) |
| Fonts | `astro/assets` non concerné — fichiers WOFF2 self-hostés + `@font-face` + preload manuel | équivalent Astro de la stratégie `next/font` de l'Agent C : self-host, fallback métrique, budget < 100 Ko |

Ce qui est **retiré** de la V1 par rapport à la synthèse v1 : Supabase (base, auth,
storage), l'admin `/admin` (6 écrans), Vercel, zod runtime côté serveur (Zod reste, mais
au build via les collections). Le formulaire `/faire-verifier` devient un point V1 à
trancher (voir §6) puisqu'il n'y a plus de backend.

---

## 2. Structure du dépôt

```
senesource/
├─ design/
│  └─ handoff/                  # ← HANDOFF CLAUDE DESIGN (source de vérité visuelle, à venir)
├─ docs/architecture/           # 00 à 05 (ce dossier)
├─ public/
│  ├─ documents/                # PDF des pièces (V1 ; aucun binaire en V0.1)
│  └─ fonts/                    # WOFF2 self-hostés (familles du handoff)
├─ src/
│  ├─ content.config.ts         # schémas Zod des collections (le contrat de données)
│  ├─ content/
│  │  ├─ dossiers/              # 041-taxe-paiements-especes-carburant.mdx   [V0.1 : celui-ci seul]
│  │  ├─ documents/             # fiches documents-sources (.mdx)            [V0.1 : ceux du 041]
│  │  └─ taxonomies/            # verdicts.yaml · themes.yaml
│  ├─ components/
│  │  ├─ ui/                    # Filet, Bouton, Label, Meta (.astro)        [V0]
│  │  ├─ editorial/             # Verdict, Citation, Piece, ImpactFinancier, CTA, CarteDossier [V0]
│  │  └─ layout/                # Nav, Footer, ColonneLecture                [V0]
│  ├─ layouts/
│  │  └─ Base.astro             # <head> commun : fonts, canonical, OG, Organization JSON-LD
│  ├─ lib/
│  │  ├─ contenu.ts             # getDossier/listDossiers… (seule porte vers les collections)
│  │  ├─ format.ts              # nombres fr insécables, dates fr
│  │  └─ seo.ts                 # ClaimReview/NewsArticle/Breadcrumb ; mapping verdicts figé
│  ├─ pages/
│  │  ├─ index.astro            # homepage                                   [V0.1]
│  │  ├─ design-system.astro    # vitrine composants + états (noindex)       [V0]
│  │  ├─ dossier/[slug].astro   # /dossier/041-…                             [V0.1]
│  │  ├─ verifications/index.astro · documents/[slug].astro
│  │  │  · ce-que-ca-change.astro · methode.astro · faire-verifier.astro     [V1]
│  │  ├─ 404.astro
│  │  └─ robots.txt.ts
│  └─ styles/
│     ├─ tokens.css             # primitives --ss-* ← valeurs du handoff     [V0]
│     └─ globals.css            # @theme purgé + couche sémantique + base    [V0]
├─ tests/qa/                    # scripts Playwright/axe/LHCI (protocoles Agent F) [V0]
├─ astro.config.mjs · tsconfig.json (strict) · package.json
```

Deux pages en V0.1, une en V0 — les routes V1 ne sont **pas créées** avant leur phase
(ne rien indexer de creux).

---

## 3. Modèle éditorial multi-type — décision intégrée

La règle « un dossier = une affirmation principale » est **abandonnée comme règle
générale** (correction n°4). Le modèle retenu (détail complet : `05-contenu-mdx.md`) :

- **Le Dossier reste l'objet éditorial principal**, avec `type: verification | impact | document | explication`.
- `affirmation` et `verdict` sont **optionnels**. Un dossier `verification` porte en
  général une affirmation ; un dossier `impact` ou `document` peut n'en porter aucune.
- Garde-fous Zod (au build) : un `verdict` exige une `affirmation` et une date ; un
  `impact` exige méthode + hypothèses ; un `verdict.code` doit exister dans
  `taxonomies/verdicts.yaml` (taxonomie éditable sans code — principe validé conservé).
- Principes validés et conservés : `en_instruction` est un **statut de dossier** public,
  jamais un verdict ; publication sans verdict possible ; les pièces sont un **journal de
  collecte** impossible à agréger en score (aucun champ ordinal dans le schéma) ; les
  mises à jour/corrections sont des **entrées publiques datées** (`updates:` dans le
  frontmatter) — le concept est gardé, sans aucune infrastructure de versioning : Git
  fournit l'historique technique gratuitement.
- SEO : ClaimReview émis **uniquement** pour un dossier `verification` avec verdict
  rendu ; NewsArticle/Article pour les autres types.

---

## 4. Composants V0 (inchangés dans leurs contrats, portés en `.astro`)

Spécifications détaillées : `01-design-system.md` §2 (toujours valides — les contrats de
props/états sont indépendants du framework ; « React » → composants `.astro` sans JS client).

- **Fondations** : couleurs, typographies (serif/sans/mono), grille, spacing, filets.
- **Primitives UI** : `Filet`, `Bouton`, `Label`, `Meta`/`MetaListe`.
- **Éditorial** : `Verdict` (bloc + compact, y compris l'état « pas de verdict »),
  `Citation`, `Piece` (tous les statuts de collecte, document manquant inclus),
  `ImpactFinancier` (chiffre + unité + méthode + hypothèses inséparables),
  `CTA`, `CarteDossier` (déclinée par `type` de dossier).
- **Structure** : `Nav`, `Footer`, `ColonneLecture`.
- **Page `/design-system`** : tous les composants × tous les états (vide, texte long,
  très grand chiffre, sans verdict, document manquant, erreur), contenus réalistes
  sénégalais, section « Statut » listant les TODO-HANDOFF restants.

Zéro JS client sur l'ensemble ; la nav mobile utilise un mécanisme natif (`<details>`
ou équivalent) sauf indication contraire du handoff.

**Toutes les valeurs visuelles restent en attente du handoff** (`design/handoff/`,
questionnaire de 47 points : `01-design-system.md` §4). Le protocole QA V0 (audits
automatiques anti-radius/ombre/hors-token, contraste, 360×640, GO/NO-GO :
`04-qa-protocoles.md`) s'applique tel quel — il est agnostique au framework.

---

## 5. Pages V0.1

1. **Homepage** (`/`) — desktop + mobile, structure et contenus du handoff, cartes
   dossier (dont l'état « un seul dossier publié » qui est la réalité du lancement).
2. **Dossier 041** (`/dossier/041-…`) — desktop + mobile, alimenté par
   `src/content/dossiers/041-….mdx` reprenant les contenus du handoff, fixture
   volontairement « méchante » : une pièce `sans_reponse`, un impact avec hypothèses
   complètes (« 78 000 F/an — 30 000 F × 52 × 1 % »), un document sans fichier.

Données 100 % locales (collections), build statique pur, zéro JS client.
Puis **arrêt obligatoire** et livraison : screenshots desktop + mobile (5 viewports),
rapport d'écarts handoff ↔ navigateur, Lighthouse (médiane 5 runs, profil « Dakar 4G
chargée »), audit axe-core + contrastes, liste des problèmes restants — critères
GO/NO-GO de `04-qa-protocoles.md` §5.

---

## 6. Points bloquants et questions restantes

| # | Point | Statut |
|---|---|---|
| 1 | **Handoff Claude Design** | ⛔ Toujours bloquant pour V0/V0.1. Sera déposé sous `design/handoff/` dès fourniture, traité comme source de vérité, comparé systématiquement, jamais réinterprété. |
| 2 | Formulaire `/faire-verifier` sans backend | Question V1 (pas V0/V0.1) : une page statique ne peut pas recevoir de soumission. Options le moment venu : lien mailto/WhatsApp assumé, service de formulaire externe, ou une unique Cloudflare Pages Function (~30 lignes, sans base). À trancher en phase V1. |
| 3 | Rythme de publication vs build (~2–3 min par commit) | Assumé et documenté (`05-contenu-mdx.md` §6). Si l'urgence exige mieux un jour, c'est un des déclencheurs du futur CMS. |
| 4 | Anciennes URLs si un slug publié change | Couvert : `ancienSlugs:` → `_redirects` 301 générés au build. Convention : on évite quand même de renommer après publication. |
| 5 | Caractères wolof dans les fontes du handoff | À vérifier à réception des familles (question B15 du questionnaire). |

Documents `02-modele-de-donnees.md` et `03-frontend-et-cms.md` : conservés comme
**référence pour la phase base/CMS différée** (bandeau ajouté en tête) ; leurs principes
éditoriaux validés sont repris dans `05-contenu-mdx.md`.

---

## 7. Attendu pour débloquer V0

1. Le handoff Claude Design → `design/handoff/`.
2. Validation de cette synthèse v2 (stack Astro, structure, schéma MDX, périmètre V0/V0.1).
3. Autorisation explicite de commencer V0.
