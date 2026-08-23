# SeneSource — B1 : connexion au projet Sanity réel

**Date :** 2026-08-23 · Connexion de `apps/studio` au projet Sanity existant
**`oug8iag3`** / dataset **`production`**. Studio **non** recréé (`sanity create` non
utilisé). **B2 reste interdite.**

---

## 1. Fait dans ce commit (headless, sans authentification)

| Étape | État | Preuve |
|---|---|---|
| Connexion au projet réel `oug8iag3` / `production` | ✅ | `sanity.config.ts` + `sanity.cli.ts` : défaut `oug8iag3` (surcharge par `SANITY_STUDIO_PROJECT_ID`) |
| `.env.example` documenté | ✅ | `apps/studio/.env.example` (projectId public ; `SANITY_AUTH_TOKEN` jamais committé) |
| Peer dep `styled-components` alignée (`^6.1.15`) | ✅ | build sans warning |
| `sanity schema validate` | ✅ | 0 erreur / 0 warning |
| `sanity build` (bundle statique du Studio) contre `oug8iag3` | ✅ | « Build Sanity Studio » OK, sans warning |
| Build web + byte-diff A2 | ✅ | inchangé (aucun code web touché) |

Le projectId n'est **pas** un secret (il est de toute façon exposé dans le bundle
client) : il est donc en valeur par défaut dans le code, surchargée par l'environnement.

## 2. Bloqueur : les étapes restantes exigent une authentification Sanity

Cet environnement d'exécution **n'a ni session `sanity login` ni `SANITY_AUTH_TOKEN`**.
Preuve — `sanity schema deploy` répond :

```
Error deploying schema for workspace "senesource":
  You must login first - run "sanity login"
```

Toutes les étapes B1 restantes sont **auth-gated** et, pour la plupart,
**interactives** (UI du Studio, navigateur, mesure de clics) — donc impossibles à
réaliser depuis ce conteneur headless :

- déploiement des schémas vers `oug8iag3` ;
- lancement du Studio réel connecté au dataset `production` ;
- **création manuelle** du Dossier 041 de test ;
- test des placeholders / valeurs préremplies, du modèle Document, des illustrations
  dans l'UI ;
- **captures** desktop ;
- **mesure du workflow** « nouveau → publié en instruction » (nombre d'actions).

## 3. Deux voies pour débloquer

**Voie A — fournir un `SANITY_AUTH_TOKEN` dans cet environnement.** Un jeton avec droits
*Deploy Studio* + *Editor* (créé sur https://sanity.io/manage → API → Tokens) me permet
de : déployer les schémas (`sanity schema deploy`), et écrire/valider des documents via
`@sanity/client` (je fournirais un script de seed idempotent pour le Dossier 041 + un
Document + une illustration, prouvant les trois modèles contre le vrai dataset). Les
**captures du Studio réel** et la **mesure du workflow manuel** restent néanmoins des
gestes d'UI humains (pas de display/navigateur authentifié en headless).

**Voie B — exécution locale (recommandée pour les captures et la mesure).** Sur une
machine avec navigateur :

```bash
cd apps/studio
cp .env.example .env          # projectId déjà = oug8iag3
pnpm sanity login             # OAuth navigateur
pnpm sanity schema deploy     # déploie les schémas vers production
pnpm dev                      # Studio réel sur http://localhost:3333
```

Puis, dans le Studio : créer le Dossier 041, capturer, mesurer les clics.

## 4. Ce qu'il faut vérifier dans le Studio (checklist de validation B1)

**Desk :** dossiers groupés par statut + entrée « Documents ».

**Valeurs préremplies (presets) à l'ouverture d'un nouveau Dossier :**
- `numero` = max(numero) + 1 (calculé — nécessite la connexion au dataset) ;
- `type` = `verification` ; `statut` = `en_instruction` ; `pageComplete` = `false` ;
- `slug` généré depuis `numéro + titre` (bouton « Generate ».)

**Champs requis (bloquent la publication si vides) :** `titre` (doit finir par « ? »),
`rubrique`, `numero` (unique), `type`, `statut`, `slug`. Invariant document : un dossier
`en_instruction` sans verdict exige **soit** le bloc « en instruction » **soit** ≥ 1 pièce.

**Modèle Document :** type « Document » (interne `documentSource`), avec `extraits`
(page + citation) et champ `fichier` ; une pièce le cite par **vraie référence**.

**Illustrations (groupe « Affichage & carte », toutes facultatives) :** illustration
principale, illustrations de contenu, visuel de partage social ; `alt` requis dès qu'une
image est posée ; aucun bloc si absent (voir `14-illustrations-spec.md`).

## 5. Workflow prédit « nouveau → publié en instruction » (à confirmer par la mesure)

D'après les champs requis + l'invariant de collecte, le minimum théorique est :

1. **New Dossier** → `numero`, `type`, `statut` déjà préremplis ;
2. saisir **titre** (question) ;
3. saisir **rubrique** ;
4. **Generate** le slug ;
5. renseigner la **collecte** : bloc « en instruction » (explication + date) **ou** une pièce ;
6. **Publish**.

Soit ≈ **3 saisies + génération slug + 1 bloc collecte + publier**. À confronter au
nombre d'actions réellement mesuré dans l'UI.

---

**En attente :** soit un `SANITY_AUTH_TOKEN` (Voie A), soit les captures + la mesure
produites en local (Voie B). **B2 reste interdite** jusqu'à la validation finale de B1.
