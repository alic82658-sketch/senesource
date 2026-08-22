# SeneSource — Synthèse d'architecture (Agent A, Lead / Product Architect)

**Date :** 2026-08-22 · **Phase :** analyse pré-V0 · **Statut : EN ATTENTE DE VALIDATION — aucune ligne de code produit n'a été écrite.**

Ce document consolide les analyses des agents B (données), C (design system), D (frontend éditorial), E (CMS) et F (QA), tranche leurs divergences, et propose l'architecture, le plan de fichiers et la roadmap V0 → V0.1 → V1.

---

## 0. ⛔ POINT BLOQUANT N°1 : le handoff Claude Design est introuvable

Le brief désigne le handoff Claude Design comme « source de vérité visuelle ». Il a été cherché systématiquement et **n'existe nulle part dans l'environnement de travail** :

- dépôt `alic82658-sketch/senesource` : **entièrement vide** (aucun commit, aucune branche distante) ;
- artifacts Claude publiés du compte : aucun ;
- Google Drive : aucun fichier contenant « SeneSource » ;
- Canva : aucun design correspondant.

Conséquences, conformément au brief lui-même (« ne pas inventer ») et au véto de l'Agent F :

1. **V0 (design system) ne peut pas démarrer** : palette, familles de polices, échelle typographique, grille, espacements, filets et styles de composants sont des valeurs du handoff, pas des valeurs à inventer.
2. **V0.1 non plus** : les contenus de la homepage et du Dossier 041 viennent du handoff.
3. Tout le reste (modèle de données, arborescence, SEO, protocoles QA, contrats de composants) est **indépendant du visuel** et est prêt — c'est le contenu de ce dossier `docs/architecture/`.

**Action demandée au propriétaire du projet :** fournir le handoff (fichier, lien, export, ou copier-coller), idéalement versionné dans ce dépôt sous `design/`. À défaut, le questionnaire de 47 points de l'Agent C (`01-design-system.md` §4) sert de cahier des charges pour le re-produire. Les items prioritaires (bloquant tout) : couleurs A1–A7, familles de polices B12–B14, échelle typographique C17, grille/breakpoints D21–D24, espacements/filets E26–E27, et les contenus G41–G42 (homepage + Dossier 041).

---

## 1. Stack — analyse et décision

La stack proposée par le brief est **adaptée** ; aucune raison de s'en écarter.

| Brique | Décision | Justification |
|---|---|---|
| **Next.js 15 (App Router)** | ✅ Retenu | SSG/ISR par tag = pages servies en statique depuis le CDN (LCP/TTFB), Server Components = ~zéro JS client sur les pages de lecture, metadata API + sitemap/robots natifs pour le SEO. Aucune route ne nécessite de SSR par requête (cf. `03-frontend-et-cms.md` D.1). |
| **TypeScript strict** | ✅ Retenu | Types métier partagés front/admin/fixtures = le contrat unique qui empêche la divergence mock → Supabase. |
| **Tailwind CSS v4** | ✅ Retenu, **sous condition** | Uniquement avec purge complète des défauts (`--color-*: initial`, `--radius-*: initial`, `--shadow-*: initial`…) et injection exclusive des tokens SeneSource. Ainsi `rounded-lg`/`shadow-md`/`text-gray-500` deviennent des classes inexistantes : les interdits du brief sont encodés mécaniquement (cf. `01-design-system.md` §1.3). Sans cette purge, Tailwind serait un risque, pas un accélérateur. |
| **Supabase** (Postgres + Auth + Storage) | ✅ Retenu (à partir de V1, pas avant) | Postgres relationnel colle au modèle documentaire ; RLS pour le partage public/rédaction ; Storage à deux buckets (public/interne) pour les pièces ; Auth magic-link pour une petite rédaction. |
| **Vercel** (ou équivalent) | ✅ Retenu | ISR par tag natif, coût quasi nul à ce trafic. Alternative auto-hébergée possible plus tard, rien ne verrouille. |
| **Librairies supplémentaires** | ❌ Aucune UI kit, aucun state manager, pas de Storybook | Seules additions justifiées : `zod` (validation du contrat de données aux deux frontières : fixtures et Supabase) et, en dev uniquement, Playwright + axe-core + Lighthouse CI (outillage QA de l'Agent F). |

Priorités du brief respectées : simplicité (une seule pile, un seul repo, un seul déploiement), performance (statique + zéro JS lecteur), SEO (SSG + ClaimReview), mobile (budget 360×640 en viewport de vérité), faible coût (fonctions uniquement à la publication).

---

## 2. Modèle de données — décision

Le schéma du brief a été challengé (détail : `02-modele-de-donnees.md`). Décisions retenues :

1. **Un dossier = une affirmation principale.** `claims` (1-N) et `verdicts` (1-1) sont fusionnés dans `dossiers`. Un sujet à plusieurs affirmations = plusieurs dossiers liés. ➜ *Hypothèse structurante à confirmer par la rédaction (question ouverte n°1).*
2. **Verdicts en table de référence `verdict_labels`** (pas un enum) : taxonomie modifiable par simple UPDATE, désactivation sans casse, définitions publiques pour la page méthode — exactement ce que le brief demande.
3. **« en_instruction » retiré de la taxonomie des verdicts** : c'est un statut de dossier. `verdict_code IS NULL` + statut = « publié sans verdict », sans ambiguïté.
4. **`evidence.supports` supprimé** : un booléen agrégeable serait la porte d'entrée du « score de vérité » que le brief interdit. Le rôle probatoire s'explique en prose.
5. **`evidence` = journal de collecte** : statut (`identifiee | demandee | obtenue | sans_reponse | refusee | introuvable | non_probante`) + à qui/quand demandée + réponse institutionnelle. « Demandé le 12/03 à la DGID, sans réponse » est une information publiable — c'est la méthode SeneSource rendue visible.
6. **Historique = `dossier_updates`** (mises à jour/corrections comme objets éditoriaux publics datés), pas de `dossier_versions` en snapshots : c'est la seule option qui produit de la valeur lecteur (transparence). Un trigger de snapshot jsonb interne reste possible en option « ctrl-Z ».
7. **Machine à états minimale** : `brouillon → en_instruction → publie → archive`. « Corrigé/mis à jour » sont dérivés de `dossier_updates`, pas des statuts.
8. **10 tables V1**, `entities` (personnes/organisations normalisées), tags multiples et redirections de slug différés en V2 sans refonte.

**Arbitrage inter-agents (Agent A) :** les types de fixtures initialement proposés par l'Agent D (verdicts par vérification multiple, « en_instruction » comme verdict, statuts `mis_a_jour/corrige`) ont été **alignés sur le modèle de l'Agent B** — voir `03-frontend-et-cms.md` D.2 (version corrigée). Le contrat TypeScript/Zod de V0.1 reflète le schéma Postgres cible champ à champ.

---

## 3. Architecture technique — décisions clés

- **Rendu : tout SSG + ISR par tag, zéro SSR** (`03-frontend-et-cms.md` D.1). Revalidation déclenchée par la publication (CMS → `revalidateTag`), jamais par intervalle.
- **URLs stables : le numéro de dossier est l'identité**, le slug est cosmétique. `/dossier/041-…` ; slug modifié avant publication → redirect 308 par numéro ; slug immuable après publication. Jamais d'ID technique en URL.
- **SEO : ClaimReview** (le schéma standard du fact-checking, consommé par Google Fact Check) émis **uniquement quand un verdict est rendu** ; NewsArticle + BreadcrumbList sur les dossiers ; table de correspondance verdict → `reviewRating` figée comme contrat public dès V1.
- **JS client : ~zéro sur tout le parcours de lecture** (Server Components). JS réellement nécessaire : confort du formulaire de soumission (progressive enhancement) et, plus tard, visionneuse PDF lazy.
- **CMS : admin custom `/admin` dans le même repo Next.js + Supabase Auth** (comparatif : `03-frontend-et-cms.md` E.1). Facteur décisif : aucun CMS générique ne modélise « verdict optionnel + pièces non-score + impacts à hypothèses obligatoires » sans contorsion. Flux « publier une urgence en < 5 minutes » spécifié (E.2) : seuls titre + affirmation sont obligatoires, publication en statut « en instruction », enrichissement ensuite.
- **QA : protocoles exécutables et véto formel** (`04-qa-protocoles.md`) : scans automatiques anti-radius/ombre/couleur hors token, contraste renforcé sur le mono, viewport de vérité 360×640, profil réseau « Dakar 4G chargée », 9 scénarios d'états dégradés, GO/NO-GO chiffrés pour V0 et V0.1.

---

## 4. Plan de fichiers cible

```
senesource/
├─ docs/
│  └─ architecture/            # ce dossier (00 à 04)
├─ design/                     # ← HANDOFF À DÉPOSER ICI (tokens, spec, exports PNG 360/1440)
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx            # fonts, Organization JSON-LD, title template
│  │  ├─ page.tsx              # homepage                              [V0.1]
│  │  ├─ design-system/page.tsx  # vitrine composants + états          [V0]
│  │  ├─ dossier/[slug]/page.tsx                                       [V0.1]
│  │  ├─ verifications/page.tsx   # registre                           [V1]
│  │  ├─ documents/[slug]/page.tsx                                     [V1]
│  │  ├─ ce-que-ca-change/page.tsx                                     [V1]
│  │  ├─ methode/page.tsx                                              [V1]
│  │  ├─ faire-verifier/page.tsx                                       [V1]
│  │  ├─ admin/…               # CMS rédaction (6 écrans)              [V1]
│  │  ├─ sitemap.ts · robots.ts · not-found.tsx · error.tsx
│  ├─ components/
│  │  ├─ ui/                   # Filet, Bouton, Label, Meta             [V0]
│  │  ├─ editorial/            # Verdict, Citation, Piece, ImpactFinancier, CTA, CarteDossier [V0]
│  │  └─ layout/               # Nav, Footer, ColonneLecture            [V0]
│  ├─ lib/
│  │  ├─ types.ts              # contrat métier (aligné schéma Postgres) [V0.1]
│  │  ├─ schemas.ts            # miroirs Zod                            [V0.1]
│  │  ├─ data.ts               # interface d'accès aux données          [V0.1]
│  │  ├─ data.mock.ts          # implémentation fixtures                [V0.1]
│  │  └─ data.supabase.ts      # implémentation Supabase                [V1]
│  ├─ content/fixtures/        # dossier-041.ts, documents.ts           [V0.1]
│  └─ styles/
│     ├─ tokens.css            # primitives --ss-* ← valeurs du handoff [V0]
│     └─ globals.css           # @theme purge + mapping sémantique      [V0]
├─ supabase/migrations/                                                 [V1]
├─ tests/qa/                   # scripts Playwright/axe/LHCI de l'Agent F [V0]
└─ package.json · tsconfig.json (strict) · next.config.ts
```

---

## 5. Roadmap

### V0 — Design system *(bloqué par le handoff)*
1. Réception du handoff → remplissage de `tokens.css` + `design/` versionné et gelé.
2. Init Next.js + TS strict + Tailwind v4 purgé ; fonts via `next/font`.
3. Primitives puis composants éditoriaux (contrats déjà spécifiés dans `01-design-system.md` §2), chacun avec tous ses états, y compris dégradés.
4. Page `/design-system` complète (structure : `01-design-system.md` §3).
5. **Audit Agent F (protocole V0) → GO/NO-GO.** NO-GO = correction + ré-audit intégral.

### V0.1 — Prototype réel *(après GO V0)*
1. Contrat de données (`types.ts` + Zod) aligné sur `02-modele-de-donnees.md` ; fixtures du Dossier 041 depuis les contenus du handoff, volontairement « méchantes » (pièce sans réponse, impact avec hypothèses, document sans fichier).
2. Homepage + `/dossier/041-…` en SSG pur, desktop + mobile, zéro JS client.
3. **Arrêt obligatoire.** Livrables : screenshots desktop + mobile (5 viewports), rapport d'écarts handoff ↔ navigateur (format `04-qa-protocoles.md` §3.3), Lighthouse (médiane 5 runs, profil « Dakar 4G chargée »), audit axe-core + contraste, liste des problèmes restants. **Attente de validation explicite.**

### V1 — Produit *(après validation V0.1, ordre proposé)*
1. Migrations Supabase (10 tables + RLS + buckets) → `data.supabase.ts` (les gabarits ne changent pas).
2. Admin `/admin` (6 écrans, flux urgence < 5 min) + auth magic link.
3. Registre `/verifications`, `/documents/[slug]`, `/ce-que-ca-change`, `/methode`.
4. `/faire-verifier` (Server Action + RLS insert-only).
5. SEO complet (ClaimReview, sitemap dynamique) + audit QA V1.

---

## 6. Risques consolidés (top 8 inter-agents)

| # | Risque | Parade |
|---|---|---|
| 1 | **Handoff absent** → tout démarrage visuel produirait une DA inventée, contraire au brief | Blocage assumé ; checklist de 47 questions prête ; structure/contrats préparés pour démarrer vite à réception |
| 2 | **Dérive « score de vérité » des pièces** (UI ou data) | Supprimé du schéma (`supports`), enum non ordinale, véto QA sur toute jauge/pourcentage |
| 3 | **Fuite des défauts Tailwind** (gris, radius, ombres → look SaaS interdit) | Purge `@theme` complète + scans automatiques CI (couleurs hors token = échec) |
| 4 | **Divergence fixtures ↔ schéma Supabase** → refonte à la bascule | Contrat TS/Zod unique aligné sur Postgres dès la première ligne de V0.1 |
| 5 | **URLs cassées** par renommage de titres (partage WhatsApp) | Identité = numéro ; slug immuable après publication ; redirect 308 |
| 6 | **ClaimReview mal mappé** (verdicts nuancés) → signalement erroné vers Google | Table verdict → rating figée comme contrat public ; jamais de ClaimReview sans verdict |
| 7 | **Données sensibles** (contacts de sources dans `submissions`, documents non publics) | RLS deny par défaut, aucun SELECT public sur submissions, deux buckets Storage, politique de purge à définir |
| 8 | **Métadonnées illisibles sur mobile réel** (mono petit, ocre faible contraste) | Règle brief « accessibilité > fidélité » : plancher 12 px + AA strict (7:1 recommandé), écarts au handoff documentés |

Questions ouvertes nécessitant une décision du propriétaire du projet : « un dossier = une affirmation » (§2.1) ; publicité du statut « en instruction » pour les sujets sensibles ; collecte ou non du contact lecteur ; gouvernance de la taxonomie des verdicts. Détail : `02-modele-de-donnees.md` §6.

---

## 7. Ce qui est attendu pour débloquer la suite

1. **Le handoff Claude Design** (fichier/lien/export → `design/` du dépôt) — bloque V0 et V0.1.
2. **Validation de cette synthèse** : stack (§1), modèle de données (§2, dont l'arbitrage « un dossier = une affirmation »), plan de fichiers (§4), roadmap (§5).
3. **Autorisation explicite de commencer V0.**
