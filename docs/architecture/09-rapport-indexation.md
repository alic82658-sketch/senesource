# Rapport — préparation à l'indexation (2026-08-28)

Branche : `claude/senesource-indexation-prep-f5vyk7`. Objectif : préparer le
site pour l'indexation **sans changer son apparence** et **sans activer
l'indexation**. Un commit par tâche.

## Décisions retenues

| Décision | Valeur |
|---|---|
| Domaine canonique | **senesource.com** (config `site` corrigée : elle pointait sur `.sn`) |
| NOM_AUTEUR | **Mouhamadou Fadal Diouf** (signataire + directeur de la publication) |
| VOCABULAIRE | **Défaut** → enrichir la page méthode (articles non modifiés) |
| NUMEROTATION | **RENUMEROTER** (par ordre de première publication) |
| Éditeur (mentions légales) | **Mouhamadou Fadal Diouf**, personne physique |
| Hébergeur (mentions légales) | **Cloudflare, Inc.** (San Francisco, CA, États-Unis) |

## Ce qui a été fait, tâche par tâche

- **Correctif préalable — domaine.** `astro.config.mjs` : `site` passé de
  `senesource.sn` à `senesource.com`. Toutes les URL absolues (JSON-LD, Open
  Graph, sitemap, RSS, canonical) en dépendent.

- **Tâche 1 — Données structurées (invisible).** JSON-LD ajouté :
  - Articles : `NewsArticle` (headline, description, image en URL absolue,
    `datePublished`, `dateModified`, author, publisher avec logo,
    `mainEntityOfPage`, `inLanguage: fr`).
  - Accueil : `Organization` (nom, url, logo, e-mail) + `WebSite`.
  - `author` = **Person « Mouhamadou Fadal Diouf »** (mis à jour en tâche 3),
    avec `url` vers `/qui-sommes-nous/`.
  - Infrastructure de tête partagée : `<link rel="canonical">` absolu + slot
    `<head>`. Les vues `/dossier/*` (non liées publiquement) pointent leur
    canonical vers `/article/*` pour éviter le contenu dupliqué.

- **Tâche 2 — Double date.** La ligne méta des articles affiche
  « Publié le JJ.MM.AAAA » puis « · Mis à jour le … » **uniquement si la date
  de mise à jour diffère** (sinon la même date apparaîtrait deux fois). Même
  balise, même classe, même style. Les deux dates alimentent le JSON-LD.
  *Sur les trois articles actuels, publication et mise à jour tombent le même
  jour : seule « Publié le … » s'affiche pour l'instant.*

- **Tâche 3 — Identité éditoriale. RÉALISÉE** (NOM_AUTEUR fourni :
  Mouhamadou Fadal Diouf).
  - **Byline** : « Par Mouhamadou Fadal Diouf » ajoutée dans la ligne méta
    existante des articles, dans la même balise/classe/style que le reste.
  - **`/qui-sommes-nous`** créée sur le **gabarit exact de `/methode`**
    (structure + feuille de style copiées à l'identique) : qui édite
    SeneSource, qui répond des contenus (directeur de la publication), la
    mission en trois points cohérents avec la méthode, le contact.
  - **`/mentions-legales`** créée sur le même gabarit : éditeur du site
    (Mouhamadou Fadal Diouf, personne physique), directeur de la publication,
    hébergeur (**Cloudflare, Inc.**, 101 Townsend Street, San Francisco, CA
    94107, États-Unis), contact.
  - **Liens de pied de page : NON ajoutés** (voir « améliorations non
    appliquées »). Les deux pages sont référencées dans le sitemap, reliées
    entre elles et à `/methode`, et `/qui-sommes-nous` est la cible de
    `author.url` du JSON-LD.

- **Tâche 4 — Title dupliqué.** La marque n'est suffixée que si le titre ne la
  contient pas déjà. L'accueil affichait « … — SeneSource — SeneSource » ; il
  affiche désormais « SeneSource — L'actualité qui vous instruit ». Règle
  valable pour toutes les pages.

- **Tâche 5 — Vocabulaire unique.** Ajout au bloc B de `/methode`, dans le
  format exact des quatre définitions existantes :
  - **Allégué** : affirmé par une partie, sans pièce indépendante permettant à
    ce stade de l'établir.
  - **En attente** : pièce ou document identifié, pas encore accessible ou pas
    encore publié.
  Les articles ne sont pas modifiés (comportement par défaut).

- **Tâche 6 — Renumérotation.** Les dossiers **visibles** (publiés, générant
  une page) sont renumérotés par ordre de première publication :

  | Avant | Après | Première publication | URL |
  |---|---|---|---|
  | 001 Sangomar | **001** | 23.08 | inchangée |
  | 043 Électrification | **002** | 27.08 | changée → 301 |
  | 044 Élections locales | **003** | 28.08 | changée → 301 |

  Fichiers renommés, champs `numero` mis à jour, redirections posées dans
  `astro.config.mjs` pour les anciennes adresses `/article/*` **et**
  `/dossier/*`.
  - **Périmètre :** les dossiers **archivés** (040, 041, 042) sont exclus de la
    liste publique (`listeDossiers` filtre `publie`/`en_instruction`) et ne
    génèrent aucune page ; ils conservent leur numéro et seront renumérotés le
    jour de leur publication. Les renuméroter maintenant aurait attribué les
    numéros 001–002 à des dossiers retirés.
  - **Limite technique :** en sortie statique, Astro génère une page de
    redirection (meta-refresh + canonical), pas un vrai code HTTP 301.
    **Recommandé :** configurer un 301 « dur » au niveau de l'hébergeur.
  - Les noms de fichiers d'illustrations (`043-…`, `044-…`) sont des
    identifiants d'actifs internes, invisibles, laissés inchangés.

- **Tâche 7 — Rubriques vides.** Toute page de rubrique sans article publié
  reçoit `<meta name="robots" content="noindex, follow">` (suivie mais non
  indexée). La balise disparaît d'elle-même dès qu'un premier dossier y est
  publié. Menu inchangé. Actuellement non vides : **Politique**, **Économie**.

- **Tâche 8 — Partage et flux (invisible).**
  - Open Graph (`og:title/description/image/url`, `type: article` sur les
    articles) + `twitter:card = summary_large_image` sur toutes les pages.
  - **Aperçus PNG ~1200×630** générés pour chaque article (WhatsApp n'affiche
    pas les SVG) via `apps/web/scripts/generer-og.mjs` (sharp), versionnés dans
    `public/og/`. Recadrage « cover » centré, sans retouche. Image par défaut
    dérivée du logo pour les pages sans illustration ; logo raster pour le
    `publisher.logo` du JSON-LD.
  - `sitemap.xml` : accueil, méthode, pages thématiques, articles publiés,
    rubriques non vides (exclut `/design-system`, rubriques vides, vues
    `/dossier/*`).
  - `feed.xml` : flux RSS des articles (titre, description, date, lien) +
    autodiscovery dans `<head>`.
  - `public/robots.txt` : référence le sitemap **sans activer l'indexation**.

## État d'indexation constaté

- **Aucun `noindex` global ni `robots.txt` dans le dépôt** avant cette session.
  La seule balise `noindex, nofollow` du dépôt concernait `/design-system`.
- L'état « site volontairement non indexé » n'est donc **pas** porté par le
  code : il est nécessairement appliqué à l'hébergeur (en-tête `X-Robots-Tag`,
  protection d'accès, ou robots.txt servi par la plateforme) — **non
  vérifiable depuis le dépôt**.
- Le `public/robots.txt` ajouté **préserve** cet état : `Disallow: /` (crawl
  fermé) tout en référençant déjà le sitemap. **L'indexation n'a pas été
  activée.**

### Pour ouvrir l'indexation (plus tard, hors session)

1. Dans `public/robots.txt`, remplacer `Disallow: /` par `Disallow:` (vide).
2. Lever tout blocage au niveau de l'hébergeur (en-tête `X-Robots-Tag`,
   protection d'accès).
3. Configurer les redirections 301 « dures » de la tâche 6 côté hébergeur.
4. Search Console : vérifier la propriété, soumettre le sitemap, demander
   l'indexation article par article, puis dossier Google Actualités.

## En attente d'une décision

- **Liens de pied de page** vers `/qui-sommes-nous` et `/mentions-legales` :
  à ajouter si vous le souhaitez (une ligne réutilisant le style de lien
  existant `.pied-contact`). Non fait par défaut (voir ci-dessous).

## Améliorations repérées, volontairement NON appliquées

- **Liens de pied de page** vers `/qui-sommes-nous` et `/mentions-legales` :
  non ajoutés. Le pied dispose pourtant d'un style de lien réutilisable
  (`.pied-contact`), mais ajouter des liens visibles modifierait l'apparence
  du pied — écarté au titre de la règle « aucune modification visuelle ». Les
  pages restent accessibles par URL et par le sitemap. **À faire sur simple
  accord.**
- **Vue `/dossier/*` en doublon de `/article/*`** : neutralisée par un
  canonical, mais la route existe toujours. Sa suppression éventuelle est une
  décision éditoriale, non faite ici.
- **Redirections 301** actuellement en meta-refresh (limite du statique) :
  à durcir côté hébergeur.
- **Noms de fichiers d'illustrations** encore préfixés par les anciens numéros
  (`043-…`, `044-…`) : cosmétique, interne, invisible ; laissés tels quels.

## Vérifications effectuées

- `pnpm build` et `pnpm check` (astro check) : **0 erreur**.
- Aucun fichier CSS, jeton, ni bloc `<style>` modifié.
- Aperçus PNG contrôlés visuellement (dont la conversion SVG → PNG).
- Sitemap, RSS, robots, redirections et JSON-LD contrôlés dans la sortie de
  build.
