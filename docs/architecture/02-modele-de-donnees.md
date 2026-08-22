# SeneSource — Modèle de données (Agent B, Data Architect)

> **⚠️ STATUT RÉVISÉ (2026-08-22, corrections du propriétaire)** : la V1 est désormais
> **statique (Astro + MDX), sans base de données ni Supabase**. Ce document est conservé
> comme **référence pour la phase base/CMS différée**, qui ne démarrera que sur besoin
> réel avéré. Le modèle opérationnel V1 est `05-contenu-mdx.md`, qui en reprend les
> principes validés (verdict ≠ statut, pièces = journal jamais un score, mises à jour
> publiques datées, taxonomie de verdicts éditable). **Amendement important** : la règle
> « un dossier = une affirmation principale » (§1) n'est PAS validée comme modèle
> général — le dossier est multi-type (`verification | impact | document | explication`)
> et l'affirmation/le verdict sont optionnels. Toute future base devra refléter cela.

> Phase d'analyse pré-V0. Aucune migration n'a été appliquée. Ce document challenge le
> schéma proposé dans le brief et recommande un modèle pour une future phase base de
> données.

**Cible : Supabase/PostgreSQL · petite rédaction · publication rapide · pas de sur-ingénierie.**

---

## 1. Critique du schéma proposé

### Ce qui est en trop ou mal placé

**`claims` en table séparée (1-N)** — sur-modélisation pour la V1. Dans la pratique du fact-checking documentaire, un dossier = une affirmation principale vérifiée. Le verdict « exact en partie » existe précisément pour éviter d'avoir à rendre un verdict par sous-affirmation. Une table `claims` 1-N invite à des dossiers multi-affirmations avec verdicts partiels — enfer éditorial et enfer d'URL. → **Intégrer l'affirmation dans `dossiers`** (colonnes `claim_text`, `claim_source_url`, `claim_author`, `claim_date`). Si un jour un dossier doit décomposer, on scinde en plusieurs dossiers liés (relation `related_dossiers`), ce qui est éditorialement plus sain.

**`verdicts` en table séparée (1-1)** — c'est une relation 1-1 déguisée : une table de plus, une jointure de plus, et un risque de dossier avec 0 ou 2 verdicts. L'historique des verdicts (cas de correction) est mieux porté par les **mises à jour éditoriales visibles** (voir §3) que par des lignes multiples dans `verdicts`. → **Colonnes sur `dossiers`** : `verdict_code` (FK nullable), `verdict_summary`, `verdict_rendered_at`. NULL = pas encore de verdict = « publié sans verdict » ou « en instruction ».

**Piège majeur : « en instruction » dans la taxonomie des verdicts.** C'est un état du *dossier*, pas un jugement sur les faits. Le garder comme verdict crée une confusion permanente (un dossier « publié » avec verdict « en instruction » ?). → Le retirer de la taxonomie ; l'absence de verdict (`verdict_code IS NULL`) + le statut du dossier disent la même chose sans ambiguïté.

**`evidence.supports` (booléen)** — c'est exactement la porte d'entrée de la dérive « 4 pièces sur 6 = fiable à 66 % ». Un booléen agrégeable sera agrégé, par un dev de bonne foi ou un composant UI. → **Supprimer en V1.** Le rôle probatoire d'une pièce s'explique en prose dans `evidence.description` et dans le texte du verdict. Si un champ structuré devient nécessaire, ce sera un enum non ordonné (`a_charge | a_decharge | contexte`) avec interdiction explicite d'agrégation — mais pas maintenant.

**`document_excerpts.dossier_id`** — redondant et dangereux : l'extrait est déjà rattaché au dossier via `evidence` → `documents`. Deux chemins de rattachement finiront par diverger. → Rattacher l'extrait à **`evidence`** (la pièce telle qu'utilisée dans CE dossier), pas au couple document+dossier.

**`dossier_versions`** — trop lourd en V1 (voir §3, où je recommande autre chose).

### Ce qui manque

1. **La distinction pièce demandée / document obtenu est bonne mais incomplète** : il manque *à qui* la pièce a été demandée, *quand*, et la trace de la réponse institutionnelle (ou du silence). C'est le cœur de la méthode SeneSource — « demandé le 12/03 à la DGID, sans réponse au 22/08 » est une information publiable. → colonnes `requested_from`, `requested_at`, `response_note`, `status_changed_at` sur `evidence`.
2. **Les mises à jour et corrections comme objets éditoriaux publics** (« Correction du 15/08 : … »). Rien dans le schéma ne les représente ; `dossier_versions` est un historique technique, pas un encadré lisible.
3. **La source de la Conséquence** : `impacts` a méthode et hypothèses mais pas de rattachement aux pièces/sources qui fondent le calcul.
4. **Table de référence des verdicts** (le brief demande une taxonomie évolutive — voir §2).
5. **Catégories** : `category` en texte libre sur `dossiers` = fautes de frappe et pas de page publique par catégorie. → petite table `topics` avec slug.
6. **Lien lecteur → dossier** : `submissions` ne peut pas dire « cette demande a donné le Dossier 041 ».
7. **`profiles`/rôles** : `author_id` pointe vers quoi ? Il faut le pont vers `auth.users` de Supabase.
8. **Contrainte d'unicité et de stabilité sur `number` et `slug`** — implicite dans le brief, absente du schéma.

### Ce qui est bien et à garder

La séparation **`evidence` (la pièce dans le contexte d'un dossier, avec son état de collecte) / `documents` (le fichier-source, réutilisable entre dossiers)** est le meilleur choix du schéma proposé : un même rapport de la Cour des comptes servira dans dix dossiers. `submissions` et `impacts` sont bien découpés.

---

## 2. Schéma recommandé

Conventions : `id uuid PK default gen_random_uuid()`, `created_at timestamptz default now()` partout (non répétés ci-dessous). **[V1]** = indispensable au lancement · **[V2]** = différable, le modèle l'accueille sans refonte.

### `verdict_labels` — [V1] (table de référence)

| Colonne | Type | Note |
|---|---|---|
| `code` | `text` **PK** | ex. `faux`, `trompeur`, `confirme`, `exact_en_partie`, `non_verifiable` |
| `label` | `text NOT NULL` | libellé affiché |
| `description` | `text` | définition publique (page « méthode ») |
| `sort_order` | `smallint` | |
| `is_active` | `boolean default true` | retrait sans suppression |

**Table de référence plutôt qu'enum, sans hésitation.** Un enum PostgreSQL exige une migration pour tout changement, ne permet ni désactivation ni renommage propre, et ne porte aucune métadonnée (définition publique, ordre). La taxonomie d'un média de fact-checking est un objet *éditorial* qui évoluera (le brief le dit) : elle doit être modifiable par un UPDATE, pas par un déploiement. Le coût (une FK) est nul. `is_active = false` retire un verdict des choix futurs sans casser les dossiers anciens — un enum ne sait pas faire ça.

### `topics` — [V1]

`code text PK` · `label text NOT NULL` · `slug text UNIQUE NOT NULL` · `sort_order smallint` · `is_active boolean default true`

### `profiles` — [V1]

`id uuid PK REFERENCES auth.users(id)` · `display_name text NOT NULL` · `role text NOT NULL CHECK (role IN ('admin','editor','contributor'))` · `is_active boolean default true`

### `dossiers` — [V1] (table centrale, volontairement large)

| Colonne | Type | Note |
|---|---|---|
| `id` | `uuid PK` | jamais exposé publiquement |
| `number` | `integer UNIQUE NOT NULL` | via séquence dédiée ; **immuable** |
| `slug` | `text UNIQUE NOT NULL` | **immuable après publication** (trigger) |
| `title` | `text NOT NULL` | |
| `summary` | `text` | chapô |
| `body` | `text` | corps (markdown) — V1 simple, un seul champ |
| `claim_text` | `text` | l'affirmation vérifiée |
| `claim_author` | `text` | qui l'a dite (texte libre en V1) |
| `claim_source_url` | `text` · `claim_date date` | |
| `status` | `text NOT NULL default 'brouillon'` | CHECK — voir §4 |
| `topic_code` | `text REFERENCES topics` | |
| `verdict_code` | `text REFERENCES verdict_labels` | **nullable** = pas encore de verdict |
| `verdict_summary` | `text` · `verdict_rendered_at timestamptz` | l'argumentaire long vit dans `body` |
| `author_id` | `uuid REFERENCES profiles NOT NULL` | |
| `first_published_at` | `timestamptz` · `updated_at timestamptz` | `first_published_at` immuable une fois posé |

Contraintes : `CHECK (status <> 'publie' OR first_published_at IS NOT NULL)` ; `CHECK (verdict_code IS NULL OR verdict_rendered_at IS NOT NULL)`.
**URL publique : `/dossiers/041-le-slug`** — le numéro est la clé canonique de résolution ; si le slug change avant publication, l'URL par numéro reste résoluble. Aucun uuid en URL.

### `documents` — [V1] (le fichier-source, mutualisé)

`id uuid PK` · `title text NOT NULL` · `issuing_body text` · `doc_date date` · `file_path text` (Storage) · `original_url text` · `file_type text` · `page_count int` · `checksum text UNIQUE` (dédoublonnage) · `is_public boolean default true` (pièces sensibles non publiables) · `notes text`

### `evidence` — [V1] (la pièce dans un dossier : état de collecte + demande institutionnelle fusionnées)

| Colonne | Type | Note |
|---|---|---|
| `id` | `uuid PK` · `dossier_id uuid REFERENCES dossiers NOT NULL` | |
| `document_id` | `uuid REFERENCES documents` | **nullable tant que non obtenue** |
| `title` | `text NOT NULL` | « Arrêté de nomination de… » |
| `status` | `text NOT NULL` | CHECK : `identifiee \| demandee \| obtenue \| sans_reponse \| refusee \| introuvable \| non_probante` |
| `requested_from` | `text` · `requested_at date` | à qui / quand demandée |
| `response_note` | `text` | réponse institutionnelle, y c. refus motivé |
| `description` | `text` | rôle de la pièce, **en prose** |
| `obtained_at` | `date` · `status_changed_at timestamptz` | |

Contrainte : `CHECK (status <> 'obtenue' OR document_id IS NOT NULL)`. **Pas de champ agrégeable en score.** L'UI publique peut lister « obtenue / demandée le X / refusée » — c'est un *journal de collecte*, jamais un pourcentage : ne jamais exposer `count(obtenues)/count(*)`.

### `document_excerpts` — [V1, minimal]

`id uuid PK` · `evidence_id uuid REFERENCES evidence NOT NULL` · `page int` · `excerpt text NOT NULL` · `annotation text` · `sort_order smallint`
(La citation est le geste de base du fact-checking documentaire → V1, mais rattachée à `evidence`, pas au couple document+dossier.)

### `impacts` — [V1] (la Conséquence)

`id uuid PK` · `dossier_id uuid REFERENCES dossiers NOT NULL` · `title text NOT NULL` · `value numeric` · `unit text` · `description text` · `methodology text NOT NULL` · `assumptions text NOT NULL` · `source_note text NOT NULL` (d'où viennent les chiffres, avec renvoi aux pièces) · `sort_order smallint`
Hypothèses de calcul = texte structuré dans `assumptions` ; pas de table `hypotheses` séparée (règle « pas de table si une colonne suffit »).

### `dossier_updates` — [V1] — voir §3

`id uuid PK` · `dossier_id uuid REFERENCES dossiers NOT NULL` · `kind text NOT NULL CHECK (kind IN ('mise_a_jour','correction','changement_verdict'))` · `note text NOT NULL` (texte public) · `previous_verdict_code text REFERENCES verdict_labels` · `published_at timestamptz NOT NULL default now()` · `author_id uuid REFERENCES profiles`

### `submissions` — [V1] (demandes des lecteurs)

`id uuid PK` · `text text NOT NULL` · `url text` · `contact text` (sensible — voir §5) · `status text NOT NULL default 'nouvelle'` CHECK (`nouvelle | examinee | retenue | ecartee`) · `dossier_id uuid REFERENCES dossiers` (nullable : posé quand la demande devient un dossier) · `internal_note text`

### Différé en V2 (le modèle est prêt, ne pas construire maintenant)

- **`entities` + `dossier_entities`** (personnes/organisations normalisées, rôles `auteur_affirmation | vise | source`). En V1, les champs texte `claim_author`, `issuing_body`, `requested_from` suffisent ; on normalisera quand le besoin de pages « toutes les vérifications concernant X » sera réel.
- **`dossier_links`** (dossiers liés) — en attendant, liens dans le corps.
- **`slug_redirects`** — inutile tant que le slug est immuable après publication.
- **tags multiples** (`dossier_topics` N-N) — un seul `topic_code` en V1.
- **`dossier_revisions`** (snapshots internes) — voir §3.

Bilan : **10 tables V1** (dont 3 petites tables de référence), toutes explicables en une phrase à un journaliste.

---

## 3. Versionnage / historique — recommandation : les mises à jour comme objets éditoriaux

Trois options examinées :

1. **`dossier_versions` (snapshot complet à chaque save)** — lourd, illisible pour la rédaction, et ne produit rien de publiable : personne ne montrera un diff de markdown aux lecteurs. Coût réel, valeur faible en V1.
2. **Event log (audit trail générique)** — sur-ingénierie caractérisée pour 3 personnes ; c'est de l'infrastructure de conformité, pas de l'éditorial.
3. **`dossier_updates` : chaque évolution publique est une entité éditoriale visible** — un encadré daté « Mise à jour du 15/08 : la DGID a transmis le document » ou « Correction : le verdict passe de X à Y ». ✅ **Recommandée.**

Pourquoi : c'est la seule option qui sert directement le produit (transparence = crédibilité d'un média de fact-checking), elle est triviale à afficher, elle capture le *sens* du changement (ce qu'aucun diff ne fait), et elle porte l'historique des verdicts via `previous_verdict_code`. Règle éditoriale associée : après première publication, tout changement substantiel du corps, du verdict ou d'un impact **doit** s'accompagner d'une ligne `dossier_updates` — règle de rédaction en V1 (checklist), trigger de garde en V2 si l'indiscipline s'installe.

Filet de sécurité optionnel et quasi gratuit : un trigger `BEFORE UPDATE` sur `dossiers` copiant `OLD` en jsonb dans une table interne `dossier_revisions` (jamais affichée, purgeable). Une dizaine de lignes de SQL, zéro impact applicatif. À poser si l'équipe veut un « ctrl-Z », sinon différer.

---

## 4. Statuts et workflow — machine à états minimale

Quatre statuts sur `dossiers.status` :

```
brouillon ──▶ en_instruction ──▶ publie ──▶ archive
    │               ▲   │            ▲  (archive ▶ publie : réactivation)
    └───────────────┘   └────────────┘
```

- **`brouillon`** — interne, invisible du public.
- **`en_instruction`** — **public** : le dossier est ouvert, l'affirmation et le journal de collecte sont visibles, pas de verdict. C'est la vitrine de la méthode SeneSource (« publié sans verdict »).
- **`publie`** — enquête aboutie ; verdict présent *ou non* (`verdict_code` nullable : on peut clore sur « non vérifiable » ou publier une enquête sans verdict formel).
- **`archive`** — retiré de la mise en avant, reste lisible dans le Registre (un média de vérification ne dépublie pas silencieusement).

**« Corrigé » et « mis à jour » ne sont pas des statuts** : ce sont des faits dérivés de `dossier_updates` (badge « corrigé le… » calculé par `EXISTS`). Les mettre dans la machine à états doublerait les états (publié-corrigé, publié-mis-à-jour, corrigé-puis-mis-à-jour…) pour rien. Transitions gardées par l'application (et un trigger simple qui interdit `publie → brouillon` et le changement de `number`/`slug`/`first_published_at` après publication).

---

## 5. RLS / auth Supabase — minimal

Principe : **deux mondes**. Lecture publique (`anon`) du contenu des dossiers publics ; écriture réservée à la rédaction (`authenticated` + rôle via `profiles`).

- **Helper** : `fn is_staff() → EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor') AND is_active)` (SECURITY DEFINER).
- **`dossiers`** : SELECT anon si `status IN ('en_instruction','publie','archive')` ; ALL si `is_staff()`.
- **Tables filles** (`evidence`, `document_excerpts`, `impacts`, `dossier_updates`) : SELECT anon via `EXISTS (SELECT 1 FROM dossiers d WHERE d.id = dossier_id AND d.status IN (...))` ; ALL si `is_staff()`. Volumétrie faible → le sous-select par ligne est sans enjeu de performance.
- **`documents`** : SELECT anon si `is_public` **et** rattaché à au moins un dossier public ; les fichiers eux-mêmes dans deux buckets Storage : `documents-publics` (lecture publique) et `documents-internes` (staff uniquement, URLs signées). Ne jamais mettre une pièce sensible dans le bucket public « en attendant ».
- **`verdict_labels`, `topics`** : SELECT public ; écriture `admin`.
- **`submissions`** : INSERT `anon` autorisé (formulaire), **aucun SELECT public** ; SELECT/UPDATE staff. Le champ `contact` peut identifier une source : c'est la table la plus sensible de la base — accès staff strict, politique de purge à définir (risque #6).
- **`profiles`** : SELECT public limité (byline) via une vue `public_authors(display_name)` ; la table complète staff-only.
- Jamais de clé `service_role` côté client ; RLS activée sur **toutes** les tables sans exception, y compris les tables de référence.

---

## 6. Risques et questions ouvertes

1. **Dérive « score de fiabilité »** : le risque n'est pas dans le schéma (assaini) mais dans l'UI — toute jauge/pourcentage sur les pièces recréera la dérive. À inscrire comme règle produit, pas seulement donnée.
2. **Un dossier = une affirmation** : hypothèse structurante de ma simplification. Si la rédaction veut des dossiers multi-affirmations avec verdicts distincts, il faudra réintroduire `claims` — à trancher avant le lancement, pas après.
3. **Taxonomie des verdicts : gouvernance** — qui a le droit d'ajouter/désactiver un verdict, et un changement de définition s'applique-t-il aux dossiers passés ? (Techniquement prêt, éditorialement non défini.)
4. **Exposition légale des documents** : publier une pièce obtenue officieusement (diffamation, secret, protection des sources — droit sénégalais). `documents.is_public` est le garde-fou technique ; la doctrine juridique reste à écrire.
5. **`submissions.contact`** : données personnelles de sources potentielles dans une base SaaS hébergée hors du Sénégal. Minimiser (champ optionnel), purger, ou ne pas collecter du tout ?
6. **Slug immuable** : contrainte forte assumée pour la stabilité des URLs. Si un titre publié doit vraiment changer d'adresse, il faudra `slug_redirects` (V2) — accepté ?
7. **« En instruction » public** : publier l'existence d'une enquête en cours peut alerter les mis en cause et faire disparaître des documents. La machine à états le permet ; faut-il un passage direct `brouillon → publie` comme circuit normal pour les sujets sensibles ? (Déjà possible — à documenter comme pratique.)
8. **Discipline `dossier_updates`** : le versionnage repose sur une règle de rédaction, pas sur une contrainte technique. Acceptable à 3 personnes ; à durcir (trigger) si l'équipe grandit.
9. **Registre = simple listing filtré de `dossiers`** en V1 (aucune table dédiée). Si le Registre doit un jour offrir des vues par personne/organisation, la V2 `entities` devient le prérequis — c'est le premier candidat V2 à surveiller.
10. **Stockage/volumétrie** : PDF volumineux et checksum de dédoublonnage supposent un pipeline d'upload discipliné (calcul du checksum à l'ingestion). Qui le fait — Edge Function ou procédure manuelle documentée ?

---

**Résumé exécutif** : dossier-centrique et dénormalisé là où c'est sain (affirmation et verdict portés par `dossiers`), normalisé là où ça paie (`documents` mutualisés, `verdict_labels` évolutifs), un journal de collecte (`evidence`) qui raconte la méthode sans jamais la chiffrer, et des mises à jour publiques comme colonne vertébrale de l'historique. 10 tables, 4 statuts, RLS en deux mondes — une rédaction de trois personnes peut tenir ce modèle entier dans sa tête.
