# SeneSource — B1 : corrections avant B2

**Date :** 2026-08-23 · Corrections demandées après validation conditionnelle de B1. **B2 reste interdite.** Rien du mapper ni de l'import n'est fait ici.

État par item : ✅ implémenté · 📋 proposé (avant migration) · ⏳ en attente du projet Sanity réel.

---

## Item 7 ✅ — Audit critique du contenu MDX (fait en premier, car il conditionne B2)

**Conclusion : aucun contenu éditorial n'est perdu.**

- **Corps des `.mdx` : vides.** Les trois fichiers (040, 041, 042) sont du frontmatter pur ; aucun texte éditorial sous le frontmatter. Rien à représenter en plus côté corps.
- **Frontmatter : 100 % couvert.** Toutes les clés de niveau 1 du 041 (la plus riche) appartiennent au schéma/domaine ; le schéma a même des champs optionnels non utilisés (`chiffreCle`, `encartAbsence`, `instruction`). Aucune clé hors modèle → aucune perte silencieuse par Zod.
- **Aucun résidu V0.2** (`consequencesDetail`, `neChangePas`, `document:` sur les pièces… absents).

**Seule limite structurelle : les documents.** Dans le MDX actuel, les documents originaux apparaissent uniquement en **prose** (chaînes dans `pieces[].meta`/`titre` et dans `texteOfficiel`), sans entité réutilisable. Ce n'est pas du contenu *perdu*, c'est du contenu *sous-modélisé* — exactement ce que l'item 2 corrige. ➜ Migration B2 **non démarrée** ; proposition de modèle ci-dessous.

---

## Item 2 📋 — `Document` comme entité du domaine (PROPOSITION, avant migration)

Extension **minimale et neutre** de `packages/domain` (aucune dépendance, aucune notion Sanity/Portable Text). Présentée pour validation **avant** toute migration.

```ts
// packages/domain — ajout proposé (NON encore appliqué)

/** Date ISO (YYYY-MM-DD). Le rendu « 18.08 » reste dans packages/editorial. */
export type DateISO = string;

/** Un passage cité d'un document, à une page précise. */
export interface ExtraitDocument {
  page: number;
  citation: string;
  annotation?: string;
}

/** Document original, réutilisable entre plusieurs dossiers. */
export interface Document {
  id: string;              // identifiant neutre (≠ _id Sanity, ≠ URL)
  slug: string;            // identité d'URL : /documents/{slug}
  titre: string;
  emetteur: string;        // organisme émetteur — CHAÎNE en V1 (item 3)
  type: string;            // « Texte de loi », « Réponse administrative »… (chaîne V1)
  date?: DateISO;          // date du document
  urlOriginale?: string;   // source d'origine (lien public)
  fichierUrl?: string;     // fichier téléchargeable éventuel
  fichierType?: string;    // ex. « application/pdf »
  pages?: number;          // nombre de pages éventuel
  extraits: ExtraitDocument[]; // passages cités, avec numéro de page
}
```

**Relation document ↔ dossiers/pièces — sens et minimalisme :**
- **Sens direct (stocké) :** une pièce référence un document par son slug. Ajout proposé sur `Piece` :
  ```ts
  export interface Piece {
    // …champs actuels…
    document?: string; // slug d'un Document (optionnel : une pièce peut n'être liée à aucun)
  }
  ```
- **Sens inverse (calculé, non stocké) :** « quels dossiers citent ce document » se **dérive** des pièces — on ne le duplique pas dans `Document`. Une vue calculée (remplie par l'adapter/éditorial, pas par la source) :
  ```ts
  export interface DossierRef { numero: number; slug: string; titre: string }
  export interface DocumentAvecUsages extends Document { utilisePar: DossierRef[] }
  ```

**Ce que la migration impliquera (après votre accord), pour information :**
1. `packages/domain` : ajouter `Document`, `ExtraitDocument`, `DateISO`, `DossierRef` ; ajouter `document?: string` à `Piece`.
2. `apps/studio` : nouveau document `document` (schéma miroir) ; le champ `piece.document` devient une **référence** vers lui.
3. `packages/editorial` : helper « dossiers citant ce document » (calcul du sens inverse).
4. Web (ultérieur, hors B2) : page `/documents/[slug]` + « cité par » — c'était prévu en V0.2, resté en attente.
5. **B2 n'est pas affecté** par cet ajout : le MDX actuel ne contient aucun document structuré, donc l'égalité stricte MDX↔Sanity de B2 ne porte pas dessus. Les documents seront **saisis dans Sanity** (ou réimportés depuis la branche V0.2) séparément — décision de contenu, pas de migration MDX.

**Non sur-modélisé, volontairement :** pas d'entité `Organisation` (item 3 — `emetteur` reste une chaîne) ; `type` de document reste une chaîne libre (pas d'enum figé tant que le besoin n'est pas avéré) ; pas de champ « usages » stocké (dérivé).

➜ **En attente de votre validation du modèle avant de l'appliquer.**

---

## Item 3 ✅ — Organisation reste une chaîne

Aucune entité `Organisation` créée. `emetteur` (sur le futur `Document`) et `rubrique` (sur `Dossier`) restent des chaînes. À réévaluer si des pages/organisme, filtres ou relations complexes deviennent un besoin réel.

---

## Item 4 ✅ (partiel) — Dates ISO

Décision actée : **le domaine stocke de l'ISO** (`YYYY-MM-DD`) ; le rendu « 18.08 » appartient à `packages/editorial`.

**Implémenté maintenant :**
- **Studio :** tous les champs de date passent en type `date` ISO — `ouvertLe`, `misAJourLe`, `instruction.prochainPoint`, `entreeHistorique.date`. L'import B2 aura donc une **cible ISO**.
- **`packages/editorial` :** fonctions de rendu ajoutées — `dateJourMois('2026-08-18') → '18.08'`, `dateComplete('2026-08-21') → '21.08.2026'`. Neutres, prêtes pour B2/B3.

**Reporté à B2 (volontairement, pour rester honnête) :**
- Le **type** des champs de date du domaine passera à `DateISO`, et le **mapper MDX convertira** les anciennes valeurs (« 18.08 » → « 2026-08-18 », l'année 2026 étant inférée du contexte) — **au même moment**, pour que le domaine ne contienne jamais une valeur non-ISO. Le web continuera d'afficher « 18.08 » via les fonctions editorial (« sans modifier l'affichage actuel »).
- Faire le changement de type du domaine *maintenant*, alors que le MDX porte encore « 18.08 », créerait une incohérence transitoire (champ typé ISO contenant du non-ISO). D'où le report atomique avec le mapper. Si vous préférez l'inscrire dans le domaine dès à présent (alias `DateISO = string`, sans conversion), c'est trivial — dites-le.

## Item 5 ✅ — Numéro de dossier (≠ identifiant technique)

`_id` Sanity reste l'identifiant technique ; `numero` est l'identité **publique**. Implémenté dans le Studio :
- **Proposition automatique** : `initialValue` = `max(numero) + 1` (requête GROQ à la création).
- **Validation d'unicité** : `custom` async — refuse un `numero` déjà porté par un autre dossier (exclut le brouillon courant).
- **Correction manuelle** possible : le champ reste éditable par l'éditeur.
- Pas d'infrastructure distribuée : une simple requête sur le dataset (course improbable pour une petite rédaction ; l'unicité rattrape un éventuel doublon à la validation).

*Test en conditions réelles = item 8 (nécessite le projet Sanity).*

## Item 6 ✅ — Friction éditoriale réduite (saisi vs auto)

Champs de l'onglet **Essentiel**, désormais étiquetés par nature :

| Champ | Nature | Action éditeur |
|---|---|---|
| `titre` | **SAISI** | taper la question |
| `rubrique` | **SAISIE** | taper la rubrique |
| `numero` | proposé automatiquement | rien (corrigeable) |
| `type` | prérempli « verification » | rien |
| `statut` | prérempli « en instruction » | rien |
| `slug` | généré (numéro + titre) | un clic « Generate » |

➜ Créer un sujet urgent = **taper 2 champs** (titre, rubrique) + générer le slug + Publier. Le reste s'ajoute ensuite. Le compte d'actions réel sera **mesuré en item 8**.

## Item 8 ⏳ — En attente du projet Sanity réel

Bloqué sur `SANITY_STUDIO_PROJECT_ID` (option (a) retenue). Dès réception, je : lance le Studio réel, produis les captures, crée un Dossier 041 de test, **mesure le nombre d'actions** « nouveau dossier → publié en instruction », et vérifie le workflow desktop/mobile du Studio.

---

## Vérifications de ce lot de corrections

| Contrôle | Résultat |
|---|---|
| `sanity schema validate` | ✅ 0 erreur / 0 warning |
| `tsc --noEmit` (apps/studio) | ✅ 0 erreur (ajout de `@types/node` pour `process.env`) |
| Web : non régressé | ✅ **byte-identique** au build A2 (editorial n'ajoute que des exports non consommés par le web ; le web ne les ré-exporte pas) |
| `pnpm check` (web) | ✅ 0 erreur |
| Domaine | inchangé (la modif dates est reportée à B2 ; aucune fuite Sanity) |

---

**Arrêt pour validation finale de B1.** En attente de : (1) votre `SANITY_STUDIO_PROJECT_ID` pour l'item 8 ; (2) votre validation du **modèle `Document` proposé** (item 2) avant de l'appliquer ; (3) le cas échéant, votre préférence sur le moment du changement de type des dates dans le domaine (maintenant vs B2). B2 reste interdite.
