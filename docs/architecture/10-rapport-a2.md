# SeneSource — Rapport A2 : monorepo minimal

**Date :** 2026-08-23 · **Phase A, sous-phase A2.** Déplacement mécanique vers un monorepo pnpm. Aucune modification fonctionnelle du web (composants, routes, contenus, CSS source, SEO inchangés). Aucun Sanity/Expo/Studio/push/deep link.

## 1. Arbre final du monorepo

```
senesource/
├─ pnpm-workspace.yaml
├─ package.json                  # racine : scripts délégués à @senesource/web
├─ pnpm-lock.yaml
├─ .gitignore
├─ design/handoff/               # source de vérité visuelle — UNIQUE, à la racine
├─ docs/architecture/            # 00…10
├─ apps/
│  └─ web/                       # l'app Astro (déplacée telle quelle)
│     ├─ astro.config.mjs · tsconfig.json · package.json
│     ├─ public/                 # fonts/, favicon.svg
│     ├─ src/
│     │  ├─ pages/               # index · dossier/[slug] · design-system
│     │  ├─ components/          # ds/ editorial/ layout/ ui/  (INCHANGÉS)
│     │  ├─ layouts/Base.astro
│     │  ├─ styles/              # fonts.css · globals.css · tokens.css  (INCHANGÉS)
│     │  ├─ lib/contenu.ts       # adaptateur Astro → domaine
│     │  └─ content.config.ts    # schéma Zod (importe VERDICTS du domaine)
│     └─ tests/qa/               # audits Playwright/axe (déplacés ici avec l'app)
└─ packages/
   ├─ domain/                    # @senesource/domain — types neutres, zéro dépendance
   │  └─ src/{index.ts, dossier.ts}
   ├─ editorial/                 # @senesource/editorial — règles partageables
   │  └─ src/index.ts            #   numeroAffiche, fines, collecte, segmentsRenvois
   └─ design-tokens/             # @senesource/design-tokens — valeurs transposables
      └─ src/index.ts            #   palette, typo, espacements, breakpoints
```

`apps/mobile` et `apps/studio` **non créés** (même vides) : ils n'apporteraient aucune clarté tant qu'aucune ligne n'y vit, et `pnpm-workspace.yaml` les captera automatiquement (`apps/*`) le jour venu. Le handoff reste unique à la racine (`design/handoff/`), non dupliqué.

## 2. Contenu exact de `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

## 3. Graphe des dépendances entre packages

```
@senesource/domain        (feuille — aucune dépendance, aucun runtime)
        ▲
        │  import type
        │
@senesource/editorial     (dépend de domain ; aucun framework, aucune bibliothèque de rendu)
        ▲
        │  import
        │
@senesource/web  (apps/web)   ── importe domain (type) + editorial (règles)

@senesource/design-tokens (feuille — aucune dépendance ; PAS encore consommée, voir §10)
```

Le sens ne remonte jamais : `domain ← editorial ← web`. `domain` et `design-tokens` sont des feuilles sans dépendance runtime. Aucun paquet ne dépend d'une app. Aucun paquet ne tire React/Astro.

## 4. Emplacement de chaque responsabilité — avant / après

| Responsabilité | Avant (A1) | Après (A2) |
|---|---|---|
| Types de domaine (`Dossier`, `VERDICTS`…) | `src/domain/dossier.ts` | **`packages/domain`** |
| Formatage `fines` (U+202F), `numeroAffiche` | `src/lib/contenu.ts` | **`packages/editorial`** |
| `collecte` (journal de pièces) | `src/lib/contenu.ts` | **`packages/editorial`** |
| `segmentsRenvois` / `Segment` | `src/lib/contenu.ts` | **`packages/editorial`** |
| Accès données Astro (`getCollection`, `mapDossier`, `listeDossiers`, `dossiersAvecPage`) | `src/lib/contenu.ts` | **`apps/web/src/lib/contenu.ts`** (reste dans le web — spécifique Astro) |
| Schéma de validation Zod | `src/content.config.ts` | **`apps/web/src/content.config.ts`** (importe `VERDICTS` du domaine) |
| Valeurs du design system | `src/styles/tokens.css` (CSS) | CSS conservé dans `apps/web` **+** source neutre dans `packages/design-tokens` (voir §10) |
| Gabarits, composants, styles, layouts | `src/**` | **`apps/web/src/**`** (déplacés tels quels, zéro modification) |
| QA (audits Playwright/axe) | `tests/qa` (racine) | **`apps/web/tests/qa`** (co-localisés avec l'app testée) |

Choix de périmètre (conforme à la consigne « ne pas sur-abstraire ») : l'accès aux données propre à Astro **reste dans `apps/web`** ; seules les fonctions à vocation réelle de partage (formatage, verdicts, collecte, renvois) sont montées dans `editorial`.

## 5. Build / typecheck / QA

| Contrôle | Résultat |
|---|---|
| `pnpm build` (Astro depuis `apps/web`) | ✅ 3 pages générées |
| `pnpm check` (`astro check`) | ✅ **0 erreur / 0 warning / 0 hint** (25 fichiers) — la garde de dérive du mapper reste active à travers la frontière de paquet (`contenu.ts` importe `Dossier` de `@senesource/domain`) |
| Audit V0 (`/design-system`) | ✅ 0 blocage / 0 remarque |
| Audit V0.1 (homepage + dossier 041) | ✅ 0 blocage / 0 remarque |

## 6. Vérification des routes

Identiques, à l'octet près des chemins : `/`, `/dossier/041-taxe-paiements-especes-carburant/`, `/design-system/`. Aucune route ajoutée, supprimée ou renommée.

## 7. Comparaison du rendu V0.1

**HTML byte-identique** avant/après, à la seule exception du **nom de fichier** de la feuille CSS partagée (hash de contenu). Après neutralisation du hash dans le `href`, `diff` renvoie **aucune différence** sur les trois pages (homepage, dossier 041, design-system). Le rendu visuel est donc strictement conservé (voir §8 et §10 pour la seule différence CSS).

## 8. Poids HTML / CSS / fontes / JS — avant / après

| | Avant (racine) | Après (apps/web) | Δ |
|---|---|---|---|
| HTML (3 pages) | 81 405 o | 81 405 o | **0** |
| CSS (5 fichiers) | 44 275 o | 38 135 o | **−6 140 o** |
| Fontes (12 WOFF2) | 452 348 o | 452 348 o | **0** |
| JS | 0 | 0 | **0** |

Le seul écart est le CSS, **plus léger** : voir §10.

## 9. Dépendances ajoutées / supprimées

- **Supprimé :** `package-lock.json` (npm) → remplacé par `pnpm-lock.yaml` (migration du gestionnaire).
- **Ajouté (workspace, privé, zéro runtime tiers) :** `@senesource/domain`, `@senesource/editorial`, `@senesource/design-tokens` — liés par `workspace:*`.
- **`apps/web`** conserve exactement ses dépendances runtime (`astro`, `@astrojs/mdx`) et dev (`@astrojs/check`, `typescript`, `@tailwindcss/vite`, `tailwindcss`, `playwright`, `@axe-core/playwright`, `serve`) ; ajout des deux deps internes `@senesource/domain` et `@senesource/editorial`.
- **Racine :** `pnpm.onlyBuiltDependencies: ["esbuild", "sharp"]` (pnpm 10 bloque les scripts post-install par défaut ; esbuild en a besoin pour compiler). Aucune dépendance Sanity/Expo.
- **Turborepo : NON ajouté.** Avec une seule app active, les scripts pnpm (`pnpm --filter @senesource/web …`) couvrent tout sans peine. Aucun besoin concret (orchestration multi-paquets, cache de tâches) ne se présente aujourd'hui — à réévaluer quand `apps/mobile` sera actif.

## 10. Écarts introduits par le déplacement (documentés précisément)

**A. CSS partagé plus léger de 6 140 o — bénéfique, pas une régression.**
Cause : Tailwind v4 (même version, **4.3.3**, avant comme après) détecte automatiquement ses sources de contenu à partir de la racine du projet. **Avant**, l'app étant à la racine du dépôt, Tailwind scannait aussi `design/handoff/*.dc.html`, `docs/` et `tests/` — il y « détectait » des noms ressemblant à des classes (`container`, `grid`, `italic`, `sticky`, `ring`, `filter`, `tabular-nums`, `transform`, `block`, `visible`…) et générait les utilitaires correspondants **dans le CSS livré**. **Après**, l'app isolée dans `apps/web`, le scan est correctement circonscrit à `apps/web/src` → ces utilitaires ne sont plus émis.

Preuve que c'est du **CSS mort** (aucun impact visuel) :
- nos composants n'emploient **aucun** utilitaire Tailwind (ils utilisent des styles scoped + les tokens `--ss-*`) — `grep` sur `apps/web/src` : 0 occurrence ;
- aucun de ces tokens de classe n'apparaît dans le HTML généré (0 occurrence) ;
- le HTML est byte-identique, les audits QA restent verts (0 blocage), le rendu est inchangé.

C'est donc une **amélioration** (moins de CSS mort livré au lecteur), conséquence directe et souhaitable de l'isolation de l'app. La rendre « byte-identique » exigerait de **réintroduire** la pollution du scan (scanner à nouveau le handoff/docs/tests) — ce qui serait un recul. Écart assumé et documenté.

**B. `packages/design-tokens` créé mais pas encore branché sur le build web.**
Le paquet contient les **valeurs** neutres (palette, typo, espacements, breakpoints) transposables web ↔ React Native. Il n'est **pas** consommé par `apps/web` en A2 : le web garde son `src/styles/tokens.css` inchangé (exigence « ne pas modifier le CSS »). Les deux représentent les mêmes valeurs ; `tokens.css` est la projection CSS, le paquet la source neutre partagée. Générer `tokens.css` depuis le paquet modifierait le build → reporté à une étape ultérieure dédiée (hors A2). Conséquence temporaire : une duplication assumée des valeurs, à unifier plus tard.

**C. QA déplacée dans `apps/web/tests/`.**
Les scripts d'audit dépendent de `playwright`/`@axe-core/playwright`, installés dans `apps/web`. Co-localiser la QA avec l'app qu'elle teste résout la résolution des dépendances et est la place correcte (l'app mobile aura sa propre QA). Les artefacts d'audit (captures PNG régénérables) sont désormais gitignorés (`tests/qa/artefacts/`) — sorties, pas sources.

**D. Renommage du paquet web** `senesource` → `@senesource/web` (scope monorepo). Privé, sans effet sur le build ni les URLs.

---

**A2 est terminée. Arrêt pour validation.** Aucun Sanity, Expo, Studio, push, deep link ou nouveau produit.
