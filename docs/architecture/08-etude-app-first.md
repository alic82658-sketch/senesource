# SeneSource — Étude d'architecture app-first (Agent A, synthèse)

**Date :** 2026-08-23 · **Statut : étude sur papier. Aucun code produit. En attente de validation avant tout développement.**

Cette étude répond au changement de stratégie : **l'application mobile devient le produit principal**, le site Astro devient un web public très léger (acquisition, SEO, partage, lecture publique des dossiers, documents/sources, redirection vers l'app). Elle consolide trois analyses indépendantes (source de contenu/backend, mobile/Expo, plateforme/repos/migration) et tranche en dix livrables.

> **Ce qui est conservé, sans exception :** le design system (jetons, échelle typo, composants), le modèle de données multi-type, la couche d'accès (à assainir, voir §9), les URLs permanentes, la suite QA, et le handoff Claude Design comme **source de vérité visuelle unique**. On ne réinvente aucun langage visuel. On n'a rien à jeter du travail V0/V0.1.

---

## 1. Architecture recommandée (vue d'ensemble)

Une **source de contenu headless unique** alimente, via **la même API**, deux surfaces qui ne dupliquent aucun contenu : le **web Astro** (statique, indexable, tremplin) et l'**app Expo** (produit principal, riche, hors-ligne, push). Un **monorepo frugal** héberge les deux applications et trois paquets partagés (types de domaine, règles éditoriales, jetons de design), garantissant que les verdicts, le formatage des montants et la palette sont **définis une seule fois**.

```
                        ┌────────────────────────────────┐
   Rédaction (~3 pers.) │   SOURCE DE CONTENU (headless)  │
        ─────────────▶  │   admin + API REST/GraphQL       │
                        │   + webhooks + fichiers (→ R2)   │
                        └───────────────┬──────────────────┘
                                        │  payload brut
                                        ▼
                      ┌──────────────────────────────────────┐
                      │  packages/editorial                    │
                      │  mapping payload → Dossier (domaine)   │
                      │  + validation runtime + règles métier  │
                      │  (5 verdicts, fines U+202F, collecte)  │
                      │  → rend TOUJOURS @senesource/types      │
                      └───────┬────────────────────────┬───────┘
                  build-time  │                        │  runtime + cache offline
                   (SSG/ISR)  ▼                        ▼
                   ┌────────────────────┐    ┌─────────────────────┐
                   │ apps/web (Astro)   │    │ apps/mobile (Expo)  │
                   │ SEO · partage ·    │    │ produit principal · │
                   │ lecture publique · │    │ push · deep links · │
                   │ tremplin vers app  │    │ offline · partage   │
                   └─────────┬──────────┘    └──────────┬──────────┘
                             └──── Cloudflare CDN (cache GET) ────┘
```

**Principe fondamental (exigence du propriétaire) :** un dossier est créé **une seule fois** dans la source éditoriale, puis apparaît dans l'app, sur senesource.sn, dans les partages sociaux et dans les résultats de recherche — sans aucune ressaisie, sans republication store pour l'app.

---

## 2. Choix mobile : **Expo / React Native confirmé** (fermement)

Expo (managed workflow, New Architecture Fabric/TurboModules, SDK récent, TypeScript strict, **EAS Build + EAS Update**). Confirmé sans réserve pour ce produit et cette équipe.

**Pourquoi, en bref :**
- **Une base TypeScript** pour iOS + Android, partagée avec le web déjà en TS — décisif pour une petite équipe web-native. Flutter isolerait dans Dart ; le natif SwiftUI+Kotlin doublerait l'effort UI et supposerait deux compétences rares localement.
- **Fidélité au design system : c'est un faux problème en RN.** La DA SeneSource est austère (aucun effet), or les difficultés de RN concernent les effets riches (blur, ombres, physique) dont on ne veut aucun. À l'inverse : radius 0 est le **défaut** de `View`, RN n'ajoute **aucune ombre** par défaut, `StyleSheet.hairlineWidth` donne le filet 1px, `expo-font` charge Newsreader/Public Sans/IBM Plex Mono (italiques et graisses 400/500/600 comprises) sans substitution. Rien du design system n'est plus dur en RN qu'en natif.
- **EAS Update (OTA)** — argument spécifique à un fact-checker : livrer un **correctif** de code/présentation sans review store, en minutes. (Réserve de conformité : correctifs oui, nouvelle fonctionnalité par OTA non ; et le **contenu** transite par l'API, pas par l'OTA — publier un dossier ne dépend jamais d'un OTA.)
- **Push, deep links, partage natifs** first-class (`expo-notifications`, `expo-linking`/Expo Router, `Share`/`expo-sharing`).
- **Coût** : EAS compile iOS dans le cloud → pas de Mac de build à maintenir.

**Alternatives écartées :** Flutter (rupture écosystème, pas d'OTA), natif pur (coût ×2), RN bare (perd EAS sans gain), **Capacitor/PWA (rejeté : ce serait exactement le « calque du site » que le propriétaire refuse, + push iOS PWA fragile)**.

**Ne pas trahir la sobriété avec le natif :** le geste est natif, l'habillage reste austère. Feuille (bottom sheet) native pour ouvrir une pièce `[n]` — mais fond papier, filet 1px, radius 0 forcé, zéro ombre. Partage OS de l'URL permanente (WhatsApp dominant au Sénégal). Pull-to-refresh dé-saturé (libellé mono, pas de spinner coloré). Transitions natives courtes et linéaires. **NativeWind proscrit** (Tailwind pousse l'inverse d'une palette fermée) : jetons TS + `StyleSheet` + composants primitifs verrouillés (un `Text` maison à variantes serif/mono, une `Surface` sans prop d'ombre/radius, un `Verdict` jamais coloré). `react-native-unistyles` acceptable si besoin de variantes ; jamais NativeWind.

**Stack app :** Expo Router (onglets + piles), **TanStack Query + MMKV + expo-sqlite** pour le cache et l'offline durable, `expo-image` (dérivés dimensionnés WebP/AVIF) pour les scans, `FlashList` pour les listes sur Android d'entrée de gamme.

---

## 3. Comparaison des solutions de contenu / backend

Douze critères, trois finalistes après présélection. Notation ⭐ (faible) → ⭐⭐⭐⭐⭐.

| # | Critère | Sanity | Supabase + back-office custom | **Directus** |
|---|---|:--:|:--:|:--:|
| 1 | Publication non-technique (3 rédacteurs) | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| 2 | Urgence < 5 min + propagation app (sans store) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 3 | Fidélité du modèle (multi-type, docs mutualisés, pièces non-agrégeables, hypothèses obligatoires) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 4 | Brouillons / prévisualisation | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| 5 | Corrections / versioning public daté | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 6 | Stockage PDF + empreintes SHA-256 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 7 | Coûts (10k → 100k lecteurs) | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 8 | Performances / latence Sénégal | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 9 | API pour Astro (build+webhook) ET Expo (runtime) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 10 | Évolution (recherche, wolof, rôles) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 11 | Maintenance / lock-in / exit | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 12 | Modération / accès / **souveraineté** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**Écartés vite :** TinaCMS et tout modèle MDX+Git conservé (nécessitent un rebuild → contredisent la fraîcheur app sans store) ; Convex, Xata, Turso, PocketBase (pas d'admin éditoriale pour non-techniciens) ; Contentful, Hygraph, Prismic (SaaS d'entreprise, coût et lock-in, souveraineté nulle) ; Strapi (fait la même chose que Directus, en plus lourd, montées de version pénibles). **Payload CMS v3** retenu comme plan B technique (excellent, MIT, TypeScript, brouillons/versioning natifs) mais impose un runtime **Next.js** absent de la stack Astro+Expo, et son modèle se définit en code.

### Ce qui départage vraiment (5 facteurs)
1. **Interface d'écriture prête à l'emploi** → élimine Supabase seul (back-office à *construire* = plusieurs semaines-homme + maintenance à vie).
2. **Fraîcheur instantanée dans l'app sans store** → impose une API interrogée à l'exécution → élimine tout modèle Git/MDX.
3. **Fidélité du modèle relationnel** (documents mutualisés N-N, pièces non-agrégeables, hypothèses obligatoires) → favorise un vrai schéma SQL typé.
4. **Souveraineté** (les soumissions de lecteurs peuvent contenir des sources sensibles) → favorise l'auto-hébergement (Directus/Supabase) contre le SaaS opaque (Sanity).
5. **Coût prévisible + petite équipe** → favorise un forfait VPS plutôt qu'une facturation à la bande passante qui explose au succès.

---

## 4. Choix recommandé : **Directus** (auto-hébergé), **Sanity en plan B**

**Directus** — plateforme open-source posée sur **votre propre PostgreSQL**, qui génère automatiquement une admin éditoriale configurable, une **API REST + GraphQL standard**, un RBAC fin, du stockage de fichiers, du versioning natif et des *flows* (automatisations/webhooks). En clair : la puissance relationnelle de Supabase **plus** une vraie interface d'écriture, **sans avoir à la construire**.

**Configuration cible :** Directus (Docker) sur VPS UE (Hetzner/Scaleway) + PostgreSQL sauvegardé ; **Cloudflare** devant l'API (cache des GET publics → latence Sénégal excellente, protection, TLS) ; **Cloudflare R2** pour les PDF/images (**egress gratuit** → le poste bande passante s'effondre, avantage décisif sur Sanity). Un **flow à la publication** fait trois choses d'un coup : invalide le cache Cloudflare, déclenche la revalidation Astro, et envoie le push « nouveau dossier ». **Coût visé : ~30–80 $/mois, plat, même à 100k lecteurs** (le CDN absorbe la lecture).

**Contre Sanity** (qui gagne sur l'écriture pure et la latence sans effort) : Directus vous rend **propriétaire des données** (crucial pour des sources sensibles au Sénégal), **plafonne le coût** (forfait vs facture à la bande passante), et expose une **API standard** sans langage propriétaire (GROQ) ni format propriétaire (Portable Text à re-sérialiser deux fois). Prix à payer : un serveur à administrer et une expérience d'écriture un cran en dessous.

**Contre Supabase** (le plus puissant sur le modèle, le moins verrouillé) : Directus **livre l'admin** au lieu de vous la faire développer — vous gardez ~90 % de la puissance Postgres (c'est le même Postgres dessous) sans payer des semaines de back-office ni sa maintenance perpétuelle.

**Le seul vrai arbitrage à trancher (question ouverte n°1, §10) :** Directus **auto-hébergé** (souveraineté + coût plat, mais un serveur à tenir : sauvegardes, montées de version) **vs Directus Cloud** (zéro ops, quelques dizaines de $/mois, rapatriable plus tard sans changer le modèle) **vs plan B Sanity** (zéro serveur, meilleure écriture, mais SaaS étranger + coût à la bande passante). **Recommandation par défaut : démarrer sur Directus Cloud 2-3 mois pour aller vite, puis rapatrier en auto-hébergé** — le modèle étant du Postgres standard, le déménagement est simple. Ce choix dépend de la disponibilité d'une ressource technique pour l'exploitation : à confirmer avec vous.

**Note licence :** Directus est sous BSL 1.1 — **gratuit tant que le produit génère moins de 5 M$/an** (hors de portée à moyen terme), bascule GPL ensuite. Usage conforme. Si une licence 100 % ouverte est un point dur, Payload v3 (MIT) est l'alternative.

---

## 5. Architecture app ↔ backend ↔ web (sans duplication)

Une seule source de vérité (la base Directus), **deux consommateurs de la même API**, **le même mapping et les mêmes règles** :

- **`packages/editorial`** expose une interface neutre `DataSource` — `listeDossiers()`, `dossier(slug)`, `dossiersCitant(cote)` — et rend **toujours** un `Dossier` de **domaine** (type neutre `@senesource/types`), jamais une forme fournisseur. Le mapping (payload → Dossier) et les règles (5 verdicts, `fines` U+202F, `collecte` non-agrégeable, relations) sont **partagés à l'identique**.
- **Web (Astro, build)** appelle une implémentation `ApiDataSource` **au build** : `getStaticPaths` itère `listeDossiers()`, la publication déclenche une **revalidation par webhook**. Quelques routes chaudes peuvent passer en ISR/SSR si le rythme l'exige ; les pages dossier restent statiques.
- **App (Expo, runtime)** appelle la **même API à l'exécution**, enveloppée de cache/offline (TanStack Query persisté + SQLite). Elle voit le contenu frais **sans passer par les stores**.
- **Point clé :** `editorial` reste **isomorphe et sans état** — il reçoit « comment récupérer un octet » (un `fetch` injecté) et rend un `Dossier`. Le cache offline vit dans `apps/mobile`, la logique de build dans `apps/web`. **Aucune surface n'impose sa contrainte à l'autre.**

**Garantie « créé une fois → partout » :** app (API runtime) + web (API build → HTML statique) + partages sociaux (OpenGraph/JSON-LD générés par le web) + recherche Google (indexe les pages statiques) partent tous du **même `Dossier` produit par le même mapping**. Un document-source mutualisé apparaît dans tous les dossiers qui le référencent, sans copie.

---

## 6. Stratégie notifications push

- **Pile :** `expo-notifications` (permissions, canaux Android, réception, tap → deep link). Envoi via **Expo Push Service** au démarrage (une seule API, gratuit, pas de certificats APNs/FCM à gérer), migration possible vers **FCM/APNs directs** plus tard sans changer l'app si on stocke aussi les tokens natifs.
- **Cycle du token :** après opt-in, obtenir l'`ExpoPushToken`, l'envoyer au backend, le persister (MMKV + table `devices` avec plateforme/langue/préférences), purger les invalides.
- **Déclencheurs, alignés sur l'éditorial :** (1) **nouveau dossier publié** (principal) ; (2) **correction/mise à jour** d'un dossier — précieux pour un fact-checker, renforce la crédibilité ; (3) **conclusion d'un dossier « en instruction » suivi** (opt-in « suivre ce dossier ») ; (4) optionnel : résumé hebdo faible fréquence.
- **Opt-in & segmentation :** écran d'amorçage expliquant la valeur avant la permission système ; préférences granulaires par type ; canaux Android par type ; chaque push embarque en `data` l'URL du dossier `/dossier/NNN-slug` (le tap deep-linke).
- **Déclenchement par la rédaction, automatique :** quand un dossier passe à « publié » (ou « corrigé », ou « conclu »), un **flow Directus / webhook** sélectionne les tokens abonnés, compose le message et appelle Expo Push. Aucun envoi manuel ; une case « notifier les lecteurs » permet de distinguer une correction mineure d'une alerte. Idempotence pour éviter les doublons (un doublon nuit à la crédibilité).

---

## 7. Stratégie deep links / universal links

- **URL canonique unique, permanente, partagée app et web : `https://senesource.sn/dossier/NNN-slug`** — la même route qu'Astro sert et qu'Expo Router mappe à l'écran `dossier/[slug]`. Le numéro NNN porte l'identité éditoriale.
- **Android App Links** (`assetlinks.json` sur `/.well-known/`) + **iOS Universal Links** (`apple-app-site-association` sur `/.well-known/`), servis par le web ; déclarés côté Expo via `associatedDomains` + `intentFilters`. Un custom scheme `senesource://` sert de repli interne (push, tests) ; les liens publics sont toujours des **https universels**.
- **Fallback sans page morte :** app installée → ouvre l'app sur le dossier ; app absente → ouvre la **page web** du dossier (même URL) + bannière discrète « Lire dans l'app » (smart banner iOS, équivalent sobre Android). Ce fallback est **gratuit** parce que web et app partagent l'URL — c'est l'argument central pour la permanence des URLs.
- **Cohérence partage social :** le bouton « Partager » partage cette même URL https ; les balises OpenGraph servies par Astro donnent un aperçu correct partout (WhatsApp/Facebook). Un seul lien, tous les cas couverts.
- **Interdits (SEO + respect du lecteur) :** mur d'installation, redirection automatique vers le store, contenu masqué tant que l'app n'est pas installée, interstitiel plein écran (pénalisé par Google). Le contenu reste **entièrement lisible sur le web** ; l'app est un plus, jamais un péage.

---

## 8. Structure des repositories : **monorepo frugal**

**Un monorepo, pnpm workspaces + Turborepo. Pas Nx (sur-outillage pour 2 apps + 3 paquets), pas Bun (risque de compatibilité Metro/Expo).** Justifié **parce qu'ici** trois choses doivent rester rigoureusement identiques entre web et app et casseraient silencieusement si elles divergeaient : **les 5 verdicts et leurs règles**, **le formatage des montants** (fines insécables U+202F), **les jetons `--ss-*`**. Deux dépôts forceraient soit la duplication (dérive garantie), soit un paquet npm publié+versionné à la main (cérémonie disproportionnée).

```
senesource/                      # monorepo (dépôt actuel restructuré)
├─ pnpm-workspace.yaml · turbo.json · tsconfig.base.json
├─ apps/
│  ├─ web/                       # le projet Astro ACTUEL déplacé tel quel
│  │  └─ src/{pages,components,layouts,styles,lib}  # composants INCHANGÉS
│  └─ mobile/                    # app Expo (nouvelle) — expo-router, écrans, cache offline
├─ packages/
│  ├─ types/                     # @senesource/types — types de DOMAINE purs, zéro import framework
│  ├─ editorial/                 # @senesource/editorial — règles (verdicts, fines, collecte,
│  │                             #   segmentsRenvois, relations), mapping, interface DataSource
│  └─ design-tokens/             # @senesource/design-tokens — source unique --ss-*,
│                                #   buildée en tokens.css (web) + tokens.ts (RN)
└─ docs/architecture/            # 00…08
```

**Frontières (règle d'or : les dépendances ne remontent jamais) :** `types` ← `editorial` ← (`web`, `mobile`). Aucun paquet ne dépend d'une app ; aucun paquet ne tire React (sinon Astro casse) — c'est pourquoi `editorial`/`types` restent isomorphes et sans framework. **Web et mobile ne partagent AUCUN composant d'UI** (Astro ≠ React Native) : on partage la **donnée, les règles, les jetons** ; le rendu reste spécifique. `SCHEMA_VERSION` dans `types` protège contre un changement de champ côté CMS.

**Pièges Expo/Metro en monorepo** (résolus depuis SDK 50+ mais à configurer) : `metro.config.js` avec `watchFolders` + `resolver.nodeModulesPaths` ; `node-linker=hoisted` dans `.npmrc` côté mobile ; paquets buildés en `dist/` (tsup) ; `expo start -c` après tout changement de résolution. **Migration npm → pnpm à faire une fois, avant d'ajouter l'app.**

**Plan B (deux dépôts)** seulement si l'équipe décidait que app et web n'auront jamais de code métier commun — hypothèse contredite par le cahier des charges.

---

## 9. Plan de migration du contenu MDX existant

**Préalable non négociable — assainir la couche d'accès (dette réelle confirmée dans le code).** Aujourd'hui `src/lib/contenu.ts` expose `export type Dossier = CollectionEntry<'dossiers'>` et les gabarits lisent `dossier.data.*` / `dossier.id` : l'abstraction **fuit la forme Astro**, la promesse « rebrancher sans toucher aux gabarits » n'est donc **pas encore vraie**. Périmètre petit (six fonctions, un fichier), corrigible en une passe.

- **Étape 0 :** créer `@senesource/types.Dossier` (calque exact du `data` Zod actuel + `slug` = ex-`id`) ; faire renvoyer la couche d'accès ce `Dossier` de domaine ; remplacer dans les gabarits `dossier.data.*` → `dossier.*` et `dossier.id` → `dossier.slug` (**seule retouche de gabarits du projet, mécanique**) ; déplacer `fines`/`collecte`/`numeroAffiche`/`segmentsRenvois` + garde-fous verdict dans `packages/editorial`. **Critère de sortie : `dist/` byte-identique à l'actuel.** On ne migre aucune donnée tant que ce refactor n'est pas vert.
- **Étape 1 :** modéliser le schéma Zod dans Directus (enums pour statut/type/verdict ; objets imbriqués ; relation **explicite** dossier→documents par la cote pour que `dossiersCitant` soit une requête). **Rejouer les invariants Zod** côté CMS **et** garder la validation runtime dans `editorial` — le code reste le gardien des 5 verdicts.
- **Étape 2 :** script d'import **one-shot idempotent** : lit les 3 `.mdx`, mappe `frontmatter → Dossier → payload`, téléverse les fichiers, crée les documents en **préservant le slug**, puis **vérifie** que le `Dossier` relu via l'API est **strictement égal** à celui issu du MDX.
- **Étape 3 :** bascule = changer quelle `DataSource` l'adaptateur instancie (`Mdx` → `Api`), derrière un drapeau `SOURCE=mdx|api`. **Aucun gabarit touché.**
- **Étape 4 :** coexistence (MDX en secours derrière le drapeau) jusqu'à preuve de non-régression (`dist` depuis `api` == `dist` depuis `mdx`, diff HTML nul) + plusieurs publications réelles en prod, puis retrait du MDX. **Les URLs ne bougent jamais.**

---

## 10. Roadmap App V0 → bêta → lancement

Phases ordonnées par **dépendances** (pas de dates), chacune avec un critère de sortie (DoD) qui sert de porte. Chemin critique : **A → B → C → (D, E en parallèle) → F → G**.

| Phase | Contenu | Dépend de | Definition of Done |
|---|---|---|---|
| **A — Fondations monorepo** | Restructurer (pnpm+Turbo), déplacer Astro en `apps/web`, créer `types`/`editorial`/`design-tokens`, extraire règles+jetons, assainir la couche d'accès (§9 étape 0) | — | `apps/web` build **byte-identique** à l'actuel ; QA Playwright/axe verte ; jetons buildés CSS **et** TS ; plus aucun `astro:content` dans les gabarits |
| **B — Source de contenu + migration** | Modéliser Directus, `ApiDataSource`, script d'import, importer 040/041/042 | A | `dist` depuis API == depuis MDX (diff nul) ; slugs préservés ; invariants rejoués CMS + editorial ; webhook rebuild câblé |
| **C — App V0 (lecture seule)** | App Expo : liste, page dossier (avec verdict / en instruction / document / impact), verdicts+fines+collecte fidèles, offline sur contenu vu | A, B | parité de contenu avec le web ; hors-ligne OK ; navigation par slug ; conformité jetons (revue design) |
| **D — Deep links + partage** | Universal/App Links servis par le web, `senesource://` ↔ URL web, partage sortant vers l'URL permanente | C (chevauche B) | lien installé ouvre l'app sur le bon dossier ; non installé ouvre le web ; aucun forçage d'installation |
| **E — Push** | `expo-notifications` + Expo Push, déclenché par flow de publication (nouveau dossier / mise à jour / conclusion) | C | un « publie » déclenche un push ; tap deep-linke ; opt-in respecté |
| **F — Bêta fermée** | TestFlight + Play Internal, panel restreint, contenu réel via API | C, D, E | builds signés distribués ; boucle de retour ; crash-free > seuil ; check-list stores prête |
| **G — Lancement + bascule web** | Publier les stores ; **en parallèle** basculer le web MDX→API en prod puis retirer le MDX | F, B stabilisée | apps approuvées ; web servi par l'API (diff HTML nul) ; MDX retiré ; JSON-LD ClaimReview/NewsArticle validés (Rich Results) ; monitoring en place |

On **réutilise à chaque phase** l'existant : design system, modèle de données, couche d'accès (l'interface `DataSource` est le point de réutilisation central), QA (gardien de non-régression, étendu à la parité mdx/api).

---

## Risques consolidés (top 10)

| # | Risque | Parade |
|---|---|---|
| 1 | **Couche d'accès non étanche** (fuit `CollectionEntry`) — migrer avant de l'assainir propagerait la fuite Astro dans l'app | Phase A **bloquante** avant B ; type de domaine neutre |
| 2 | **Divergence silencieuse des règles** (verdicts, fines) entre web et app | `packages/editorial` source unique + revue « aucune constante de verdict/format hors editorial » |
| 3 | **Fac-similés de documents lourds** (poste n°1 de poids/data 3G + coût CDN) | Dérivés dimensionnés WebP/AVIF, `expo-image` lazy, pleine résolution à la demande, R2 egress gratuit |
| 4 | **Expo/Metro en monorepo** (résolution/hoisting) | `metro.config.js` + `.npmrc` documentés, paquets buildés, `expo start -c` |
| 5 | **Le CMS ne garantit pas les invariants** (saisie incohérente casse app + web) | Double validation CMS + editorial runtime + `SCHEMA_VERSION` |
| 6 | **Rupture d'URL / slug modifié après publication** (SEO + deep links morts) | Slug **immuable après publication** côté CMS + table de 301 ; test dans le script d'import |
| 7 | **ClaimReview mal émis** (sur un dossier en instruction, ou barème incohérent) → pénalité fact-check Google | Mapping type→balisage centralisé ; jamais de ClaimReview sans verdict ; test Rich Results en DoD |
| 8 | **Neutralisation des défauts natifs** (ripple, élévation, radius de sheets) | Bibliothèque de primitifs verrouillée + revue design |
| 9 | **Souveraineté partielle** (VPS UE, pas Sénégal ; soumissions sensibles) | Cloisonner/chiffrer les soumissions ; migration vers hébergeur local facile (Postgres portable) |
| 10 | **Petite équipe, surface qui double** (2 apps + 3 paquets + CMS) | Frugalité assumée (pas de Nx/Changesets tant qu'inutiles), docs à jour, QA automatisée comme filet |

---

## Questions ouvertes à trancher avec le propriétaire

1. **Hébergement du CMS :** Directus Cloud (zéro ops, démarrage rapide) puis rapatriement auto-hébergé, ou auto-hébergé d'emblée (souveraineté max) ? → dépend de la disponibilité d'une ressource d'exploitation. *(Recommandation : Cloud 2-3 mois puis rapatriement.)*
2. **Localisation des données**, surtout les soumissions sensibles : VPS UE (fiable, RGPD) ou hébergeur au Sénégal (souveraineté max, fiabilité/latence à vérifier) ? Exigence légale explicite ?
3. **Budget mensuel plafond** backend+CDN+stockage à l'horizon 100k lecteurs (ordre visé Directus : 30–80 $/mois plat) ?
4. **Qui maintient le serveur** et reprend en cas de départ (interne, prestataire, contrat) ?
5. **`Invérifiable` et ClaimReview :** `reviewRating` sans note numérique, ou basculer ces dossiers en `NewsArticle` ?
6. **Profondeur offline de l'app :** cache « déjà vu » (léger) ou téléchargement proactif pour lecture hors-ligne complète (pertinent vu la connectivité) ?
7. **Portée du push :** nouveaux dossiers seulement, ou aussi mises à jour et passages instruction→verdict ? Fréquence / fatigue de notification ?
8. **Deux stores dès le lancement** ou **Android d'abord** (part de marché mobile dominante au Sénégal, review Apple plus lente) ?
9. **Comptes utilisateurs :** « suivre un dossier » et la segmentation push marchent par device sans compte ; la synchro multi-appareils exigerait une authentification — la veut-on ?
10. **Ampleur du multi-type dans l'app V0 :** les 4 types dès V0, ou `verification` + `en instruction` d'abord ?

---

## Recommandation en une phrase

**Expo/React Native** (New Arch, EAS Build+Update ; jetons TS + primitifs verrouillés, pas de NativeWind) pour l'app produit-principal ; **Directus auto-hébergé** (Postgres + Cloudflare + R2) comme source de contenu unique — Sanity en plan B ; **un monorepo pnpm+Turborepo frugal** (`apps/web`, `apps/mobile`, `packages/{types,editorial,design-tokens}`) qui définit verdicts, fines et jetons **une seule fois** ; migration MDX→API **invisible pour les gabarits** après avoir assaini la couche d'accès ; URLs permanentes partagées web/app pour le SEO, le partage et les deep links — le tout en **conservant intégralement** le design system et le handoff Claude Design comme source de vérité visuelle.
