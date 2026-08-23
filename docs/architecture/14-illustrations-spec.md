# SeneSource — Illustrations facultatives : modèle éditorial & emplacements

**Date :** 2026-08-23 · Spécification des illustrations facultatives dans le modèle
éditorial et le design system. Fait suite à la demande produit : « prévoir les
illustrations facultatives des dossiers ; un dossier doit rester visuellement complet
sans image ».

> **Statut : PROPOSITION D'EXTENSION du handoff figé — en attente de validation par
> le propriétaire du design.** Le handoff Claude Design (source de vérité visuelle,
> `design/handoff/`) **ne traite aucune image** : il n'existe aujourd'hui aucun langage
> visuel d'illustration figé (dimensions, filets, légendes, ratios, comportement
> responsive). Ce document **définit le modèle de données** (fait, ci-dessous) et
> **propose les emplacements et comportements** (à valider). **Aucun rendu d'image n'est
> implémenté côté web** tant que ces règles ne sont pas validées — c'est précisément ce
> qui empêche l'ajout arbitraire d'images par les développeurs.

---

## 1. Principe directeur : l'image est un supplément, jamais une béquille

1. **Aucune illustration n'est obligatoire.** Un dossier est **visuellement complet sans
   aucune image**. La maquette figée du handoff est intégralement typographique et tient
   sans illustration ; c'est l'état de référence, pas un état dégradé.
2. **Zéro placeholder côté lecteur.** En l'absence d'image, on **supprime le bloc** — pas
   de cadre gris, pas de « image à venir », pas d'espace réservé. Le lecteur ne voit
   jamais l'absence.
3. **Cartes et listes fonctionnent avec ET sans image, à l'identique dans leur structure.**
   Une image, quand elle existe, s'ajoute à une carte déjà complète ; elle ne réorganise
   pas la carte et n'en devient pas la condition de lisibilité.
4. **L'image ne porte jamais le verdict ni la fiabilité.** Cohérent avec la règle produit :
   les verdicts s'expriment par le mot et la typographie, jamais par la couleur ou l'image ;
   une illustration n'est pas un signal de vérité.
5. **Pas de langage visuel inventé.** Tant que le handoff ne fixe pas dimensions, filets,
   traitement des légendes et ratios, aucun rendu n'est produit. Ce document liste ce
   qu'il faudra que le handoff (ou son propriétaire) tranche.

---

## 2. Modèle de données (FAIT — neutre, facultatif)

Défini dans `packages/domain/src/dossier.ts` (types purs, sans dépendance) et reflété
dans le Studio (`apps/studio/schemaTypes/illustration.ts`). **Aucun champ n'est requis
au niveau du dossier ;** seul `alt` devient obligatoire *dès qu'une image existe*
(accessibilité).

```ts
export interface PointFocal { x: number; y: number } // normalisé 0–1

export interface Illustration {
  src: string;        // URL de l'image (résolue par l'adapter Sanity/CDN)
  alt: string;        // texte alternatif — REQUIS si image présente
  largeur?: number;
  hauteur?: number;
  focal?: PointFocal; // point focal / cadrage responsive
  legende?: string;
  credit?: string;
  sourceUrl?: string; // URL de la source
  droits?: string;    // information de droits / licence
}
```

Les sept informations demandées sont couvertes : **image** (`src`), **texte alternatif**
(`alt`), **légende** (`legende`), **crédit** (`credit`), **URL de source** (`sourceUrl`),
**information de droits** (`droits`), **point focal/cadrage** (`focal`, + `hotspot` Sanity).

### 2.1 Les trois usages distincts (FAIT)

Sur `DossierChamps`, trois champs facultatifs, un par usage :

| Usage | Champ domaine | Cardinalité | Rôle |
|---|---|---|---|
| 1. Illustration **principale** du dossier | `illustration?: Illustration` | 0..1 | Visuel d'ouverture / vignette du dossier |
| 2. Illustration **intégrée au contenu** | `illustrationsContenu?: Illustration[]` | 0..n | Images au fil du corps (documents, graphiques, photos) |
| 3. Visuel de **partage social** | `partageSocial?: Illustration` | 0..1 | Open Graph / réseaux — hors page lecteur |

Côté Studio, ces trois champs vivent dans le groupe **« Affichage & carte »**, tous
marqués facultatifs, avec la note « un dossier est complet sans image ».

---

## 3. Emplacements autorisés et comportements responsive (PROPOSÉ — à valider)

> Ces emplacements sont les **seuls** où une image pourra apparaître. Toute autre position
> est interdite par défaut. Les valeurs exactes (ratios, largeurs, filets, tailles de
> légende) sont **à extraire/valider auprès du propriétaire du handoff** — les crochets
> `⟦…⟧` marquent une valeur non figée.

### 3.1 Illustration principale — page dossier

- **Emplacement :** un seul, sous le titre/chapô, avant le premier bloc de contenu. Jamais
  au-dessus du titre (le titre-question reste l'entrée du dossier).
- **Absente :** le bloc n'existe pas ; le contenu remonte sans espace résiduel.
- **Responsive :** pleine largeur de la colonne de lecture ; recadrage piloté par `focal`
  (jamais de déformation). Ratio ⟦à figer — proposé : laisser le ratio natif, borné par une
  hauteur max mobile⟧.
- **Légende/crédit :** si `legende` ou `credit`, rendus **sous** l'image en `--color-encre-secondaire`,
  taille métadonnée, **sans filet décoratif** (respect « pas d'ombre/pas de radius » ; un
  filet fin `--rule-fine` seulement si le handoff le prévoit).
- **Bords :** **zéro border-radius**, **aucune ombre** (règle absolue du design system).

### 3.2 Illustration principale — carte / liste (homepage, index)

- **Emplacement :** vignette optionnelle dans la carte de dossier.
- **Règle de parité :** la carte est **conçue d'abord sans image** et reste complète ainsi.
  Avec image, la vignette s'insère dans un emplacement prévu **sans** changer l'ordre de
  lecture (numéro → titre → collecte/verdict). Cartes avec et sans image **cohabitent dans
  la même liste** sans créer de « trous ».
- **Absente :** aucun cadre, aucun aplat — la carte s'affiche exactement comme aujourd'hui.
- **Responsive :** format vignette borné ⟦ratio/format à figer⟧ ; recadrage par `focal`.

### 3.3 Illustrations intégrées au contenu — page dossier

- **Emplacement :** au fil du corps, à des points d'insertion explicites (jamais posées
  « au hasard » par le développeur ; l'ordre vient de l'éditeur).
- **Légende/crédit :** même traitement que 3.1.
- **Responsive :** pleine largeur de colonne ; `focal` pour le recadrage ; pas de galerie
  ni de lightbox tant que le handoff n'en définit pas le comportement.

### 3.4 Visuel de partage social

- **Non affiché dans la page lecteur.** Alimente uniquement les métadonnées Open
  Graph/Twitter.
- **Absent :** repli sur une **image de marque par défaut** (à fournir), jamais d'OG vide.
- **Dimensions :** format social standard ⟦à confirmer — 1200×630 usuel⟧.

---

## 4. Accessibilité (non négociable)

- `alt` **obligatoire** dès qu'une image est posée (validation Studio + convention domaine).
- L'image ne doit jamais être le **seul** porteur d'une information : légende et crédit sont
  du texte, le verdict/l'état restent typographiques.
- Contraste et lisibilité priment sur la fidélité : une image ne passe jamais sous du texte
  au point de nuire à la lecture.

---

## 5. Garde-fous (pourquoi aucun rendu web n'est livré ici)

- Le handoff figé **n'a pas de traitement d'image**. Rendre des images maintenant
  reviendrait à **inventer un langage visuel** — explicitement interdit.
- Sans emplacements validés, chaque développeur placerait les images différemment : c'est
  exactement ce que la demande veut **empêcher**.
- Le modèle de données est donc livré (les éditeurs peuvent renseigner les champs dans
  Sanity), mais le **rendu** attend la validation des §3. Cette séparation garantit le
  build **byte-identique** ci-dessous.

---

## 6. Vérifications

| Contrôle | Résultat |
|---|---|
| `sanity schema validate` (studio) | ✅ 0 erreur / 0 warning |
| `tsc --noEmit` (apps/studio) | ✅ 0 erreur |
| Build web vs baseline A2 | ✅ **byte-identique** (`diff -rq` : aucune différence) |
| Domaine | `Illustration`/`PointFocal` ajoutés ; 3 champs facultatifs ; aucune dépendance framework |
| Rendu lecteur | inchangé — aucune image rendue tant que §3 n'est pas validé |

---

## 7. À trancher par le propriétaire du handoff avant tout rendu

1. Ratios/formats de chaque emplacement (principale page, vignette carte, contenu, OG).
2. Traitement des légendes/crédits (filet fin ou non, taille exacte, gouttière).
3. Emplacement précis de la vignette dans la carte (et son comportement mobile).
4. Image de marque par défaut pour le partage social.
5. Bornes de hauteur mobile pour éviter qu'une image pousse le contenu hors écran.

**Tant que ces points ne sont pas figés, le web ne rend aucune illustration.**
