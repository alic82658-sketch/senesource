# SeneSource — Rapport V0 : design system (Agent F, QA)

**Date :** 2026-08-22 · **Périmètre :** page `/design-system` · **Référence :** `design/handoff/SeneSource Systeme.dc.html` (gelé, commit du 22.08.2026)

## Verdict d'audit : GO (V0 validé côté QA, sous réserve de l'arbitrage ÉCART-001)

L'audit automatisé (`tests/qa/audit-v0.mjs`, exécuté sur le build de production) conclut à
**0 blocage, 0 remarque** :

| Contrôle | Résultat |
|---|---|
| `border-radius` ≠ 0 (tous éléments, tous états rendus) | **0 occurrence** |
| `box-shadow` / `text-shadow` / `drop-shadow` | **0 occurrence** |
| Couleurs hors tokens (color, background, bordures, décorations, outline) | **0 occurrence** — 100 % des couleurs résolues appartiennent à `tokens.css` |
| Gris Tailwind par défaut | **0 occurrence** (namespaces purgés : ces classes n'existent pas) |
| Débordement horizontal 360 / 390 / 768 / 1280 / 1440 | **aucun** |
| Polices chargées (Newsreader normal + italique, Public Sans, IBM Plex Mono) | **4/4** — aucun fallback silencieux |
| Texte < 9 px | **0 occurrence** (plancher effectif : 9 px, valeur du handoff) |
| axe-core WCAG 2.0/2.1 AA (390×844) | **0 violation** après correction ÉCART-001 |

Captures de référence (baseline de non-régression) : `tests/qa/artefacts/design-system_{360x640,390x844,768x1024,1280x800,1440x900}.png` + `audit-v0.json`.

---

## Écarts au handoff

### ÉCART-001 — action « Ouvrir » de la citation officielle (§4.7) — **appliqué, à arbitrer**

- **Handoff :** action en ocre `#A2621B` sur fond `--paper-2` `#F2EEE6`.
- **Mesure :** contraste 4,22:1 < 4,5:1 (WCAG AA, texte 9,5 px) — violation `serious` confirmée par axe-core.
- **Règle du brief :** « ne jamais sacrifier l'accessibilité à la fidélité graphique ».
- **Solution minimale appliquée** (`CitationOfficielle.astro`) : texte de l'action en `--ink`, **soulignement 1 px ocre** (décoratif, sans exigence de contraste) — le signal ocre du renvoi est conservé, le contraste passe à 16,98:1.
- **Alternative si refusée :** revenir à l'ocre plein (1 ligne de CSS) en assumant l'échec AA sur ce seul élément.

### Choix d'implémentation documentés (pas des écarts de valeurs)

1. **Navigation mobile :** le handoff fixe « quatre entrées maximum » (§7) mais l'écran mobile de référence (§5.1) n'en montre que trois (sans Méthode). Implémenté comme les gabarits : 3 entrées sur mobile, 4 sur desktop.
2. **Palette :** la palette §1 est fermée à onze valeurs, mais les gabarits normatifs §4–§6 emploient huit valeurs supplémentaires (texte de verdict `#2B2925`, qualification `#4A4741`, contour de puce `#D8D2C7`, écran inversé, page Document). Elles sont reprises **telles quelles** dans `tokens.css`, section « valeurs relevées dans les gabarits normatifs » — aucune couleur inventée.
3. **Très grands chiffres (cas limite 8.2) :** le chiffre utilise des espaces fines insécables et passe à la ligne entier ; au-delà de la largeur d'un encart 350 px, le module conserve sa géométrie (pas de réduction automatique — le handoff n'en prévoit pas). À confirmer à l'usage.

---

## Points de vigilance (conformes au handoff, consignés pour décision ultérieure)

| # | Constat | Mesure | Risque |
|---|---|---|---|
| V-1 | Métadonnées mono 9–9,5 px (`--mid` 5,37:1 sur paper) | AA respecté (> 4,5:1) | Lisibilité réelle sur Android entrée de gamme au soleil ; le protocole recommandait ≥ 7:1 sous 14 px. Le handoff impose ces tailles ; à vérifier sur mobile réel (E11) en V0.1. |
| V-2 | Ocre sur paper : 4,61:1 | AA petit texte respecté de justesse | Aucun texte ocre < 14 px ne doit apparaître sur un fond plus sombre que `--paper` ; règle tenue par les composants actuels. |
| V-3 | Carré vide `--hollow` : 2,63:1 (< 3:1 composant UI) | toléré | Décoratif et redondant : le mot (ÉTABLI / SANS RÉPONSE…) est toujours écrit (§7 du handoff), le carré est `aria-hidden`. |
| V-4 | Poids fontes : ~229 Ko au premier rendu (Newsreader variable 128 Ko + italique 61 Ko + Public Sans 26 Ko + Plex Mono 14 Ko, subset latin) | > budget indicatif 120 Ko | Fidélité (axe optique Newsreader) prime ; optimisation possible plus tard par sous-ensemble `pyftsubset`. Latin-ext et graisses non critiques chargent à la demande (`unicode-range`). |
| V-5 | Formulaire inversé : note `#7D766B` sur `--ink` = 4,01:1 ; méta de page Document `#8B8579` sur blanc = 3,67:1 | composants non construits en V0 | À traiter comme ÉCART-001 (même règle) quand ces écrans seront implémentés (V1). |

---

## Ce que couvre la page `/design-system`

Fondations (couleurs avec contrastes mesurés, échelle typographique complète, espacement/filets/grille), primitives (boutons + états désactivé/focus, puces de profil, carrés, jauges, renvois, champ), composants éditoriaux (bloc verdict avec/sans verdict, lignes de preuve, module conséquences ×2, citations, cartes dossier ×2, encart d'explication, rail des pièces, bandeau inversé), structure (en-tête responsive), états d'interaction (survol, focus, chargement), et six cas limites (titre > 140 caractères, très grand chiffre, verdict long, collecte à zéro pièce, document manquant, mot insécable).

Non couvert en V0 (prévu aux phases suivantes, conformément au périmètre) : écrans complets (V0.1), formulaire inversé complet, page Document, module épinglé `sticky` mobile, panneau latéral des renvois — les trois derniers demandent les pages réelles pour être testés honnêtement.

## Reproduire l'audit

```bash
npm run build
npx serve dist -l 4321 &
node tests/qa/audit-v0.mjs http://localhost:4321
```
