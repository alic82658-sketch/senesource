# SeneSource — B1 : deux ajustements avant connexion Sanity

**Date :** 2026-08-23 · Ajustements demandés après validation des corrections B1. Appliqués **avant** la connexion au projet Sanity réel. **B2 reste interdite.**

## Ajustement 1 — `Document` appliqué, relation par `documentId` neutre

Le modèle `Document` est intégré au domaine (`packages/domain`), avec la relation corrigée : **`Piece → Document` par identifiant neutre `documentId`**, jamais par slug.

**Domaine (`packages/domain/src/dossier.ts`) :**
```ts
export interface ExtraitDocument { page: number; citation: string; annotation?: string }

export interface Document {
  id: string;            // identifiant NEUTRE (normalisé depuis _id Sanity)
  slug: string;          // propriété ÉDITORIALE (URL /documents/{slug}), jamais la clé de relation
  titre: string;
  emetteur: string;      // chaîne (pas d'entité Organisation — V1)
  type: string;          // chaîne V1
  date?: DateISO;
  urlOriginale?: string;
  fichierUrl?: string;
  fichierType?: string;
  pages?: number;
  extraits: ExtraitDocument[];
}

export interface Piece {
  // …champs existants…
  documentId?: string;   // ← identifiant NEUTRE du document, jamais le slug
}

// Sens inverse CALCULÉ, non stocké :
export interface DossierRef { numero: number; slug: string; titre: string }
export interface DocumentAvecUsages extends Document { utilisePar: DossierRef[] }
```

**Studio (`apps/studio`) :**
- Nouveau type de document `documentSource` (le titre affiché reste « Document » ; `document` est un **nom réservé** par Sanity, d'où `documentSource` — le mapper normalisera `_type: 'documentSource'` → domaine `Document`).
- La pièce porte une **vraie référence Sanity** : `piece.document = reference → documentSource`. Le mapper B2 lira `piece.document._ref` et le normalisera en `documentId` neutre ; `documentSource._id` deviendra `Document.id` ; `slug.current` restera éditorial.
- `fichier` est un vrai champ `file` Sanity ; le mapper en extraira `fichierUrl` / `fichierType`.
- Desk : entrée « Documents » ajoutée.

**Sens inverse** (dossiers/pièces citant un document) : **calculé** par l'adapter/éditorial à partir des `documentId`, jamais dupliqué dans `Document`.

**Impact B2 : nul sur l'égalité MDX↔Sanity.** Le MDX actuel ne contient aucun document structuré (les pièces n'ont pas de `documentId`), donc l'import et l'égalité stricte de B2 ne portent pas dessus. Les documents seront saisis dans Sanity (ou réimportés) séparément. `Piece.documentId` est optionnel : les dossiers actuels restent valides.

## Ajustement 2 — Dates migrées vers ISO dans le domaine (maintenant)

Le domaine est **stabilisé avant B2** : plus aucune date d'affichage partielle.

- **Domaine :** type neutre `export type DateISO = string;` (convention `YYYY-MM-DD`). Champs migrés : `ouvertLe`, `misAJourLe`, `Instruction.prochainPoint`, `EntreeHistorique.date` → `DateISO`.
- **MDX (3 fichiers) :** dates converties en ISO complètes. **L'année 2026 est certaine** — établie par la valeur explicite `misAJourLe: "21.08.2026"` du dossier 041 et le contexte daté du handoff (« SAM. 22 AOÛT 2026 »). Aucune année déduite sans source certaine.
  | Avant | Après | Dossier |
  |---|---|---|
  | `ouvertLe: "18.08"` | `2026-08-18` | 041 |
  | `misAJourLe: "21.08.2026"` | `2026-08-21` | 041 |
  | `historique date "19.08" / "21.08"` | `2026-08-19` / `2026-08-21` | 041 |
  | `ouvertLe: "12.08"` | `2026-08-12` | 042 |
  | `prochainPoint: "28.08"` | `2026-08-28` | 042 |
  (040 ne porte aucune date.)
- **`packages/editorial` :** responsable de l'affichage — `dateJourMois('2026-08-18') → '18.08'`, `dateComplete('2026-08-21') → '21.08.2026'`.
- **Web (`apps/web`) :** les gabarits rendent désormais les dates **via editorial**, produisant **exactement** les mêmes chaînes qu'avant. Validation Zod renforcée : les champs de date exigent le format ISO au build.

**Rendu inchangé — build byte-identique.** `dateJourMois`/`dateComplete` reproduisent les chaînes d'origine caractère pour caractère ; `diff` du `dist/` avant/après = aucune différence.

## Vérifications

| Contrôle | Résultat |
|---|---|
| `sanity schema validate` | ✅ 0 erreur / 0 warning (après renommage `document` → `documentSource`) |
| `tsc --noEmit` (apps/studio) | ✅ 0 erreur |
| `pnpm check` (web) | ✅ 0 erreur |
| Build web vs A2 | ✅ **byte-identique** (dates rendues à l'identique) ; QA verte par identité |
| Domaine | `Document`/`DateISO` ajoutés ; aucune dépendance, aucune fuite Sanity |

## Rappel des autres points

- **Item 3 — Organisation :** reste une chaîne (`emetteur`). Confirmé.
- **Item 4 (numérotation) / Item 5 (workflow 2 champs) :** validés, inchangés.

---

**Domaine stabilisé, prêt pour B2.** En attente du `SANITY_STUDIO_PROJECT_ID` pour finaliser la **B1 réelle** : Studio connecté, schémas déployés, captures desktop, Dossier 041 créé manuellement, mesure du nombre d'actions « nouveau → publié en instruction », workflow d'enrichissement, validation du modèle `Document` dans le Studio, build web + QA verts. **B2 reste interdite** jusqu'à la validation finale de B1.
