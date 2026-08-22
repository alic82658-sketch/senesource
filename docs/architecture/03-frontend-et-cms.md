# SeneSource — Frontend éditorial & CMS (Agents D et E)

> **⚠️ STATUT RÉVISÉ (2026-08-22, corrections du propriétaire)** : la stack V1 est
> désormais **Astro + MDX + Cloudflare Pages, sans Supabase et sans CMS custom** — la
> section E (admin `/admin`) est **entièrement différée** et ne sera étudiée que lorsque
> le volume éditorial le justifiera. Restent valides et repris dans la synthèse v2 :
> l'arborescence des routes publiques et les URLs stables par numéro (D.1), le principe
> d'une couche d'accès aux données unique (D.2, désormais `src/lib/contenu.ts` sur
> Content Collections), le plan SEO/ClaimReview (D.3 — ClaimReview limité aux dossiers
> `type: verification` avec verdict), le budget JS (D.4, durci : 0 Ko avec Astro) et les
> états par gabarit (D.5). Le modèle multi-type des dossiers remplace « un dossier = une
> affirmation » : voir `05-contenu-mdx.md`.

---

## SECTION D — Editorial Frontend

### D.1 Arborescence App Router proposée

```
app/
├─ layout.tsx                        # RSC racine : Organization JSON-LD, title template, fonts
├─ page.tsx                          # Homepage
├─ dossier/
│  └─ [slug]/page.tsx                # /dossier/041-taxe-paiements-especes-carburant
├─ verifications/
│  └─ page.tsx                       # Registre public (toutes les vérifications)
├─ documents/
│  └─ [slug]/page.tsx                # /documents/arrete-2026-013-ministere-finances
├─ ce-que-ca-change/page.tsx         # Impacts chiffrés agrégés
├─ methode/page.tsx                  # Méthodologie
├─ faire-verifier/page.tsx           # Formulaire de soumission
├─ sitemap.ts
├─ robots.ts
├─ not-found.tsx
└─ error.tsx                         # + error.tsx par segment dynamique
```

**Règle d'URL stable.** L'identité pérenne d'un dossier est son **numéro**, pas son slug. Le paramètre `[slug]` est parsé en `numéro + reste` : si le numéro existe mais que le slug textuel a changé, **redirect 308** vers l'URL canonique. Un titre éditorial peut donc être corrigé sans casser un seul lien partagé. Même logique pour les documents (slug basé sur émetteur + référence, jamais renommé après publication).

**Note sur la page « vérification ».** Le dossier est l'unité de publication ; la vérification (affirmation → verdict) vit *dans* le dossier. En V1, elle est adressable par ancre stable (`/dossier/041-…#affirmation`) et le registre `/verifications` liste les affirmations en pointant vers ces ancres. Une route dédiée `/verifications/[slug]` n'est justifiée que si une affirmation doit exister hors dossier — réservée, non construite en V1.

**Rendu par route — tout en statique + ISR, zéro SSR :**

| Route | Mode | Justification CWV / coût |
|---|---|---|
| `/` | SSG + ISR (revalidation par tag à la publication) | LCP servi depuis le CDN, TTFB ~0. La homepage change à chaque publication → `revalidateTag('dossiers')` déclenché par le CMS, pas de revalidation par intervalle. |
| `/dossier/[slug]` | SSG (`generateStaticParams`) + ISR par tag ; `dynamicParams: true` pour les dossiers publiés après le build | Page la plus partagée (WhatsApp/Facebook au Sénégal, réseaux mobiles lents) : HTML complet immédiat, zéro fetch client. |
| `/verifications` | SSG + ISR par tag ; filtres via `searchParams` rendus serveur | Une liste filtrée par GET reste indexable et fonctionne sans JS. |
| `/documents/[slug]` | SSG + ISR | Contenu quasi immuable (un document officiel ne change pas). |
| `/ce-que-ca-change` | SSG + ISR par tag | Agrégat recalculé à la publication seulement. |
| `/methode` | SSG pur | Change quelques fois par an. |
| `/faire-verifier` | SSG pur + Server Action pour le POST | Le formulaire n'a pas besoin de SSR : page statique, soumission en action serveur. |

Aucune route ne justifie du SSR par requête en V1 : pas de contenu personnalisé, pas de temps réel. C'est le profil de coût minimal (hébergement statique + fonctions à la publication uniquement) et le profil CWV maximal.

**V0.1** : `/` et `/dossier/041-…` uniquement, fixtures locales, donc **SSG pur**. Les autres routes ne sont pas créées — ne rien indexer de creux.

### D.2 Stratégie de contenu mocké V0.1

Principe : **les fixtures sont typées par les types du futur modèle de données, et les pages ne lisent jamais les fixtures directement** — elles passent par une couche d'accès qui sera réimplémentée sur Supabase sans toucher aux gabarits.

```
src/
├─ lib/
│  ├─ types.ts        # Types métier partagés, alignés champ à champ sur le schéma Postgres (02-modele-de-donnees.md)
│  ├─ data.ts         # Interface : getDossier(numero), listDossiers(), getDocument(slug)…
│  └─ data.mock.ts    # Implémentation V0.1 sur fixtures (remplacée par data.supabase.ts)
└─ content/
   └─ fixtures/
      ├─ dossier-041.ts
      └─ documents.ts
```

Types clés (après arbitrage Agent A — alignés sur le schéma de l'Agent B) :

```ts
// Codes issus de la table verdict_labels — PAS un enum TS figé :
type VerdictCode = 'confirme' | 'faux' | 'trompeur' | 'exact_en_partie' | 'non_verifiable';

type StatutDossier = 'brouillon' | 'en_instruction' | 'publie' | 'archive';

type StatutPiece = 'identifiee' | 'demandee' | 'obtenue' | 'sans_reponse'
                 | 'refusee' | 'introuvable' | 'non_probante';
// ⚠ enum de démarche documentaire — jamais ordinale, jamais agrégée en score

interface Impact {
  titre: string; valeur: number | null; unite: string;
  methode: string;            // obligatoire
  hypotheses: string;         // obligatoire, affiché avec le chiffre, jamais séparé
  sourceNote: string;         // d'où viennent les chiffres
}

interface Piece {
  titre: string; statut: StatutPiece;
  demandeeA?: string; demandeeLe?: string; obtenueLe?: string;
  reponseNote?: string; description?: string;
  document?: string | null;   // slug du document, null tant que non obtenue
  extraits?: { page: number; citation: string; annotation?: string }[];
}

interface DossierUpdate {
  kind: 'mise_a_jour' | 'correction' | 'changement_verdict';
  note: string; publieLe: string; ancienVerdict?: VerdictCode;
}

interface Dossier {
  numero: number;               // 41 → affiché « 041 », identité pérenne des URLs
  slug: string; titre: string; chapo?: string; corps?: string;
  statut: StatutDossier;
  affirmation?: { texte: string; auteur?: string; sourceUrl?: string; date?: string };
  verdict?: { code: VerdictCode; resume: string; renduLe: string } | null;
  pieces: Piece[]; impacts: Impact[];
  updates: DossierUpdate[];     // « corrigé » / « mis à jour » = dérivés d'ici
  publieLe?: string; misAJourLe?: string;
}
```

Deux garde-fous : (1) un schéma **Zod** miroir valide les fixtures au build V0.1, puis validera les réponses Supabase à la bascule — un seul contrat, deux usages ; (2) le dossier 041 mocké doit être **maximalement méchant** : une pièce `sans_reponse`, un impact « 78 000 F/an » avec ses hypothèses complètes, un document lié sans fichier — pour exercer les états de D.5 dès V0.1.

### D.3 Plan SEO par gabarit

**Socle commun** : `metadataBase` en layout racine ; `title` template `« %s — SeneSource »` ; `alternates.canonical` sur chaque page (le canonical d'un dossier est toujours l'URL au slug courant, les anciens slugs redirigent en 308 donc ne créent jamais de duplicate) ; JSON-LD injecté en RSC via `<script type="application/ld+json">` sérialisé côté serveur — aucun JS client requis.

**ClaimReview : oui, il s'applique pleinement.** C'est le schéma standard du fact-checking (consommé par Google Fact Check) et SeneSource coche les conditions : affirmation identifiable, verdict rendu, méthodologie publique. Modalités :

- Une `ClaimReview` par dossier avec verdict rendu (un dossier = une affirmation principale, cf. arbitrage).
- `claimReviewed` = l'affirmation textuelle ; `itemReviewed` (type `Claim`) avec `author` = qui a affirmé, `datePublished` = quand ; `author` de la ClaimReview = Organization SeneSource.
- **Table de correspondance verdicts → `reviewRating` à figer dès V1** (c'est un contrat public) : `ratingValue` sur échelle 1–5 déclarée avec `alternateName` = libellé français exact. Proposition : faux = 1, trompeur = 2, exact en partie = 3, confirmé = 5 ; **non vérifiable** = `alternateName` seul, sans `ratingValue` (autorisé par le schéma et plus honnête).
- **Ne jamais émettre de ClaimReview sans verdict rendu** (statut `en_instruction` ou verdict null) : une ClaimReview sans conclusion est un signalement erroné vers Google. Le dossier reste indexé via NewsArticle ; la ClaimReview apparaît à la mise à jour qui rend le verdict.

Plan par gabarit :

| Gabarit | JSON-LD | Metadata / OG | Divers |
|---|---|---|---|
| Homepage | `Organization` (logo, sameAs) + `WebSite` | OG statique de marque | |
| Dossier | `NewsArticle` (headline, datePublished, **dateModified** à chaque mise à jour, author Organization) + `ClaimReview` (si verdict) + `BreadcrumbList` | Title = titre dossier ; description = affirmation + verdict s'il existe ; OG image statique en V0.1, `ImageResponse` dynamique (numéro + verdict) différable | `article:modified_time` ; corrections visibles datées |
| Registre | `CollectionPage` + `ItemList` | canonical sans query params ; les URLs filtrées (`?verdict=faux`) restent indexables mais canonicalisent vers la liste nue | |
| Document | `BreadcrumbList` (+ éventuellement `CreativeWork`) | Title = type + émetteur + date | Lier fortement vers les dossiers (maillage interne) |
| Ce que ça change | `WebPage` + `BreadcrumbList` | | |
| Méthode | `WebPage` + `BreadcrumbList` | | Requise par les consignes fact-checking de Google : la lier depuis chaque dossier |
| Faire vérifier | `ContactPage` | | Page de confirmation post-envoi en `noindex` |

`sitemap.ts` généré depuis la couche `data.ts` (dossiers, documents, pages fixes ; `lastModified` = `misAJourLe`). `robots.ts` : tout autorisé sauf `/admin` et `/api`.

### D.4 Budget JS

**Objectif V1 : 100 % Server Components sur tout le parcours de lecture.** Aucune donnée n'est interactive côté lecteur.

- **Zéro JS client** : homepage, dossier, registre (filtres = liens GET rendus serveur), document (hors visionneuse), ce-que-ça-change, méthode. Navigation mobile réalisable sans JS (`<details>`/popover natif) tant que le design ne l'interdit pas.
- **JS client réellement nécessaire** :
  1. `/faire-verifier` : le POST passe par une Server Action (fonctionne sans JS) ; un petit îlot client optionnel n'apporte que le confort (état « envoi en cours », erreurs inline). Progressive enhancement — la page reste utilisable JS coupé.
  2. Visionneuse de document sur `/documents/[slug]` : V1 = lien de téléchargement + pages d'extraits en images `next/image` (zéro JS) ; une visionneuse PDF client est différable et sera chargée en `dynamic()` lazy.
- Hygiène : `next/font`, aucune lib UI cliente, pas de state manager, pas d'analytics bloquant. Cible réaliste : **First Load JS ≈ le seul runtime Next** sur toutes les pages de lecture — déterminant pour un lectorat majoritairement Android sur réseaux 3G/4G.

### D.5 États à gérer par gabarit

| État | Gabarits | Comportement |
|---|---|---|
| **Vide** | Registre, homepage, ce-que-ça-change | Registre sans résultat de filtre : message + lien « voir toutes les vérifications ». Homepage avec 1 seul dossier (réalité V0.1) : le gabarit ne doit pas supposer N ≥ 3 (pas de grille qui s'effondre). |
| **Sans verdict** | Dossier, registre, homepage | `verdict: null` → mention « En instruction » visuellement distincte de tout verdict, jamais un vide ni un placeholder gris ambigu. Pas de ClaimReview émise. Le registre doit pouvoir trier/afficher ces entrées. |
| **Titre très long** | Tous les gabarits liste + OG | Clamp multi-ligne dans les cartes, titre complet sur la page dossier. Le slug est tronqué à la génération (le numéro porte l'identité). Prévoir le débordement dans l'OG image dynamique future. |
| **Très grand chiffre** | Impacts, ce-que-ça-change | Formatage `fr` avec espaces insécables fines (`Intl.NumberFormat`), `font-variant-numeric: tabular-nums` dans les listes. **Jamais d'abréviation dans l'hypothèse ni la méthode** (le « 30 000 F × 52 × 1 % » est cité verbatim) ; abréviation (« 78 Md F ») tolérée uniquement en carte, avec la valeur exacte sur la page. |
| **Document manquant** | Dossier, document | Une pièce `demandee`/`sans_reponse`/`refusee` s'affiche comme **statut de démarche daté** (« Demandé au ministère le 12/08 — sans réponse »), jamais comme lien mort ni comme jugement de fiabilité. `document: null` → fiche publiée avec métadonnées + mention explicite, pas de bouton télécharger. |
| **Erreur** | Tous | `not-found.tsx` global renvoyant vers le registre ; sur `/dossier/[slug]` : numéro inconnu → 404, numéro connu + slug faux → 308 (jamais 404 sur un lien anciennement valide). `error.tsx` par segment dynamique ; à la bascule Supabase, une erreur de fetch sur page ISR sert la version en cache plutôt qu'une page d'erreur. |

---

## SECTION E — CMS éditorial

### E.1 Options comparées et recommandation

| Critère | (a) Admin custom `/admin` + Supabase Auth | (b) Headless externe (Sanity, Strapi, Payload…) | (c) Supabase Studio brut | (d) Git-based / Retool |
|---|---|---|---|---|
| Rapidité d'usage rédaction | **Excellente** — écrans épousant le vocabulaire métier (verdict, pièce, hypothèse) | Moyenne — le modèle SeneSource se tord dans des « content types » génériques | **Mauvaise** — édition de tables brutes, enums en clair, aucun guidage | Mauvaise (Git : publier = PR) / moyenne (Retool) |
| Coût de dev initial | Moyen — ~6 écrans (cf. E.2), mais mêmes types, même repo, même auth | Faible à moyen — coût caché d'intégration double-pile | Nul | Faible |
| Maintenabilité petite équipe | **Bonne** — une seule pile, un seul déploiement, types partagés bout en bout | Fragile — deux systèmes, deux modèles à synchroniser | Bonne techniquement, intenable humainement | Fragile |
| Risque de dérive | Maîtrisé si le périmètre V1 est verrouillé (cf. E.3) | **Élevé** : contenu hors Supabase → double source de vérité ou webhooks de synchro | Élevé : erreur destructive en prod à un clic, aucun historique | Élevé |

**Recommandation ferme : (a) admin custom Next.js sous `/admin`, Supabase Auth, dans le même repo.** Le facteur décisif n'est pas le goût du custom, c'est le **modèle de données** : statuts de pièces sémantiques (surtout pas un score), verdict optionnel, impacts avec méthode + hypothèses obligatoires, extraits cités page à page, corrections publiques. Aucun CMS générique ne modélise cela sans contorsion, et chaque contorsion est un endroit où la règle éditoriale (« une pièce n'est pas un score ») peut se perdre. Avec (a), les invariants métier vivent une fois : types TS partagés front/admin, contraintes Postgres, RLS. Nuance honnête : **Payload CMS** est le seul challenger crédible si l'équipe refuse d'écrire des formulaires — mais il ajoute une pile et son versionnage/relations restent moins précis que le besoin.

### E.2 Écrans admin minimaux V1 et flux « urgence < 5 minutes »

**Écrans V1 (6) :**

1. **Connexion** — Supabase Auth (magic link email : pas de mots de passe à gérer pour une petite rédaction).
2. **Liste des dossiers** — numéro, titre, statut, verdict ou « en instruction », date de dernière modification ; bouton « Nouveau dossier ».
3. **Éditeur de dossier** (l'écran central, une seule page à sections) :
   - En-tête : numéro (auto-attribué, non modifiable), titre, slug (généré, verrouillé après première publication), statut ;
   - Affirmation : texte, attribuée à, date, source ;
   - Verdict : les codes actifs de `verdict_labels` + **« aucun pour l'instant »** explicitement proposé ;
   - Pièces : liste avec statut par pièce + à qui/quand demandée + réponse ;
   - Impacts : valeur + unité + méthode + hypothèses + source (champs **obligatoires ensemble** : un impact sans méthode ne se sauvegarde pas) ;
   - Documents liés (sélecteur depuis la bibliothèque) ;
   - Boutons : Enregistrer brouillon / **Publier** / Publier une mise à jour ou correction (note publique obligatoire → `dossier_updates`).
4. **Bibliothèque de documents** — upload PDF vers Supabase Storage, métadonnées (émetteur, date, type, pages), extraits cités avec numéro de page, dossiers liés.
5. **Soumissions lecteurs** — file entrante, statuts (nouvelle/examinée/retenue/écartée), bouton « créer un dossier depuis cette soumission ».
6. **Historique d'un dossier** — liste des `dossier_updates` publiques (+ snapshots internes si activés). Lecture seule en V1.

**Flux « publier une info urgente en < 5 minutes » :**

1. (0:00) Session déjà ouverte (magic link persistant) → « Nouveau dossier » : numéro attribué automatiquement, aucune décision à prendre.
2. (0:30) Saisir titre + affirmation + attribution. C'est tout ce qui est obligatoire.
3. (1:30) Verdict : laisser vide (dossier « en instruction »). Pièces : ajouter une ligne « demandée » si la démarche est lancée. Impacts, documents : vides — rien ne bloque.
4. (2:30) **Publier en instruction** → validation Zod côté serveur → `revalidateTag` sur le dossier, la homepage et le registre.
5. (3:00) La page est en ligne, indexable, avec statut « en instruction » et sans ClaimReview (émise plus tard, à la publication du verdict).
6. Les heures suivantes : mises à jour successives (verdict, pièces, documents), chacune horodatée dans `dossier_updates` — le modèle « verdict non obligatoire » est exactement ce qui rend l'urgence publiable sans sacrifier la rigueur.

Le seul vrai risque du flux est humain (publier trop vite un contenu erroné) : il est couvert par le mécanisme de correction publique, présent dès V1 (non différable).

### E.3 Différable après V1

- Rôles fins (relecteur vs éditeur) et workflow d'approbation — V1 : tous les comptes rédaction équivalents ;
- Prévisualisation brouillon via `draftMode` — V1 : le statut « en instruction » assume la publication progressive ;
- Diff visuel entre versions ;
- Éditeur riche (V1 : textarea + markdown minimal) ;
- Planification de publication ; notifications ; recherche plein texte admin ;
- OG images dynamiques par dossier ; extraction automatique de métadonnées PDF ;
- Statistiques de lecture ; version wolof ; route `/verifications/[slug]` unitaire ; visionneuse PDF client.

### E.4 Risques (D + E confondus, 8)

1. **Mapping ClaimReview des verdicts nuancés** (« exact en partie », « non vérifiable ») mal fait → balisage rejeté ou verdict déformé dans les SERP. Figer la table verdict → `ratingValue`/`alternateName` comme un contrat public dès V1, ne plus y toucher.
2. **Divergence fixtures V0.1 / schéma Supabase réel** → refonte des gabarits à la bascule. Parade : couche `data.ts` + schéma Zod unique dès la première ligne de V0.1.
3. **Statut de pièce traité comme score** — un tri, une couleur verte/rouge ou une agrégation « X pièces sur Y » recrée le score de fiabilité que la ligne éditoriale interdit. Encoder l'enum sans ordre, verrouiller la règle dans les types et la revue de design.
4. **URLs instables** si le slug fait autorité — un titre corrigé casserait les liens partagés (canal principal : WhatsApp). Parade : identité = numéro, redirections 308.
5. **Publication urgente sans filet** : une erreur publiée vite est une erreur très visible pour un média de vérification. Corrections publiques normées (`dossier_updates`) **V1, non différables**.
6. **Dérive du périmètre admin** (rich text, médias, rôles réclamés au fil de l'eau) → le CMS coûte plus cher que le site public. Tenir la liste E.3 comme frontière explicite.
7. **Exposition de données sensibles** : soumissions lecteurs (identités de sources potentielles) et documents non publiés lisibles publiquement par erreur de RLS/bucket. Parade : RLS deny par défaut, buckets Storage séparés public/privé, jamais de coordonnées de source dans une table exposée.
8. **Handoff design absent** : si les gabarits encodent des valeurs visuelles provisoires en dur, l'arrivée du handoff force une refonte. Parade : tout style passe par les tokens, composants structurels sans esthétique figée — gabarits, états et JSON-LD décrits ici sont volontairement indépendants du visuel.
