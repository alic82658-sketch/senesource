# SeneSource — Design System : structure et demandes au handoff (Agent C)

> Phase d'analyse pré-V0. Le handoff Claude Design étant introuvable, ce rapport ne fixe
> **aucune valeur visuelle** (pas de hex, pas de px, pas de nom de police). Il fixe la
> **structure** : nomenclature des tokens, branchement Tailwind v4, inventaire des
> composants V0 avec leurs états, la page `/design-system`, et la checklist exhaustive
> des valeurs à extraire du handoff avant la première ligne de CSS.

---

## 1. Architecture des tokens

### 1.1 Principe : deux couches

- **Couche 1 — Primitives** (`--ss-*`) : les valeurs brutes du handoff (une couleur = un hex, une taille = un px). Copiées telles quelles depuis le handoff, jamais inventées.
- **Couche 2 — Sémantique** : des alias par usage (`--color-encre`, `--color-fond`, `--rule-fine`…). C'est cette couche que les composants consomment. Si le handoff change une valeur, on touche la couche 1 seulement.

Un composant ne référence **jamais** une primitive directement, et jamais un hex en dur.

### 1.2 Nomenclature proposée (noms figés, valeurs en attente)

```css
/* ---- COULEURS (valeurs = TODO-HANDOFF) ---- */
--ss-fond;            /* fond de page (probablement blanc cassé / papier — à confirmer) */
--ss-encre;           /* texte principal */
--ss-encre-secondaire;/* métadonnées, légendes */
--ss-noir;            /* noir "avec parcimonie" — usages listés par le handoff */
--ss-ocre;            /* accent unique */
--ss-ocre-actif;      /* état hover/actif de l'ocre, si le handoff en donne un */
--ss-filet;           /* couleur des filets */
--ss-filet-fort;      /* filet appuyé, si distinct */
--ss-erreur;          /* états d'erreur UI (formulaires), si le handoff en prévoit */

/* ---- TYPO ---- */
--ss-font-serif;      /* grands éléments éditoriaux */
--ss-font-sans;       /* UI, métadonnées */
--ss-font-mono;       /* données, chiffres, cotes de pièces */
/* Échelle : un token par cran nommé par usage, pas par taille : */
--ss-text-titre-1 / -titre-2 / -titre-3 / -chapo / -corps / -meta / -legende / -chiffre;
/* chaque cran = size + line-height + tracking + weight, mobile ET desktop */

/* ---- ESPACE ---- */
--ss-espace-1 … --ss-espace-N;  /* échelle du handoff, N inconnu */
--ss-gouttiere; --ss-marge-page; --ss-mesure;  /* largeur de colonne de lecture */

/* ---- FILETS ---- */
--ss-filet-epaisseur-fine; --ss-filet-epaisseur-forte;

/* ---- STRUCTURE ---- */
--ss-conteneur-max;   /* largeur max du site */
--ss-colonne-lecture; /* largeur max du texte courant */
```

Convention : noms **en français** (cohérence avec le produit et le handoff), par **usage** et non par apparence (`--ss-encre` et pas `--ss-gris-900`), pour survivre aux ajustements du handoff.

### 1.3 Branchement Tailwind v4 sans hériter des défauts

Tailwind v4 se configure en CSS via `@theme`. Point critique : **purger les namespaces par défaut** avant d'injecter les tokens SeneSource, sinon `text-red-500`, `rounded-lg`, `shadow-md` restent disponibles et finiront dans le code.

```css
/* src/styles/globals.css */
@import "tailwindcss";
@import "./tokens.css";      /* primitives --ss-* (valeurs TODO-HANDOFF) */

@theme {
  /* 1. Purge des défauts */
  --color-*: initial;
  --font-*: initial;
  --text-*: initial;
  --font-weight-*: initial;
  --tracking-*: initial;
  --leading-*: initial;
  --radius-*: initial;      /* zéro border-radius : aucune classe rounded-* n'existe */
  --shadow-*: initial;      /* aucune ombre : aucune classe shadow-* n'existe */
  --blur-*: initial;
  --animate-*: initial;     /* pas d'animations décoratives */
  --breakpoint-*: initial;  /* breakpoints = ceux du handoff uniquement */

  /* 2. Injection SeneSource (mapping vers les primitives) */
  --color-fond: var(--ss-fond);
  --color-encre: var(--ss-encre);
  --color-ocre: var(--ss-ocre);
  /* … etc. */
  --font-serif: var(--ss-font-serif);
  --text-corps: /* size */; --text-corps--line-height: …; --text-corps--letter-spacing: …;
  --breakpoint-md: /* TODO-HANDOFF */;
}
```

Conséquence vertueuse : `rounded-lg` ou `shadow-md` deviennent des **erreurs de build/lint** (classe inexistante), pas des fautes de goût silencieuses. Les interdits du brief sont ainsi encodés mécaniquement.

- L'échelle typographique responsive (mobile → desktop) se gère soit par deux valeurs par cran + `@media`, soit par `clamp()` **si et seulement si** le handoff spécifie un comportement fluide ; sinon valeurs fixes par breakpoint.
- Filets : petite couche d'utilitaires dédiés (`@utility filet-haut { border-top: var(--ss-filet-epaisseur-fine) solid var(--ss-filet); }`) plutôt que de recomposer border-width + border-color partout.

### 1.4 Emplacement des fichiers

```
src/
  styles/
    tokens.css        # couche 1 : primitives --ss-* (le SEUL fichier à remplir depuis le handoff)
    globals.css       # @import tailwindcss + @theme (couche 2) + base (reset éditorial, focus states)
  components/
    ui/               # primitives : Filet, Label, Bouton, Meta…
    editorial/        # composés : Verdict, Citation, Piece, ImpactFinancier…
    layout/           # Nav, Footer, Grille, ColonneLecture
  app/
    design-system/page.tsx
```

Chaque valeur manquante dans `tokens.css` sera marquée `/* TODO-HANDOFF §x.y */` avec référence à l'item de la checklist (section 4). **Le build ne doit pas partir en production tant qu'un TODO-HANDOFF subsiste.**

---

## 2. Inventaire des primitives et composants V0

Pour chaque composant : rôle, props probables, variantes/états, et cas limites à couvrir dans `/design-system`. Les styles précis viennent du handoff ; ici on fige les **contrats**.

### 2.1 Fondations

| Fondation | Contenu | Cas à visualiser |
|---|---|---|
| **Couleurs** | Swatches de toutes les primitives + usages autorisés (l'ocre : où a-t-on le droit ?) | Contraste texte/fond vérifié (AA min. sur meta mobile) |
| **Typographies** | Chaque cran de l'échelle, serif/sans/mono, mobile et desktop | Titre très long (3 lignes), mot très long non césurable (wolof, URL) |
| **Grille** | Conteneur, colonnes, gouttières, marges | 320 px de large, tablette, desktop max |
| **Spacing** | Échelle visualisée en barres | — |
| **Filets** | Fine / forte, horizontale / verticale | Filet dans un fond contrasté |

### 2.2 Primitives UI

**`<Filet />`**
- Props : `orientation` (h/v), `epaisseur` (fine | forte), `espacement` (marges verticales issues de l'échelle).
- Sert de séparateur sémantique (`<hr>` stylé ou bordure).

**`<Bouton />`**
- Props : `variante` (à confirmer par le handoff — hypothèses de structure : primaire / secondaire / lien-flèche), `taille`, `asChild`/`href` (bouton vs lien), `disabled`, `loading`.
- États : repos, hover, focus-visible (le style focus DOIT venir du handoff, sinon outline standard fort — accessibilité > fidélité), actif, désactivé, chargement.
- Cas limites : libellé long (2 lignes ? troncature interdite ?), largeur pleine sur mobile ?

**`<Label />` (étiquette/tag : rubrique, statut de dossier, type de pièce)**
- Props : `type` (rubrique | statut | type-de-piece…), `taille`.
- Zéro radius, probablement mono ou sans — à confirmer.
- Cas limites : libellé long, plusieurs labels en ligne (retour à la ligne ?).

**`<Meta />` / `<MetaListe />` (métadonnées : date, auteur, temps de lecture, n° de dossier, statut)**
- Props : `items: {cle, valeur, href?}[]`, `separateur` (à confirmer : filet vertical ? point ? espace ?), `orientation` (inline desktop / empilé mobile ?).
- **Contrainte forte du brief : lisible sur mobile → taille minimum accessible même si le handoff donne plus petit ; l'écart éventuel sera documenté.**
- Cas limites : 1 seul item, 6 items, valeur manquante (afficher la clé sans valeur ? masquer la ligne ?), nom d'auteur long.

### 2.3 Composants éditoriaux

**`<Verdict />` — composant central du produit**
- Le verdict s'exprime **par le mot et la typographie**, pas par une couleur imposée.
- Props : `verdict` (liste exacte des verdicts à confirmer par le handoff/édito — ne pas l'inventer), `justification?` (une phrase), `taille` (bloc pleine page vs rappel compact dans une liste), `date?`.
- Variantes : bloc principal (page dossier), inline/compact (cartes de liste, homepage).
- Cas limites **obligatoires** : **absence de verdict** (dossier en cours d'instruction : que dit-on, comment ? — question au handoff), justification longue, verdict au mot long (« invérifiable en l'état »), deux verdicts sur une même page (mise à jour d'un dossier ?).

**`<Citation />` (bloc citation — la déclaration vérifiée)**
- Props : `texte`, `auteur`, `fonction?`, `source?`, `date?`, `langueOriginale?` (citation en wolof + traduction ?).
- Cas limites : citation très longue (10 lignes), très courte (3 mots), source manquante, citation sans auteur identifié.

**`<Piece />` (preuve / pièce du dossier)**
- Props : `cote` (ex. « Pièce n°… » — format exact du handoff), `titre`, `type` (document | photo | enregistrement | lien | témoignage…), `source`, `date?`, `fichier?` (lien/aperçu), `description?`.
- Variantes : item de liste (sommaire des pièces) vs bloc détaillé.
- Cas limites **obligatoires** : **document manquant/non consultable** (mention explicite — formulation à demander au handoff/édito), pièce sans date, aperçu indisponible (aucune image obligatoire : le composant doit être complet sans visuel), liste de 1 pièce vs 25 pièces.

**`<ImpactFinancier />` (le chiffre)**
- Props : `montant: number`, `devise` (FCFA par défaut ?), `libelle`, `precision?` (estimation vs établi), `source?`, `comparaison?` (équivalent parlant, si l'édito en prévoit).
- Formatage : espace insécable fine comme séparateur de milliers (format fr-SN), probablement mono — à confirmer.
- Cas limites **obligatoires** : **très grand chiffre** (ex. 1 250 000 000 000 FCFA — tient-il sur 320 px ? le handoff prévoit-il une taille réduite auto, une abréviation « milliards » ?), montant inconnu (« non chiffrable »), fourchette (min–max), zéro.

**`<CTA />` (appel à l'action éditorial : signaler, soutenir, s'abonner)**
- Pas de hero marketing : bloc sobre, texte + bouton.
- Props : `titre`, `texte?`, `action` (label + href), `variante` (fin de dossier / homepage — à confirmer).
- Cas limites : texte long, sans texte (titre + bouton seuls).

### 2.4 Navigation et structure

**`<Nav />` (en-tête)**
- Props : `rubriques[]`, `courante?`.
- Comportement mobile à confirmer par le handoff (menu déroulant ? liste horizontale scrollable ? — ne pas présumer un burger).
- États : lien courant, hover, focus ; scroll (l'en-tête reste-t-il fixe ? — question au handoff).

**`<Footer />`** — colonnes de liens, mention légale, rappel de mission. Contenu exact : handoff.

**`<CarteDossier />` (item de liste homepage/rubrique)**
- Composé : Label rubrique + titre serif + Verdict compact optionnel + Meta.
- Cas limites : sans verdict, titre 3 lignes, dossier sans impact financier.

**`<ColonneLecture />`** — enveloppe de largeur de mesure pour le corps de texte.

---

## 3. Page `/design-system`

Route App Router : `src/app/design-system/page.tsx` (+ `noindex` ; accessible en prod pour la revue par l'équipe, décision à valider).

Structure : une page unique, longue, navigable par une table des matières ancrée (elle-même construite avec les composants du système — la page est son propre test).

```
/design-system
├─ 0. Statut ................ liste des TODO-HANDOFF restants (généré depuis tokens.css)
├─ 1. Fondations
│   ├─ 1.1 Couleurs (swatches + usages autorisés + ratios de contraste calculés)
│   ├─ 1.2 Typographie (échelle complète, serif/sans/mono, spéc. mobile vs desktop)
│   ├─ 1.3 Grille & conteneurs (gabarits visualisés)
│   ├─ 1.4 Espacement
│   └─ 1.5 Filets
├─ 2. Primitives : Filet, Bouton (tous états), Label, Meta
├─ 3. Éditorial : Verdict, Citation, Piece, ImpactFinancier, CTA
├─ 4. Structure : Nav, Footer, CarteDossier
└─ 5. Cas limites ........... section transversale dédiée :
      texte long · vide · très grand chiffre · absence de verdict ·
      document manquant · erreur · 320 px (iframe étroite)
```

Conventions :
- Chaque spécimen est rendu avec du **contenu réaliste sénégalais** (noms, montants FCFA, institutions) — jamais de lorem ipsum : le produit est textuel, les cas limites sont linguistiques.
- Chaque composant est montré **dans tous ses états** côte à côte, y compris focus-visible (rendu forcé).
- Un composant utilitaire local `<Specimen titre etat>` encadre chaque cas (titre en meta, filet fin) — sans jamais styler les spécimens eux-mêmes.
- Pas de framework de type Storybook en V0 : une page RSC simple suffit et évite d'importer un design tiers.

---

## 4. LISTE DE DEMANDES AU HANDOFF (checklist bloquante avant code)

Chaque item est une question fermée. Convention de réponse attendue : une valeur exacte, ou « non spécifié → décision Agent C documentée ».

### A. Couleurs
1. Quel est le hex exact du fond de page ? Est-ce un blanc pur ou un blanc cassé/papier ?
2. Quel est le hex du texte courant (« encre ») ? Est-il distinct du « noir » réservé ?
3. Quel est le hex du noir « avec parcimonie », et quelle est la liste exhaustive de ses usages autorisés ?
4. Quel est le hex exact de l'ocre ? Existe-t-il une seule nuance ou plusieurs (repos/hover) ?
5. Quelle est la liste exhaustive des usages autorisés de l'ocre (liens ? filets ? labels ? boutons ? soulignements ?) ?
6. Quel est le hex du texte secondaire (métadonnées) ? Son contraste sur le fond atteint-il 4.5:1 ?
7. Quel est le hex des filets (identique ou distinct du texte secondaire) ?
8. Existe-t-il une couleur d'erreur UI (formulaires) ? Si oui, laquelle ?
9. Existe-t-il des fonds alternatifs (bloc verdict, bloc pièce, CTA) ? Si oui, quels hex ?
10. Confirmez-vous : aucune couleur associée aux verdicts, dans aucun contexte (y compris compact) ?
11. Un mode sombre est-il prévu en V0 ? (oui/non)

### B. Typographie — familles
12. Quelle est la famille serif exacte (nom, fonderie, licence) et les graisses utilisées (liste des poids + italiques) ?
13. Quelle est la famille sans-serif exacte et ses graisses ?
14. Quelle est la famille mono exacte et ses graisses ?
15. Ces polices sont-elles disponibles en fichiers variables ou statiques ? Où récupérer les fichiers (Google Fonts ? fichiers fournis ?) ?
16. Le mono est-il utilisé pour : les chiffres seulement ? les métadonnées ? les cotes de pièces ? (liste fermée des usages)

### C. Typographie — échelle
17. Pour **chaque** cran (titre-1, titre-2, titre-3, chapo, corps, meta, légende, chiffre-impact) : quelle taille px, quel line-height, quel letter-spacing, quelle graisse, quelle famille — **en desktop ET en mobile** ? (tableau attendu, 8 crans × 2 viewports × 5 propriétés)
18. L'échelle est-elle fluide (clamp) ou par paliers de breakpoint ?
19. Les titres serif sont-ils en casse normale, ou existe-t-il des usages de capitales/petites capitales (labels ?) avec quel tracking ?
20. Quelle est la taille minimale absolue autorisée (les métadonnées mobiles descendent-elles sous 12–13 px ? si oui, on arbitrera accessibilité > fidélité — le handoff en est-il d'accord ?)

### D. Grille, conteneurs, breakpoints
21. Quelle est la largeur max du conteneur principal (px) ?
22. Quelle est la largeur de la colonne de lecture (mesure du corps de texte, px ou ch) ?
23. Combien de colonnes, quelle gouttière, quelles marges latérales — par breakpoint ?
24. Quels sont les breakpoints exacts (liste des px) ?
25. Existe-t-il des gabarits de page distincts (homepage vs dossier vs rubrique) ? Lesquels ?

### E. Espacement et filets
26. Quelle est l'échelle d'espacement complète (liste des valeurs px) ? Est-elle multiplicative (base × n) ou libre ?
27. Quelles épaisseurs de filets existent (px exacts) — une seule « fine » ou fine + forte ?
28. Où les filets sont-ils obligatoires (entre articles ? au-dessus des méta ? autour du verdict ?) — liste des emplacements canoniques ?
29. Quels espacements verticaux séparent les grandes sections d'une page dossier (valeurs de l'échelle) ?

### F. Composants (styles)
30. Bouton : combien de variantes, et pour chacune — fond, texte, bordure, padding, typo, états hover/focus/disabled ?
31. Quel est le style de focus-visible global (couleur, épaisseur, offset) ?
32. Label : typo, casse, padding, bordure ou fond ?
33. Verdict : quelle liste exacte et fermée des verdicts possibles (mots exacts) ? Quel traitement typographique (cran, graisse, casse) en version bloc et en version compacte ? Qu'affiche-t-on quand il n'y a **pas encore** de verdict (mot exact) ?
34. Citation : guillemets français « » ? filet latéral ? retrait ? typo de l'attribution ?
35. Pièce : format exact de la cote (« Pièce 041-A » ?) ? structure du bloc ? mention exacte pour un document manquant ?
36. Impact financier : cran typo du chiffre, format des milliers, position de la devise, comportement quand le montant dépasse la largeur mobile (réduction ? passage en toutes lettres ?) ?
37. CTA : contenu, position (fin de dossier ? homepage ?), style ?
38. Navigation : liste exacte des entrées ; comportement mobile (pattern précis) ; l'en-tête est-il sticky ? style du lien courant ?
39. Footer : contenu exact (colonnes, mentions) ?
40. Liens dans le corps de texte : soulignés ? ocre ? les deux ? état visité ?

### G. Contenus
41. Homepage : quelle est la structure exacte des sections (ordre, nombre de dossiers affichés, textes d'interface exacts) ?
42. Dossier 041 : quels sont le titre exact, le chapo, la citation vérifiée, la liste des pièces, le verdict, le montant d'impact, les métadonnées — c'est-à-dire l'intégralité du contenu de référence à intégrer ?
43. Quel est le wording exact des éléments d'interface récurrents (« Lire le dossier », « Pièces », « Verdict », etc.) ?
44. Y a-t-il des contenus bilingues (français/wolof) à prévoir en V0 ?

### H. Divers
45. Quelle est l'exception explicite au zéro border-radius, s'il y en a une (le brief dit « sauf exception explicite ») ?
46. Y a-t-il un logo/marque typographique fourni (fichier, construction, zone de protection) ?
47. Y a-t-il des états d'interaction animés autorisés (transition de couleur au hover ? durée ?) ou strictement rien ?

---

## 5. Stratégie fonts (sans présumer des familles)

1. **`next/font` systématiquement** — `next/font/google` si les familles sont sur Google Fonts, sinon `next/font/local` avec les fichiers fournis par le handoff. Dans les deux cas : self-hosting automatique, zéro requête tierce au runtime, `preload` des graisses critiques uniquement.
2. **Trois familles max, graisses minimales.** Ne charger que les poids que le handoff liste (question B12–14). Préférer les fontes variables si disponibles (1 fichier par famille). Subset `latin` + vérifier la couverture des caractères nécessaires au français (œ, é…) et aux éventuels contenus wolof (ŋ, ë — présents en latin-extended : à vérifier selon la famille).
3. **Anti-CLS** : `next/font` génère automatiquement une fallback métrique (`size-adjust`, `ascent-override`) — la garder activée. Déclarer explicitement les piles de secours : serif → `Georgia, 'Times New Roman', serif` ; sans → pile système ; mono → `ui-monospace, 'Courier New', monospace`. Le site étant essentiellement du texte, c'est LE point de performance perçue.
4. **FOUT maîtrisé plutôt que FOIT** : `display: 'swap'` par défaut. Option à trancher à réception des polices : `display: 'optional'` sur le serif de titre si le swap tardif est visuellement violent — à tester, pas à décider maintenant.
5. **Exposition en variables** : chaque `next/font` exporte sa `variable` CSS (`--ss-font-serif`…), branchée sur `<html>`, consommée par `@theme`. Aucune famille codée en dur ailleurs.
6. **Budget** : cible < 100 Ko de fontes au premier chargement (mobile-first, réseaux sénégalais 3G/4G réels). Si le handoff demande plus de graisses que le budget ne le permet, remonter l'arbitrage plutôt que de trancher seul.

---

## 6. Risques (7)

1. **Coder sans handoff = tout refaire.** Chaque valeur inventée (hex, échelle typo) devra être re-vérifiée pixel par pixel à réception ; l'expérience montre qu'on « garde » les valeurs provisoires par inertie et le site dérive de la direction artistique. **Mitigation : coder les contrats et la structure, laisser `tokens.css` en TODO bloquants.**
2. **Le handoff reste introuvable durablement.** Le projet est gelé côté visuel. Mitigation : escalader immédiatement au propriétaire du projet (retrouver le lien Claude Design ou re-générer le handoff) ; la checklist §4 sert alors de cahier des charges pour le re-produire.
3. **Écart de nomenclature avec le handoff.** Si le handoff nomme ses tokens autrement, double vocabulaire et confusion. Mitigation : la couche primitive `--ss-*` adoptera les noms du handoff à réception ; seule la couche sémantique est figée ici.
4. **Verdict sans couleur mal spécifié.** Toute la charge sémantique repose sur le mot et la typo ; si le handoff ne donne pas la liste fermée des verdicts et leur traitement (question 33), le composant central du produit est indéfinissable — risque de l'inventer « en attendant ». Mitigation : Verdict est le premier item à faire valider, avec maquette de l'état « sans verdict ».
5. **Conflit accessibilité vs fidélité sur les métadonnées mobiles.** Si le handoff spécifie des metas trop petites ou trop claires, le brief impose de dévier (accessibilité > fidélité). Risque de ping-pong. Mitigation : question 20 posée d'avance + écarts consignés dans `/design-system` section Statut.
6. **Fuite des défauts Tailwind.** Sans purge `--*: initial`, des `rounded`/`shadow`/couleurs Tailwind s'infiltrent et produisent exactement le look « SaaS » interdit. Mitigation : purge dans `@theme` (§1.3) + lint interdisant les valeurs arbitraires `[...]` hors tokens.
7. **Polices : licence ou indisponibilité.** Si la famille du handoff est payante ou sans les graisses voulues, blocage ou substitution non autorisée. Mitigation : questions B12–15 traitées en priorité 1, avec les hex — ce sont les deux dépendances qui bloquent tout le reste.

---

### Prochaine étape recommandée
Transmettre la section 4 (47 questions) au détenteur du handoff. **Priorité 1 (bloquant tout)** : A1–A7, B12–14, C17, D21–24, E26–27. Le reste peut arriver par lots pendant qu'on monte la structure (arborescence, contrats de composants, page `/design-system` avec spécimens en TODO).
