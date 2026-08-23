# SeneSource — Rapport B1 : Sanity Studio + schémas

**Date :** 2026-08-23 · **Phase B, sous-phase B1.** Studio Sanity + schémas **uniquement**. Aucun mapper, aucun import de contenu, aucun branchement web (ce sont B2/B3). Aucun compte lecteur, favori, soumission sensible, Supabase, notification, Expo.

## 0. Principe tenu

Le schéma Sanity **s'adapte au modèle `@senesource/domain`**, jamais l'inverse. Les schémas reproduisent champ pour champ `DossierChamps + slug` et ses sous-objets. Le Studio (`apps/studio`) **importe** `VERDICTS`, `TYPES_DOSSIER`, `STATUTS_DOSSIER` depuis le domaine (sens correct : `studio → domain`) : aucune logique Sanity ne remonte dans le domaine. Portable Text et GROQ ne sont **pas** utilisés en B1 (ils resteront confinés à l'adapter Sanity en B2).

**Petite modification du domaine (pure, additive) :** `TypeDossier` et `StatutDossier` sont désormais dérivés de const arrays `TYPES_DOSSIER` / `STATUTS_DOSSIER` (même motif que `VERDICTS`). Zéro dépendance ajoutée, aucune logique Sanity, et le domaine reste la source unique des listes que le Studio consomme. Le web est **byte-identique** (content.config.ts n'utilise pas ces nouvelles constantes ; vérifié par rebuild).

## 1. Schémas Sanity

Emplacement : `apps/studio/`.

```
apps/studio/
├─ sanity.config.ts          # defineConfig : projectId/dataset via env, structureTool + visionTool
├─ sanity.cli.ts             # projectId/dataset pour la CLI
├─ structure.ts              # desk : dossiers groupés par statut
├─ schemaTypes/
│  ├─ index.ts               # export des types
│  ├─ dossier.ts             # document `dossier` (miroir de DossierChamps + slug)
│  └─ objects.ts             # 11 sous-objets (miroir des interfaces du domaine)
├─ package.json · tsconfig.json
```

**Un seul type de document — `dossier` — et 11 sous-objets** : `affirmation`, `verdictRendu`, `instruction`, `preuve`, `pointCle`, `piece`, `texteOfficiel`, `consequence`, `encartAbsence`, `chiffreCle`, `entreeHistorique`.

**Pas d'entité `Document` ni `Organisation` autonome.** Le domaine actuel n'en contient pas (les pièces portent des chaînes ; `rubrique` est une chaîne). Conformément à « modéliser seulement ce qui existe réellement dans le domaine » et « le schéma s'adapte au `Dossier` », je ne les **invente pas**. Les créer supposerait d'abord d'**étendre le domaine** (décision « domain-first » séparée) — signalé comme question ouverte, pas fait unilatéralement.

**Dates = chaînes d'affichage.** `ouvertLe`, `misAJourLe`, `instruction.prochainPoint`, `entreeHistorique.date` sont des `string` (« 18.08 », « 21.08.2026 »), comme dans le domaine — **surtout pas** des `datetime` Sanity, ce qui casserait l'égalité stricte de B2.

**Validation :** `sanity schema validate` → **0 erreur, 0 warning**. Les invariants du domaine (ex-`superRefine`) sont rejoués comme validations Studio (voir §4).

## 2. Captures du Studio — limitation à lever

⚠️ **Je ne peux pas produire de captures authentiques du Studio en l'état.** Le Studio édite les documents d'un **projet Sanity réel** (un `projectId` + une authentification). Cet environnement n'a aucun identifiant Sanity, et créer un projet engage le compte du propriétaire — je ne le fais pas sans votre accord.

Ce qui est **prouvé sans projet** : les schémas **compilent et sont valides** (`sanity schema validate` : 0 erreur) et leur forme résolue est extractible (`sanity schema extract`, artefact régénérable via `pnpm --filter @senesource/studio schema:extract`).

**Pour obtenir les captures, deux voies (à votre main) :**
- **(a)** Vous créez un projet Sanity gratuit (sanity.io) et me fournissez `SANITY_STUDIO_PROJECT_ID` (+ un accès) : je lance le vrai Studio (`pnpm --filter @senesource/studio dev`) et je livre les captures des formulaires réels.
- **(b)** On diffère les captures : la revue de B1 porte alors sur les schémas + l'inventaire des champs (§4) + la correspondance (§5), et les captures sont produites au moment de brancher un projet (utile aussi pour B2, qui a besoin d'un dataset pour l'import).

Recommandation : (a) si vous voulez valider l'ergonomie visuelle maintenant ; sinon (b), puisque B2 nécessitera de toute façon un projet Sanity — on créerait le projet à ce moment et on capturerait alors.

## 3. Workflow de création / publication d'un dossier

1. **Nouveau dossier** (bouton « + » sur le type Dossier). Le formulaire s'ouvre sur l'onglet **Essentiel**.
2. **Renseigner l'essentiel** (seul obligatoire) : `numero`, `type` (défaut « verification »), `titre` (doit finir par « ? »), `slug` (proposé automatiquement depuis numéro + titre), `rubrique`, `statut` (défaut « en instruction »).
3. **Publier** : le bouton *Publish* de Sanity rend le document accessible via l'API. Un dossier « en instruction » minimal est publiable immédiatement.
4. **Enrichir au fil de l'enquête** (onglets repliés, non bloquants) : Affirmation & verdict, Preuves & pièces, Conséquences, Affichage & carte, Historique. Chaque *Publish* est instantané ; l'historique de versions de Sanity conserve les états.
5. **Rendre le verdict** : passer `statut` à « publié », remplir `verdict` (exige que `affirmation` soit présente et `type = verification` — validé automatiquement).

Le desk (`structure.ts`) liste les dossiers par **Publiés / En instruction / Archivés**, plus « Tous les dossiers ».

## 4. Champs obligatoires et facultatifs

**`dossier` — obligatoires (6) :** `numero`, `type`, `titre`, `slug`, `rubrique`, `statut`.
**`dossier` — facultatifs :** `titreCourt`, `resume`, `affirmation`, `verdict`, `instruction`, `preuves`, `nonEtabliMeta`, `pointsCles`, `pieces`, `texteOfficiel`, `consequenceHome`, `consequenceDossier`, `encartAbsence`, `chiffreCle`, `ouvertLe`, `version`, `misAJourLe`, `pageComplete` (défaut `false`), `historique`.

**Validations croisées (invariants du domaine, rejouées) :**
- `titre` : requis, ≤ 140 caractères, doit se terminer par « ? ».
- `verdict` présent ⇒ `affirmation` présente **et** `type = verification`.
- `consequenceDossier` présente ⇒ `hypothese` renseignée.
- `statut = en_instruction` sans `verdict` ⇒ au moins `instruction` **ou** une `pièce`.

**Sous-objets — champs requis :**
- affirmation : `texte` · verdictRendu : `mot`, `resume` · instruction : `explication`, `prochainPoint`
- preuve : `texte`, `etabli`, `mobile` · pointCle : `texte`, `etabli`
- piece : `n`, `titre`, `obtenue`, `rail` · texteOfficiel : `texte`, `cote`
- consequence : `profil`, `chiffre`, `qualification` · encartAbsence : `label`, `texte`
- chiffreCle : `valeur`, `qualification` · entreeHistorique : `version`, `date`, `note`

## 5. Correspondance Sanity ↔ `Dossier` (domaine)

Le champ Sanity porte **le même nom** que le champ de domaine — la correspondance est 1:1, condition de l'égalité stricte visée en B2.

| Domaine (`DossierChamps`) | Champ Sanity | Type Sanity | Type domaine |
|---|---|---|---|
| `numero` | `numero` | number | number |
| `type` | `type` | string (union `TYPES_DOSSIER`) | `TypeDossier` |
| `titre` / `titreCourt` | idem | string | string / string? |
| `rubrique` | `rubrique` | string | string |
| `statut` | `statut` | string (union `STATUTS_DOSSIER`) | `StatutDossier` |
| `ouvertLe` / `misAJourLe` | idem | string | string? |
| `version` | `version` | number | number? |
| `resume` | `resume` | text | string? |
| `affirmation` | `affirmation` | object `affirmation` | `Affirmation?` |
| `verdict` | `verdict` | object `verdictRendu` | `VerdictRendu?` |
| `instruction` | `instruction` | object `instruction` | `Instruction?` |
| `preuves[]` | `preuves` | array<`preuve`> | `Preuve[]` |
| `nonEtabliMeta` | `nonEtabliMeta` | string | string? |
| `pointsCles[]` | `pointsCles` | array<`pointCle`> | `PointCle[]` |
| `pieces[]` | `pieces` | array<`piece`> | `Piece[]` |
| `texteOfficiel` | `texteOfficiel` | object `texteOfficiel` | `TexteOfficiel?` |
| `consequenceHome` / `consequenceDossier` | idem | object `consequence` | `Consequence?` |
| `encartAbsence` | `encartAbsence` | object `encartAbsence` | `EncartAbsence?` |
| `chiffreCle` | `chiffreCle` | object `chiffreCle` | `ChiffreCle?` |
| `historique[]` | `historique` | array<`entreeHistorique`> | `EntreeHistorique[]` |
| `pageComplete` | `pageComplete` | boolean | boolean |
| `slug` (= ex-`entry.id`) | `slug` | slug (`.current`) | string |

**Écarts de forme à absorber par le mapper (B2), à documenter là-bas :**
- `slug` Sanity est un objet `{ current, _key? }` → le mapper lira `slug.current`.
- Sanity ajoute des champs système (`_id`, `_type`, `_rev`, `_createdAt`, `_updatedAt`) et des `_key` sur les items de tableau → le mapper les **ignore** (ils ne font pas partie du domaine).
- Les objets/tableaux **absents** dans Sanity doivent produire `undefined` / `[]` côté domaine selon le contrat (le mapper applique les valeurs par défaut du domaine : `preuves/pointsCles/pieces/historique = []`).

## 6. Points de friction pour publier une urgence

- **Faible friction générale :** 6 champs obligatoires seulement, deux avec valeur par défaut (`type`, `statut`), slug auto-proposé. Un dossier « en instruction » part en < 1 minute.
- **Friction 1 — le `numero` est manuel.** La rédaction doit connaître le prochain numéro libre. Sanity ne fournit pas d'auto-incrément natif fiable sans logique serveur. *Piste (hors B1) :* une petite action/GROQ « prochain numéro » ou un compteur — à décider ; non fait pour ne pas complexifier B1.
- **Friction 2 — unicité du `numero` non garantie par le schéma.** La validation d'unicité exige une requête (`isUnique`), non posée en B1 pour rester simple. *À ajouter* avant usage réel (un numéro dupliqué casserait l'identité).
- **Friction 3 — `titre` doit être une question.** C'est voulu (règle éditoriale §7), mais peut surprendre : le message d'erreur l'explique.
- **Friction 4 — le vrai goulot est humain, pas technique :** vérifier avant de publier. Le modèle « verdict optionnel + statut en instruction » est justement ce qui permet de publier vite sans mentir (pas de verdict tant qu'il n'est pas établi).

## 7. Vérifications

| Contrôle | Résultat |
|---|---|
| `sanity schema validate` | ✅ 0 erreur / 0 warning |
| `sanity schema extract` | ✅ 12 types du domaine résolus (dossier + 11 sous-objets) |
| Domaine : aucune fuite Sanity | ✅ `packages/domain` n'importe rien ; le Studio importe le domaine |
| Web : non régressé | ✅ build **byte-identique** à un rebuild frais de l'état A2 (la modif domaine est additive et non consommée par le web) |
| `pnpm check` (web) | ✅ 0 erreur |

**Note toolchain :** l'installation de Sanity a bumpé `esbuild` en transitif (0.27 → 0.28) ; le CSS web minifié varie de ~26 o vs la *session* A2 (ordre/espaces de minification), sans aucun effet visuel/fonctionnel. B1 lui-même n'introduit aucun changement web (prouvé par rebuild à l'identique).

---

**B1 est terminée. Arrêt pour revue du modèle éditorial.**
Questions ouvertes à trancher : (1) captures — voie (a) projet Sanity maintenant ou (b) différées à B2 ; (2) faut-il des entités `Document`/`Organisation` autonomes (⇒ étendre d'abord le domaine) ; (3) auto-numérotation + unicité du `numero`.
Aucun mapper, import, Supabase, notification ou Expo tant que B1 n'est pas validée.
