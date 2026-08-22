# SeneSource — Protocoles d'audit QA (Agent F, Senior Reviewer)

**Version :** 1.0 — 2026-08-22
**Statut préalable bloquant :** ⛔ **Le handoff Claude Design est introuvable.** Sans document de référence (tokens, échelle typo, espacements, maquettes), l'audit de fidélité (section 3) est **impossible à exécuter** et toute validation V0 serait une validation « contre rien ». Tant que le handoff n'est pas restauré ou re-généré et gelé (versionné dans le repo, ex. `design/handoff.md` + exports PNG), **V0 est NO-GO par défaut**, quelle que soit la qualité apparente du rendu. Les protocoles ci-dessous sont néanmoins prêts à être exécutés dès réception.

---

## 1. Protocole d'audit V0 — page `/design-system`

### 1.1 Objet

La page `/design-system` est le contrat visuel du produit : tokens de couleur, échelle typographique (serif éditorial + mono métadonnées), filets, espacements, et les composants de base (verdicts, journal de pièces, cartes dossier, labels de statut). C'est ici qu'on tue les dérives **avant** qu'elles ne se propagent.

### 1.2 Pré-requis d'environnement (CI / container Linux)

Chromium + Playwright préinstallés. Compléments à installer dans le job :

```bash
npm i -D @playwright/test @axe-core/playwright @lhci/cli pixelmatch pngjs
# Build de prod obligatoire — jamais d'audit sur le dev server
npm run build && npm run start &   # ou `next start -p 3000`
npx wait-on http://localhost:3000/design-system
```

Règle : **tout audit se fait sur le build de production** (`next build`), car le dev server fausse Lighthouse, le CLS et la taille JS.

### 1.3 Checklist opérationnelle

#### A. Tokens & couleurs (automatisable)

| # | Vérification | Méthode | Sévérité |
|---|---|---|---|
| A1 | Aucune couleur hors palette tokens dans le CSS rendu | Script Playwright : parcourir `getComputedStyle` de tous les éléments, collecter `color`, `background-color`, `border-color`, comparer à la liste blanche des tokens (valeurs RGB résolues) | **Blocage** |
| A2 | Aucun gris Tailwind par défaut (`#6b7280`, `#9ca3af`, `#e5e7eb`, `#f3f4f6`, `#111827`, etc. — palettes `gray/slate/zinc/neutral/stone`) | Même script, liste noire explicite des hexa Tailwind par défaut | **Blocage** |
| A3 | L'ocre est le **seul** accent : aucune deuxième couleur saturée (bleu lien navigateur par défaut, rouge/vert système) | Extraction des couleurs + contrôle de saturation HSL (S > 25 % hors ocre ⇒ échec) | **Blocage** |
| A4 | Liens : pas de `color: rgb(0,0,238)` ni `text-decoration` par défaut non stylée | `getComputedStyle` sur tous les `a` | **Blocage** |

#### B. Forme — zéro radius, zéro ombre (automatisable)

| # | Vérification | Méthode | Sévérité |
|---|---|---|---|
| B1 | `border-radius` = 0 partout | Script : `document.querySelectorAll('*')`, échec si `borderRadius !== '0px'`. Exceptions déclarées dans une liste blanche versionnée (a priori : aucune) | **Blocage** |
| B2 | `box-shadow` = none partout, `filter: drop-shadow` = none, `text-shadow` = none | Idem | **Blocage** |
| B3 | Composants tiers (éventuel toast, dialog, select natif stylé) respectent B1/B2 — y compris leurs états ouverts | Ouvrir chaque composant interactif avant le scan | **Blocage** |
| B4 | `outline` de focus : visible, rectangulaire, conforme au token (pas l'anneau arrondi Tailwind `ring` par défaut) | Tab au clavier + screenshot des états focus | **Blocage** (focus invisible) / Remarque (style de l'anneau à ajuster) |

#### C. Typographie (semi-automatisable)

| # | Vérification | Méthode | Sévérité |
|---|---|---|---|
| C1 | Serif éditorial effectivement chargé (pas de fallback Times silencieux) | `document.fonts.check('16px <FamilleSerif>')` + comparaison `measureText` contre fallback | **Blocage** |
| C2 | Mono utilisé pour toutes les métadonnées (dates, cotes de documents, numéros de dossier) et **uniquement** pour elles | Revue visuelle sur captures + assertions sur les classes des composants exposés dans `/design-system` | **Blocage** si une métadonnée est en serif/sans |
| C3 | Échelle typographique conforme au handoff (tailles, graisses, interlignage, letter-spacing) | Mesures `getComputedStyle` exportées en JSON, diff contre le tableau du handoff | **Blocage** si dérive > 1 px ou graisse différente |
| C4 | Taille minimale de texte : **≥ 12 px rendu** pour le mono métadonnées, ≥ 16 px pour le corps de texte | Scan automatique `fontSize` | **Blocage** < 11 px ; Remarque à 12–13 px si contraste limite |
| C5 | Pas de `font-synthesis` (faux gras / faux italique) sur le mono | `getComputedStyle` + inspection des graisses chargées | Remarque |

#### D. Filets, espacements, structure

| # | Vérification | Méthode | Sévérité |
|---|---|---|---|
| D1 | Filets fins : `border-width` = 1px (ou valeur handoff), couleur token, jamais 2px accidentels par chevauchement de borders | Captures zoomées + scan `borderWidth` | Remarque, **Blocage** si systémique |
| D2 | Espacements verticaux conformes à l'échelle (multiples du pas de grille du handoff) | Mesure `getBoundingClientRect` entre blocs, tolérance ±2 px | Remarque |
| D3 | Aucun débordement horizontal à aucun viewport | `document.documentElement.scrollWidth <= innerWidth` à chaque viewport | **Blocage** |

#### E. Captures multi-viewports

Script Playwright unique, captures `fullPage` :

| Viewport | Cible |
|---|---|
| **360×640** | Android entrée de gamme (référence Sénégal — prioritaire) |
| 390×844 | iPhone récent |
| 768×1024 | Tablette / breakpoint md |
| 1280×800 | Laptop |
| 1440×900 | Desktop large |

Captures archivées comme artefacts CI, nommage `design-system_<viewport>_<commit>.png`. Elles servent de **baseline** pour la non-régression visuelle des versions suivantes (`expect(page).toHaveScreenshot()` avec `maxDiffPixelRatio: 0.001` une fois la baseline validée).

#### F. Accessibilité (axe-core)

```ts
const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
  .analyze();
```

- **Blocage** : toute violation `critical` ou `serious` (contraste, name/role/value, ordre des headings cassé, zone tactile).
- **Remarque** : `moderate`/`minor`, à corriger avant V0.1.
- Complément manuel : navigation Tab complète (ordre logique, focus visible), zoom navigateur 200 % sans perte de contenu.

#### G. Contraste — vérification dédiée (au-delà d'axe)

axe-core rate les textes sur fonds superposés et ne juge pas la lisibilité réelle du mono fin à petite taille. Script complémentaire : pour chaque nœud texte, résoudre le fond effectif (remontée des ancêtres), calculer le ratio WCAG.

- Corps : **≥ 4.5:1** (Blocage en dessous).
- Texte ≥ 24 px ou ≥ 18.66 px gras : ≥ 3:1.
- **Métadonnées mono < 14 px : 4.5:1 strict exigé ET ≥ 7:1 recommandé** (Remarque entre 4.5 et 7) — un mono light gris sur blanc cassé à 12 px est illisible au soleil sur un écran d'entrée de gamme, même s'il « passe » AA.
- Ocre sur blanc : à mesurer précisément — la plupart des ocres tombent **sous 4.5:1** ⇒ l'ocre est acceptable en filet/aplat/gros titre, **interdit en petit texte sur fond clair** sauf preuve chiffrée.

#### H. Lighthouse CI (V0 — page statique, seuils stricts)

`lighthouserc.json`, preset desktop **et** mobile :

| Métrique | Seuil V0 `/design-system` |
|---|---|
| Performance (mobile, throttling par défaut LH) | ≥ 95 |
| Accessibility | = 100 |
| Best practices | ≥ 95 |
| CLS | ≤ 0.02 (page statique : quasi zéro exigé) |
| Polices | `font-display: swap` ou `optional` + preload, échec si FOIT |

Une page de design-system qui ne tient pas ces seuils annonce des pages réelles catastrophiques.

### 1.4 Critères Blocage vs Remarque — synthèse V0

**BLOCAGE (véto direction artistique ou intégrité) :**
1. Tout radius ou ombre résiduel, y compris états ouverts/focus de composants tiers.
2. Toute couleur hors tokens ; tout gris Tailwind par défaut ; tout deuxième accent saturé.
3. Serif non chargé / métadonnée hors mono.
4. Contraste AA non atteint sur n'importe quel texte, mono inclus.
5. Violation axe `critical`/`serious` ; focus clavier invisible.
6. Scroll horizontal à 360 px.
7. Dérive typographique mesurée contre le handoff (> 1 px, graisse, famille).
8. **Absence de handoff de référence** (cf. statut préalable).

**REMARQUE (à corriger, non bloquant pour la démo interne uniquement) :** espacements hors grille ±2–4 px, mono 12–13 px sous 7:1, filets épaissis localement, violations axe `moderate`, `font-synthesis`.

---

## 2. Protocole d'audit V0.1 — homepage + dossier 041 (desktop + mobile)

### 2.1 Viewports et réseau de référence

**Viewports :** les 5 de la section 1.3.E, avec **360×640 comme viewport de vérité** : tout ce qui casse à 360 px est un bug, pas un cas limite. Contexte Sénégal : parc Android dominé par l'entrée de gamme (Tecno, Itel, Samsung A0x), écrans 360–412 px CSS, CPU faibles.

**Profils réseau/CPU simulés (Playwright CDP + Lighthouse) :**

| Profil | Débit | RTT | CPU throttle | Usage |
|---|---|---|---|---|
| « Dakar 4G chargée » (≈ Slow 4G) | 1.6 Mbps down / 750 Kbps up | 150 ms | ×4 | **Profil de référence des seuils** |
| « 3G intérieur du pays » | 400 Kbps | 400 ms | ×6 | Test de survie (pas de seuil chiffré, mais la page doit afficher son contenu texte) |

### 2.2 Seuils chiffrés proposés (V0.1)

Mesurés sur build prod, profil « Dakar 4G chargée », médiane de **5 runs** Lighthouse.

| Métrique | Homepage | Dossier 041 | Sévérité si dépassé |
|---|---|---|---|
| Lighthouse Performance (mobile) | ≥ 85 | ≥ 85 | Blocage < 75 ; Remarque 75–85 |
| Lighthouse Accessibility | = 100 | = 100 | **Blocage** |
| LCP (réseau simulé) | ≤ 2.5 s | ≤ 3.0 s | Blocage > 4 s ; Remarque entre les deux |
| CLS | ≤ 0.05 | ≤ 0.05 | Blocage > 0.1 |
| TBT | ≤ 300 ms | ≤ 300 ms | Remarque ; Blocage > 600 ms |
| **JS transféré (compressé)** | ≤ 170 Ko | ≤ 200 Ko | Blocage > 300 Ko |
| Poids total première vue | ≤ 500 Ko | ≤ 800 Ko (images de documents lazy-loadées au-delà) | Remarque ; Blocage > 1.5 Mo |
| Polices | WOFF2, sous-ensembles latins, ≤ 120 Ko total | idem | Remarque |
| Images de pièces/documents | `next/image` ou équivalent, dimensions déclarées (zéro CLS), lazy hors viewport | idem | Blocage si CLS induit |
| Contraste | AA partout, règle renforcée mono < 14 px (section 1.3.G) | idem | **Blocage** |
| Zones tactiles | ≥ 44×44 px (liens de pièces, nav) | idem | Blocage < 24 px, Remarque 24–44 |

Mesure JS : `page.on('response')` Playwright, somme des `content-length` des ressources `script` — plus fiable que le rapport Lighthouse seul.

### 2.3 Scénarios d'états dégradés (obligatoires, avec captures)

Chaque scénario est joué **à 360×640 et 1280×800 minimum**, capture archivée, via données de test injectées (fixtures — reproductibles en CI, pas cliqués à la main).

| # | Scénario | Ce que je vérifie | Sévérité type |
|---|---|---|---|
| E1 | **Homepage sans aucun dossier** | État vide éditorialisé (message dans la voix du média, pas un écran blanc ni un spinner) ; structure intacte | Blocage si écran blanc/crash |
| E2 | **Dossier sans verdict** (en instruction) | Absence de verdict affichée comme un **statut assumé** — jamais un emplacement vide, jamais un verdict par défaut, **jamais une jauge à zéro qui ressemble à « faux »** | **Blocage** (intégrité éditoriale) |
| E3 | **Dossier sans documents / documents manquants** (0 pièce, ou 2 sur 6 non fournies) | Journal honnête, mention explicite des pièces manquantes ; pas d'image cassée, placeholder token-conforme sans radius/ombre | Blocage si icône d'image cassée du navigateur |
| E4 | **Titre exceptionnellement long** (2× la longueur max prévue, + un mot insécable de 30 caractères type URL/nom d'institution) | Pas de débordement, pas d'écrasement de la métadonnée mono, `overflow-wrap` correct, clamp éventuel documenté | Blocage si scroll horizontal |
| E5 | **Très grands chiffres d'impact** (ex. « 4 512 000 000 FCFA ») | Pas de retour à la ligne au milieu du nombre (espaces insécables fines), pas de réduction illisible, formatage fr cohérent | Blocage si le chiffre est tronqué ou ambigu |
| E6 | **Textes longs** (résumé 3× plus long, légende de pièce très longue) | Rythme vertical conservé, filets non cassés, pas de chevauchement | Remarque, Blocage si chevauchement |
| E7 | **Erreur de chargement Supabase** (timeout, 500 — simulé par blocage réseau dans Playwright ; s'applique dès la bascule Supabase) | `error.tsx` conforme à la DA, message en français utile, action de réessai ; **jamais** la stack trace ni l'écran d'erreur Next par défaut | **Blocage** |
| E8 | **Chargement lent** (latence 3 s injectée) | États de chargement conformes DA (pas de skeleton arrondi gris Tailwind par défaut !) ; pas de CLS au remplacement | Blocage si CLS > 0.1 ou skeleton hors DA |
| E9 | **Champ optionnel absent** (pas de date, pas d'auteur, pas de source sur une pièce) | La ligne mono se recompose proprement, pas de « undefined », « null », « NaN », « Invalid Date », séparateurs orphelins (« · · ») | **Blocage** (grep automatique de ces chaînes dans le DOM rendu sur tous les scénarios) |
| E10 | **Dossier 041 avec toutes les pièces + verdict** (chemin nominal) | Baseline de comparaison pour tous les scénarios ci-dessus | — |
| E11 | **Mobile réel (hors CI, avant GO final V0.1)** : un passage sur au moins un Android physique d'entrée de gamme, en 4G locale si possible | Lisibilité du mono au soleil, fluidité du scroll, tap targets réels | Remarque documentée obligatoire ; Blocage si illisible |

### 2.4 Accessibilité V0.1 (delta vs V0)

- axe-core sur homepage + dossier 041 **dans chaque état dégradé E1–E9** (un état d'erreur inaccessible est un état inaccessible).
- Hiérarchie de titres : un seul `h1` par page, pas de saut de niveau.
- Le verdict et le journal de pièces doivent être compréhensibles **sans la couleur et sans la forme** (texte explicite) — testé via l'arbre d'accessibilité Playwright et inspection ARIA.
- `lang="fr"` sur `<html>` ; libellés de dates en français.

---

## 3. Grille de fidélité au design (handoff ↔ navigateur)

> ⛔ Rappel : inapplicable tant que le handoff est introuvable. La grille ci-dessous est le protocole prêt à l'emploi.

### 3.1 Pré-condition : geler la référence

1. Handoff versionné dans le repo (`design/`) : tableau des tokens (hex exacts), échelle typo (famille/taille/graisse/interlignage/tracking par style nommé), échelle d'espacement, spécification des composants, **exports PNG des maquettes aux largeurs 360 et 1440**.
2. Toute évolution du handoff = commit + note de version. On n'audite jamais contre une référence mouvante.

### 3.2 Comparaison reproductible

**a) Côte à côte automatisé.** Script Playwright : capture navigateur à la largeur exacte de la maquette (360 / 1440, `deviceScaleFactor` aligné sur l'export), puis génération d'une planche HTML trois colonnes : **maquette | rendu | diff pixelmatch** (seuil 0.1, sortie du pourcentage de pixels divergents). Le diff pixel n'est **pas** un critère de blocage en soi (le contenu réel diffère de la maquette) : c'est un **détecteur de zones à examiner**.

**b) Mesures typographiques objectives.** Script d'extraction : pour chaque style nommé du handoff (Titre dossier, Chapô, Corps, Méta mono, Verdict…), sélecteur correspondant dans le DOM → JSON `{famille, taille, graisse, interlignage, tracking, couleur}` → **diff automatique contre le tableau du handoff**. Tolérances : taille ±0 px (les tokens sont exacts ou ils ne sont pas), interlignage ±1 px, tracking ±0.01 em, couleur : hex identique exigé.

**c) Espacements.** Mesure `getBoundingClientRect` des écarts entre blocs clés (header→titre, titre→méta, méta→filet, entre cartes) aux deux largeurs de référence, diff contre l'échelle du handoff, tolérance ±2 px (arrondis de sous-pixel).

**d) Revue humaine.** 30 minutes par écran, maquette et rendu côte à côte au zoom 100 %, sur les points que les scripts ne jugent pas : gris optique, rythme vertical ressenti, hiérarchie de lecture, comportement entre les breakpoints de la maquette.

### 3.3 Format du rapport d'écarts

Un tableau unique par écran, chaque écart identifié :

```
| ID | Écran/Composant | Attendu (handoff, réf. précise) | Constaté (mesure) | Preuve (capture/JSON) | Sévérité | Verdict |
| F-041-003 | Dossier/Méta mono | Mono 13px/18px, token encre-secondaire | 13px/18px, #9ca3af (gray-400 Tailwind) | typo-diff.json L42, capture c12 | Majeure | BLOCAGE |
```

Sévérités : **Bloquant** (dérive DA : couleur hors token, radius/ombre, famille/graisse fausse, structure différente) / **Majeur** (espacement systémique faux, hiérarchie affaiblie) / **Mineur** (±2–4 px localisés). Le rapport se conclut par un décompte et le verdict global de l'écran.

---

## 4. Pièges spécifiques SeneSource — liste de surveillance

Ce produit affirme une rigueur documentaire ; son interface n'a pas le droit d'être moins rigoureuse que son propos.

**Intégrité éditoriale (les plus graves) :**
1. **« Pièces : 4/6 » lue comme jauge de vérité.** Un journal de documents réunis n'est pas un score de véracité. Si la présentation visuelle (barre de progression, remplissage ocre, pourcentage) laisse croire que le dossier est « à 66 % vrai », c'est un blocage. Le journal doit se lire comme un inventaire (« 4 pièces sur 6 attendues »), jamais comme une note.
2. **Chiffre d'impact sans hypothèses visibles.** Tout grand chiffre doit avoir sa source/méthode accessible **au même niveau visuel** (renvoi, note mono). Un chiffre spectaculaire orphelin de ses hypothèses est un blocage éditorial.
3. **Absence de verdict maquillée.** Verdict par défaut, jauge vide, emplacement blanc : tout ce qui laisse deviner un verdict non rendu est un blocage (cf. E2).
4. **Hiérarchie visuelle qui éditorialise à l'insu du texte** : un verdict « faux » plus gros ou plus mis en avant qu'un « confirmé », des pièces à charge mises en avant par l'espacement — la mise en page ne doit pas plaider.

**Direction artistique :**
5. **Faux gris Tailwind** : `text-gray-500`, `border-gray-200`, `bg-slate-50` qui s'infiltrent au lieu des tokens — le piège n° 1 en pratique. Détection automatique (1.3.A2) + revue des classes.
6. **Radius/ombres résiduels de tiers** : toasts, dialogs, `focus:ring` arrondi Tailwind, `<details>`, scrollbars stylées, autofill jaune de Chrome sur les champs, ombre du `select` natif ouvert.
7. **Ocre qui prolifère** : l'accent unique devient fond de section, couleur de lien systématique, hover… L'ocre se dilue et la page perd sa tension. Compter les usages d'ocre par écran.
8. **Ocre en petit texte sur clair** : contraste presque toujours < 4.5:1 (1.3.G).
9. **Mono illisible en conditions réelles** : 10–11 px, graisse light, gris faible, tracking serré — parfait sur un MacBook, illisible sur un Itel au soleil. Règle des 12 px + 4.5:1 strict (7:1 recommandé).
10. **Fallback de police silencieux** : serif éditorial qui retombe en Times (FOUT mal géré, sous-ensemble latin sans les caractères « ÿ » ou guillemets français « » — vérifier avec du contenu réel sénégalais : noms propres, FCFA, ’).

**Technique / contexte Sénégal :**
11. **Scans de documents lourds** non compressés ni lazy-loadés : 5 pièces en JPEG 3 Mo = page morte en 3G. Budget image par pièce + lazy strict.
12. **Chiffres non insécables** : « 4 512 000 000 FCFA » coupé en fin de ligne entre « 512 » et « 000 » change la lecture. Espaces insécables fines obligatoires.
13. **`Invalid Date` / `undefined` / locale** : dates non-`fr` (« Aug 22 » au lieu de « 22 août 2026 »), `toLocaleString` sans locale explicite (dépend du serveur), null non gérés (E9).
14. **CLS par les polices et les scans** : swap de la serif qui fait sauter le titre, images sans dimensions.
15. **Filets qui doublent** : deux borders 1px adjacentes = filet 2px — la signature « filets fins » se dégrade discrètement aux jonctions de composants.

---

## 5. Conditions formelles GO / NO-GO

### 5.1 GO V0 (page `/design-system`)

**GO si et seulement si TOUTES les conditions suivantes sont vraies :**
1. Handoff Claude Design **restauré, versionné et gelé** dans le repo. *(Aujourd'hui : non ⇒ NO-GO d'office.)*
2. Zéro critère de blocage de la section 1.4 : zéro radius/ombre (états ouverts inclus), 100 % des couleurs dans les tokens, zéro gris Tailwind par défaut, ocre accent unique, serif + mono conformes, dérive typo nulle contre le handoff.
3. axe-core : zéro violation `critical`/`serious` ; Lighthouse Accessibility = 100.
4. Contraste : AA partout, y compris règle renforcée mono.
5. Aucun scroll horizontal 360→1440.
6. Lighthouse : Perf mobile ≥ 95, CLS ≤ 0.02.
7. Baseline de captures multi-viewports archivée et signée (elle devient la référence de non-régression).
8. Remarques : ≤ 5, toutes tracées avec ticket et échéance avant V0.1.

**NO-GO automatique** si l'un des points 1–7 échoue. Pas de « GO conditionnel » sur un critère de blocage : un blocage se corrige, puis on ré-audite.

### 5.2 GO V0.1 (homepage + dossier 041)

**Pré-condition :** V0 est GO (on ne valide pas des pages sur un design-system non validé).

**GO si et seulement si :**
1. Zéro régression visuelle contre la baseline V0 sur les composants partagés (diff screenshots < 0.1 % hors zones de contenu).
2. Grille de fidélité (section 3) exécutée sur les deux écrans, aux largeurs 360 et 1440 : **zéro écart Bloquant, zéro Majeur non arbitré** (un Majeur ne passe que sur dérogation écrite du responsable design, tracée dans le rapport).
3. **Les 9 scénarios dégradés E1–E9 passent**, captures archivées, grep « undefined/null/NaN/Invalid Date » vierge sur tous les états.
4. Seuils section 2.2 tenus (médiane 5 runs, profil « Dakar 4G chargée »).
5. Aucun des pièges d'intégrité éditoriale 4.1–4.4 constaté : journal de pièces non ambigu, chiffres d'impact sourcés visuellement, absence de verdict affichée comme statut.
6. Test « survie 3G » : contenu texte lisible, pas d'écran blanc.
7. Passage sur mobile Android réel effectué et documenté (E11).
8. Remarques ouvertes : ≤ 10, tracées.

**NO-GO automatique si :** un seul écart Bloquant de fidélité ; un scénario E1–E9 en échec ; A11y < 100 ou contraste AA rompu ; LCP > 4 s ou CLS > 0.1 ou JS > 300 Ko ; tout radius/ombre/couleur hors token découvert sur les pages réelles.

### 5.3 Gouvernance

- Tout NO-GO est accompagné du rapport d'écarts (format 3.3), reproductible par n'importe qui via les scripts CI — blocage sur mesures, pas sur goût.
- Un ré-audit après correction rejoue **l'intégralité** du protocole concerné, pas seulement les points échoués.
- Le véto DA (radius, ombre, hors-token, second accent, intégrité éditoriale) n'est pas négociable par échéance de livraison ; tout le reste s'arbitre avec le responsable design, par écrit.

---

**Décision du jour : NO-GO préventif sur V0 — pas de handoff, pas de référence, pas de validation.** Action demandée : restaurer ou re-produire le handoff, le versionner dans le repo (tokens + échelle typo + exports 360/1440), puis déclencher le protocole V0.
