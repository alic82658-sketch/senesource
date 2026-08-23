# SeneSource — Rapport A1 : assainissement du domaine

**Date :** 2026-08-23 · **Phase A, sous-phase A1.** Refactor interne uniquement — aucune modification d'UI, de routes ou de contenus. MDX reste l'unique source. Aucune dépendance Sanity/Expo/backend.

## Objet

Supprimer la fuite du type Astro `CollectionEntry<'dossiers'>` hors de la couche d'accès et introduire un modèle `Dossier` **neutre** (indépendant d'Astro, Sanity, Expo). `contenu.ts` devient le **mapper** MDX/Astro → domaine ; les gabarits ne lisent plus `dossier.data.*` ni `dossier.id`.

---

## 1. Modèle `Dossier` neutre

Nouveau fichier `src/domain/dossier.ts` — **types TypeScript purs, zéro import** (ni Astro, ni Sanity, ni Expo, ni Zod). Il porte le contrat éditorial : `VERDICTS` (les 5 verdicts, source unique), les unions `TypeDossier`/`StatutDossier`/`Verdict`, les interfaces `Affirmation`, `VerdictRendu`, `Instruction`, `Preuve`, `PointCle`, `Piece`, `TexteOfficiel`, `Consequence`, `EncartAbsence`, `ChiffreCle`, `EntreeHistorique`, `DossierChamps`, et le `Dossier` final :

```ts
export interface Dossier extends DossierChamps {
  slug: string; // identité d'URL « 041-… », ex-entry.id — plate, pas d'objet Astro
}
```

Sens des dépendances respecté (architecture app-first, doc 08) : `domain ← editorial ← apps`. Le domaine est la feuille ; le schéma de validation s'y conforme, jamais l'inverse. En A2, `src/domain/` devient `packages/domain` par simple déplacement (aucun type ne référence d'externe).

## 2. Avant / après de `contenu.ts`

**Avant** — la couche d'accès *était* Astro :

```ts
import { getCollection, type CollectionEntry } from 'astro:content';
export type Dossier = CollectionEntry<'dossiers'>;          // ← fuite

export async function listeDossiers(): Promise<Dossier[]> {
  const tous = await getCollection('dossiers', ({ data }) => …);
  return tous.sort((a, b) => b.data.numero - a.data.numero); // ← .data.
}
export function collecte(d: Dossier) {
  const total = d.data.pieces.length; …                       // ← .data.
}
```

**Après** — la couche d'accès *mappe vers* le domaine :

```ts
import { getCollection, type CollectionEntry } from 'astro:content';
import type { Dossier } from '../domain/dossier';
export type { Dossier } from '../domain/dossier';            // ré-export du type neutre

// Seul endroit du code qui manipule la forme Astro :
function mapDossier(entry: CollectionEntry<'dossiers'>): Dossier {
  return { ...entry.data, slug: entry.id };                  // ← garde de dérive au compile
}

export async function listeDossiers(): Promise<Dossier[]> {
  const tous = await getCollection('dossiers', ({ data }) => …);
  return tous.map(mapDossier).sort((a, b) => b.numero - a.numero);
}
export function collecte(d: Dossier) {
  const total = d.pieces.length; …                            // ← plat, neutre
}
```

Les gabarits ne changent que d'accès : `tete.data.numero` → `tete.numero`, `dossier.data` → `dossier`, `d.id`/`tete.id` → `d.slug`/`tete.slug`. `getStaticPaths` mappe désormais `params.slug = d.slug` (valeur identique — l'URL ne bouge pas). `content.config.ts` importe `VERDICTS` du domaine (source unique) ; le schéma Zod reste inchangé fonctionnellement (validation MDX au build).

### Garde de dérive — vérifiée positivement

Le mapper renvoie `Dossier` par *spread* : si la source cessait de fournir un champ attendu par le domaine, le typecheck échoue **au mapper**. Test réalisé (champ requis fictif ajouté au domaine) :

```
src/lib/contenu.ts:28 - error ts(2741): Property 'champInexistant' is missing
in type '{ slug: string; … }' but required in type 'Dossier'.
```

C'est exactement le point de contrôle voulu : la couche d'accès est le seul endroit où source et domaine se rencontrent, et TypeScript y détecte toute divergence.

## 3. Fichiers touchés

| Fichier | Nature |
|---|---|
| `src/domain/dossier.ts` | **nouveau** — modèle neutre |
| `src/lib/contenu.ts` | mapper Astro→domaine ; ré-exporte le type neutre |
| `src/content.config.ts` | importe `VERDICTS` du domaine (schéma Zod inchangé) |
| `src/pages/index.astro` | accès plats (`.data.` retiré, `.id` → `.slug`) |
| `src/pages/dossier/[slug].astro` | accès plats ; `getStaticPaths` sur `.slug` |
| `package.json` | + `@astrojs/check`, `typescript` en **devDependencies** (outil de typecheck ; zéro impact runtime/sortie ; ni Sanity ni Expo) |

Dépendance de modules (intra-app, préfigure A2) : `pages` → `lib/contenu` → `astro:content` + `domain/dossier` ; `content.config` → `domain/dossier`. **`domain/dossier` n'importe rien.**

---

## 4. Critères de sortie A1 — vérifiés

| Critère | Résultat |
|---|---|
| **Build identique fonctionnellement** | `dist/` **byte-identique** au build V0.1 pré-A1 (`diff -rq` : aucune différence, HTML + CSS + assets). Preuve la plus forte possible. |
| **URLs inchangées** | `/`, `/dossier/041-taxe-paiements-especes-carburant/`, `/design-system/` — identiques |
| **Rendu V0.1 sans régression** | Sortie byte-identique ⇒ pixels identiques par construction |
| **QA existante verte** | Audit V0 (design-system) : 0 blocage / 0 remarque · Audit V0.1 (homepage + dossier) : 0 blocage / 0 remarque · `astro check` (typecheck) : **0 erreur / 26 fichiers** |
| **Aucune dépendance Sanity/Expo** | Confirmé — seuls ajouts : `@astrojs/check` + `typescript` (dev, typecheck) |
| **JS envoyé** | **0 octet** (0 fichier `.js`, 0 balise `<script>`) |
| **Poids** | Inchangé — `dist` 636 K ; transferts première visite identiques (doc 30 983 o · CSS 36 249 o · fontes 267 340 o) |

## 5. Arbitrage structurel rencontré (signalé, non tranché unilatéralement)

**Le type de domaine est écrit à la main, pas dérivé du schéma Zod.** Deux options existaient :
- (a) `Dossier = z.infer<typeof schema>` — zéro duplication, mais couple le domaine à Zod **et inverse le sens des dépendances** (le domaine dépendrait du schéma).
- (b) **types manuels neutres** (retenu) — respecte `domain ← editorial`, garde le domaine sans dépendance ; le coût (une double définition schéma/types) est **neutralisé par la garde de dérive au compile** décrite au §2.

J'ai retenu (b) car il est la seule option cohérente avec l'architecture app-first validée (doc 08). Si vous préférez (a) pour éliminer toute duplication au prix du couplage, c'est un point réversible — dites-le avant A2.

**Régression rattrapée pendant A1 :** la réécriture de `contenu.ts` avait initialement remplacé les espaces fines insécables (U+202F) de `fines()` par des espaces ordinaires (`+250 F` au lieu de `+250 F`). Détectée par le diff byte-à-byte, corrigée, re-vérifiée. C'est précisément ce que le critère « build identique » sert à attraper.

---

## 6. Ce que A1 ne fait PAS (réservé à A2 / phases ultérieures)

Aucun monorepo, aucun paquet créé (le domaine vit encore dans `src/domain/`), aucune règle métier déplacée hors de `contenu.ts`, aucun `apps/`, aucun Sanity/Expo/notification/deep link. `src/domain/` et les helpers de `contenu.ts` sont prêts à être **déplacés** en `packages/domain` et `packages/editorial` en A2, sans réécriture.

**A1 est terminée. Arrêt pour validation avant A2.**
