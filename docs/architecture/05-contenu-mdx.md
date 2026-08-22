# SeneSource — Modèle de contenu MDX / frontmatter (V1 statique)

> Remplace le schéma base de données comme modèle opérationnel de la V1.
> Le document `02-modele-de-donnees.md` est conservé comme **référence future** pour la
> phase base de données/CMS (différée) : les concepts validés (verdict ≠ statut,
> pièces = journal de collecte jamais un score, mises à jour publiques datées) sont
> repris ici à l'identique, en fichiers.

## 1. Principes

1. **Le contenu vit dans le dépôt Git** : `src/content/`. Publier = committer. L'historique
   Git est l'audit trail technique ; les mises à jour **publiques** restent des objets
   éditoriaux datés dans le frontmatter (`updates:`), comme validé.
2. **Astro Content Collections + Zod** : chaque collection a un schéma Zod dans
   `src/content.config.ts`. Un frontmatter invalide **casse le build** — c'est le
   remplaçant statique des contraintes Postgres.
3. **Le dossier est l'objet éditorial principal, multi-type.** Un dossier n'est pas
   forcément un fact-check : `type: verification | impact | document | explication`.
   `affirmation` et `verdict` sont optionnels ; le schéma n'oblige jamais un contenu à
   devenir une vérification.
4. **Identité = numéro.** Le nom de fichier porte l'URL : `041-taxe-paiements-especes-carburant.mdx`
   → `/dossier/041-taxe-paiements-especes-carburant`. Le numéro est immuable ; si un slug
   publié doit changer, l'ancienne URL est conservée dans `ancienSlugs:` et génère une
   redirection 301 dans `_redirects` (Cloudflare Pages) au build.
5. **Taxonomies éditables sans code** : verdicts et thèmes sont des collections de
   données YAML — modifier un libellé ou ajouter un verdict = éditer un fichier, pas le
   code des composants. (Équivalent fichier de la table `verdict_labels` validée.)

## 2. Collections

```
src/content/
├─ dossiers/            # collection MDX principale
│  └─ 041-taxe-paiements-especes-carburant.mdx
├─ documents/           # fiches des documents-sources (mutualisés entre dossiers)
│  └─ loi-finances-rectificative-2025.mdx
└─ taxonomies/
   ├─ verdicts.yaml     # code, libellé, définition publique, actif
   └─ themes.yaml       # code, libellé, slug
```

Les fichiers PDF eux-mêmes vont dans `public/documents/` (V0.1 : aucun binaire requis).

## 3. Schéma `dossiers` (frontmatter)

```yaml
---
numero: 41                      # entier, unique, immuable — identité de l'URL
titre: "Une taxe de 1 % sur les paiements en espèces de carburant ?"
type: verification              # verification | impact | document | explication
statut: publie                  # en_instruction | publie | archive
                                # (brouillon = draft: true d'Astro, exclu du build prod)
theme: energie                  # code de themes.yaml
auteur: "Rédaction SeneSource"
chapo: "Ce que dit réellement la loi de finances rectificative 2025."
publieLe: 2026-08-10
misAJourLe: 2026-08-20          # optionnel

affirmation:                    # optionnel — présent en général si type: verification
  texte: "L'État prélèvera 1 % sur tout achat de carburant payé en espèces."
  auteur: "Message viral WhatsApp"
  source: "https://…"           # optionnel
  date: 2026-08-05              # optionnel

verdict:                        # optionnel — null/absent = pas (encore) de verdict
  code: exact_en_partie         # doit exister et être actif dans verdicts.yaml
  resume: "La taxe existe mais ne s'applique qu'aux transactions de plus de 100 000 F."
  renduLe: 2026-08-12

pieces:                         # journal de collecte — JAMAIS agrégé en score
  - titre: "Loi de finances rectificative 2025"
    statut: obtenue             # identifiee | demandee | obtenue | sans_reponse
                                # | refusee | introuvable | non_probante
    document: loi-finances-rectificative-2025   # slug de la collection documents
    obtenueLe: 2026-08-08
    note: "Version publiée au Journal officiel."
  - titre: "Circulaire d'application DGID"
    statut: sans_reponse
    demandeeA: "Direction générale des impôts et des domaines"
    demandeeLe: 2026-08-09
    note: "Relance effectuée le 15/08."

impacts:                        # chaque chiffre porte obligatoirement méthode + hypothèses
  - titre: "Coût annuel pour un automobiliste moyen"
    valeur: 78000
    unite: "F CFA/an"
    methode: "Application du taux de 1 % à une dépense hebdomadaire type."
    hypotheses: "30 000 F de carburant/semaine × 52 semaines × 1 %"
    source: "Prix moyens ANSD, juillet 2026"   # optionnel selon le cas

updates:                        # mises à jour éditoriales publiques, datées
  - date: 2026-08-20
    kind: mise_a_jour           # mise_a_jour | correction | changement_verdict
    note: "La DGID a transmis la circulaire d'application ; le seuil de 100 000 F est confirmé."

ancienSlugs: []                 # redirections 301 générées au build si non vide
---

Corps du dossier en MDX : contexte, analyse, citations, renvois aux pièces.
```

### Règles Zod (extraits déterminants)

| Règle | Effet |
|---|---|
| `verdict` présent ⇒ `verdict.renduLe` présent | pas de verdict non daté |
| `verdict` présent ⇒ `affirmation` présente | un verdict juge une affirmation ; les types `impact`/`document`/`explication` sans affirmation ne peuvent pas porter de verdict |
| `verdict.code` ∈ verdicts.yaml actifs (`reference()`) | taxonomie évolutive, référence vérifiée au build |
| `piece.statut === 'obtenue'` ⇒ `document` ou `note` présent | une pièce « obtenue » doit être montrable ou expliquée |
| `impact` ⇒ `methode` ET `hypotheses` non vides | aucun chiffre sans ses hypothèses — contrainte de build, pas une convention |
| `statut: publie` ⇒ `publieLe` présent | |
| `numero` unique (vérif. build custom) + zéro écart nom de fichier/numéro | URLs stables |
| `pieces` : **aucun champ ordinal ni booléen agrégeable** | la dérive « score de vérité » est impossible à représenter |

Le statut `en_instruction` est **public** (dossier ouvert, journal de collecte visible,
pas de verdict) — décision validée. `draft: true` reste le seul état invisible.

## 4. Schéma `documents` (frontmatter)

```yaml
---
titre: "Loi de finances rectificative 2025"
emetteur: "Ministère des Finances et du Budget"
dateDocument: 2026-07-28
typeDocument: loi               # loi | decret | arrete | circulaire | rapport | courrier | autre
pages: 87
fichier: /documents/lfr-2025.pdf   # optionnel — absent = document non publiable/non obtenu
sourceUrl: "https://jo.gouv.sn/…"  # optionnel
extraits:
  - page: 12
    citation: "Il est institué un prélèvement de 1 % sur…"
    note: "Le seuil de 100 000 F apparaît à l'alinéa 3."
---

Ce que ce document prouve — et ce qu'il ne prouve pas (corps MDX).
```

Les dossiers utilisant un document sont **calculés au build** (inversion des références
`pieces[].document`) — pas de liste à maintenir à la main dans les deux sens.

## 5. Taxonomies

```yaml
# src/content/taxonomies/verdicts.yaml — un fichier par entrée ou tableau unique
- code: confirme
  libelle: "Confirmé"
  definition: "L'affirmation est établie par les pièces réunies."
  actif: true
- code: faux
  libelle: "Faux"
  definition: "…"
  actif: true
- code: trompeur
  libelle: "Trompeur"
  definition: "…"
  actif: true
- code: exact_en_partie
  libelle: "Exact en partie"
  definition: "…"
  actif: true
- code: non_verifiable
  libelle: "Non vérifiable"
  definition: "…"
  actif: true
```

La page `/methode` affiche ces définitions ; le mapping ClaimReview
(`code → ratingValue/alternateName`) vit dans `src/lib/seo.ts` et reste un contrat figé.

## 6. Flux de publication (sans CMS)

1. Créer `src/content/dossiers/NNN-slug.mdx` (gabarit copiable fourni dans le repo).
2. `git push` → build Cloudflare Pages (~2–3 min) → en ligne.
3. Mise à jour/correction = éditer le fichier + ajouter une entrée `updates:` + push.
4. Urgence : un dossier minimal valide = `numero, titre, type, statut: en_instruction, theme, auteur, publieLe` + un chapo. Tout le reste s'ajoute ensuite.

Limites assumées (déclencheurs du futur CMS, cf. corrections du brief) : brouillons
collaboratifs, plusieurs rédacteurs non-Git, publication sans Git, workflows de relecture,
gestion documentaire avancée.

## 7. Chemin de migration ultérieur

- Les pages consomment les collections via une mince couche `src/lib/contenu.ts`
  (`getDossier`, `listDossiers`, …) — pas d'appel direct aux collections dans les gabarits.
- L'Astro Content Layer accepte des **loaders** externes : brancher plus tard un CMS ou une
  base revient à remplacer le loader, pas les schémas Zod ni les composants.
- Le frontmatter ci-dessus est volontairement isomorphe au schéma relationnel de
  `02-modele-de-donnees.md` : si une base devient nécessaire, la migration est un script
  d'import, pas une refonte.
