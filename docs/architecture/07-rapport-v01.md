# SeneSource — Rapport V0.1 : homepage + Dossier 041 (Agent F, QA)

**Date :** 2026-08-23 · **Périmètre :** `/` et `/dossier/041-taxe-paiements-especes-carburant/`, desktop + mobile, contenus du handoff, collections MDX locales, zéro backend, zéro CMS.
**Référence :** écrans §5.1, §5.2, §6.1, §6.2 de `design/handoff/SeneSource Systeme.dc.html`.

## Verdict d'audit : GO côté QA — en attente de validation du propriétaire

---

## 1–2. Captures

- **Comparatives handoff ↔ navigateur** (390 px et 1280 px) : `tests/qa/artefacts/comparatif/planche_{homepage,dossier}_{390,1280}.png` — référence du handoff à gauche, rendu réel à droite. Références extraites du fichier gelé (`ref_*.png`), rendus recapturés aux mêmes largeurs (`rendu_*.png`).
- **Captures supplémentaires** 360 / 390 / 768 / 1280 / 1440 : `tests/qa/artefacts/{homepage,dossier-041}_<viewport>.png`.

## 3. Rapport des écarts visuels

### Écarts corrigés pendant l'audit (itération fidélité)

| # | Constat initial | Correction |
|---|---|---|
| C-1 | Ordre des dossiers secondaires inversé (042 avant 040) | Ordre du gabarit : numéro croissant |
| C-2 | Carte « en instruction » : ligne desktop et libellé de jauge cumulés sur les deux breakpoints | Ligne « En instruction · n pièces sur m » : desktop seul (§6.1) ; libellé de jauge : mobile seul (§5.1) |
| C-3 | « +250 F » et « 78 000 F » coupés en fin de ligne dans les modules | Espace fine insécable avant « F » + `white-space: nowrap` sur le chiffre (règle §2) |
| C-4 | Double « 4 pièces sur 6 » sur la barre de verdict desktop | Le libellé de la jauge fait foi ; compteur mobile masqué ≥ 1024 |
| C-5 | Titre hero desktop : le handoff utilise une version resserrée (sans « dans les stations-service ») | Champ `titreCourt`, affiché en display-1 ≥ 1024 |
| C-6 | Module desktop : qualification à côté du chiffre au lieu de dessous (§6.1/§6.2) | Disposition « bloc » ≥ 1024 (chiffre 44 px seul, phrase dessous) via `qualificationDesktop` |
| C-7 | Résumé de verdict mobile : version longue avec renvois au lieu de la phrase courte (§5.2) | `resumeCourt` mobile / résumé long avec renvois soulignés ocre desktop |
| C-8 | Texte officiel mobile : citation complète au lieu de la version tronquée + « Ouvrir » (§5.2) | `texteCourt` / `actionCourte` mobile, version complète desktop |
| C-9 | Rail « Les 6 pièces » : titres longs au lieu des intitulés courts (§6.2) | `titreCourt` par pièce |

### Écarts restants (assumés et documentés)

| # | Écart | Justification |
|---|---|---|
| R-1 | **Module homepage : « +250 F · profil automobiliste »** là où l'écran §6.1 montre « 78 000 F · TAXI » | Les deux écrans de référence (§4.4/§5.1 vs §6.1) montrent deux **états de profil** différents du même module. Un état unique et cohérent a été retenu pour la page (celui du composant §4.4 et du mobile §5.1). Le sélecteur de profil dynamique est un comportement V1. |
| R-2 | Éléments interactifs différés : sélecteur de profil (▾), module épinglé `sticky` avec dépliage au tap (§4.5), renvois [n] en panneau latéral (§7), « Ouvrir le registre → », « Voir les 6 pièces » mobile, « Définir mon profil » | Comportements nécessitant du JS ou des pages V1 (registre, profil persistant). Rendus visuellement conformes mais inertes — aucun lien mort, éléments non cliquables. Les renvois du texte officiel ancrent vers la liste des pièces (`#pieces`). |
| R-3 | Liens de navigation `/verifications`, `/documents`, `/ce-que-ca-change`, `/methode` → 404 (pages V1 non construites) | L'architecture d'URL est posée ; ne rien indexer de creux. À brancher en V1. |
| R-4 | ÉCART-001 (V0, validé) : action de la citation officielle en `--ink` souligné ocre | Décision propriétaire du 22.08 — accessibilité > fidélité. |
| R-5 | Chiffre du module : 42 px partout (44 px en disposition bloc desktop) là où les écrans montrent 40/42/44 selon le contexte | Le jeton `figure` de l'échelle §2 fixe 42/0.88 pour l'encart ; les micro-variations d'écran (40 mobile §5.2) ont été normalisées sur le jeton. |
| R-6 | L'hypothèse du module rail desktop passe sur deux lignes (« 52 SEMAINES » renvoyé) | Largeur de rail 380 px + espaces insécables ; le handoff l'affiche sur une ligne à 11 px. Sans enjeu de sens ; à revoir si jugé gênant. |

## 4. Lighthouse (build de production, médiane de 5 runs, preset mobile)

| Page | Perf | A11y | Best practices | SEO | FCP | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| Homepage | **96** (5×96) | **100** | **100**¹ | **100** | 1,21 s | 2,71 s | 0,004 | 0 ms |
| Dossier 041 | **97** (5×97) | **100** | **100**¹ | **100** | 1,07 s | 2,56 s | 0,000 | 0 ms |

¹ 96 sur les 5 premiers runs (favicon manquant, corrigé ensuite — 100 confirmé au run de contrôle).
LCP légèrement au-dessus de la cible 2,5 s (throttling Lighthouse mobile) : l'élément LCP est le titre Newsreader — optimisable par sous-ensemble de fonte (`pyftsubset`) si nécessaire, sans toucher à la DA. En deçà du seuil de blocage (4 s).

## 5. Accessibilité

axe-core (WCAG 2.0/2.1 A + AA), exécuté sur les deux pages à 390 px **et** 1280 px : **0 violation** (aucun niveau). Compléments : un seul `h1` par page, `lang="fr"`, statuts de pièces toujours écrits en toutes lettres (le carré est `aria-hidden`), jauges porteuses d'un `aria-label` « n obtenues sur m », focus clavier 2 px `--ink`.

## 6. Overflow et titres longs

- Débordement horizontal : **aucun** sur les 2 pages × 5 viewports (360→1440), scan automatique.
- Titre long : le titre du dossier 041 (137 caractères) passe sur les deux gabarits ; le cas extrême (230 caractères + mot insécable de 30 caractères) reste couvert par `/design-system` §8 — sans débordement.
- Grep automatisé « undefined / NaN / Invalid Date / null » sur le DOM rendu : **vierge**.

## 7. Lisibilité des métadonnées sur petit écran

Zooms ×3 archivés : `tests/qa/artefacts/meta-360-zoom{,-dossier}.png`. À 360 px, le mono 9,5 px (5,37:1) est net et lisible sur rendu simulé ; les étiquettes restent différenciées du texte courant. **Réserve maintenue (V-1 du rapport V0, à la demande du propriétaire)** : vérification sur Android d'entrée de gamme réel, en extérieur, avant le lancement — ce point reste ouvert et n'est pas réglable en CI.

## 8. JavaScript envoyé au navigateur

**0 octet.** Aucune balise `<script>` dans les pages générées, aucun fichier `.js` dans `dist/`, 0 requête de type `script` observée au chargement (mesure réseau Playwright). Poids première visite (compressé non applicable — mesure brute) : HTML ~31 Ko, CSS ~36 Ko, fontes ~267 Ko (latin + latin-ext chargés selon `unicode-range`), total ≈ 334 Ko.

## Problèmes restants / points ouverts

1. Vérification mobile réel des métadonnées 9–9,5 px (réserve V-1, décision propriétaire de V0).
2. LCP 2,5–2,7 s sous throttling : sous-ensemble de fontes possible en optimisation V1.
3. Comportements interactifs différés (R-2) et pages V1 (R-3) — à brancher dans les phases autorisées.
4. Hypothèse du module rail sur deux lignes (R-6) — arbitrage cosmétique.
5. L'état de profil unique du module (R-1) deviendra dynamique avec le profil persistant (V1, localStorage).

## Reproduire

```bash
npm run build && npx serve dist -l 4321 &
node tests/qa/audit-v01.mjs http://localhost:4321   # scans + captures + axe
node tests/qa/comparatif.mjs http://localhost:4321  # planches handoff ↔ rendu
CHROME_PATH=/opt/pw-browsers/chromium npx lighthouse http://localhost:4321/ --chrome-flags="--headless --no-sandbox"
```
