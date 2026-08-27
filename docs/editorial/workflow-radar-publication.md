# Boucle éditoriale SeneSource — Radar → Validation → Publication

## Objectif

Faire de ChatGPT le sas éditorial principal de SeneSource afin de réduire au minimum les tâches manuelles de publication.

La boucle cible est :

Radar → vérification → angle → chiffrage → article → déclinaisons sociales → validation humaine → publication → suivi du dossier.

## 1. Radar

Le Radar surveille l’actualité sénégalaise et les sources primaires/officielles. Il ne retient que les sujets à forte valeur éditoriale : argent, coût de la vie, décisions publiques, déclarations vérifiables, rapports, audits, droits des citoyens, fraudes documentées, promesses et responsabilités publiques.

Chaque sujet retenu doit comporter : faits établis, allégations, éléments en attente, parole publique à vérifier, conséquence concrète pour la population, calcul chiffré lorsque possible, sources primaires, chronologie et prochaine échéance.

## 2. Préparation éditoriale

Quand un sujet est retenu, ChatGPT prépare automatiquement :

- angle SeneSource ;
- titre éditorial ;
- titre SEO ;
- slug ;
- méta-description ;
- catégorie ;
- chapô ;
- corps d’article ;
- intertitres ;
- sources ;
- mots-clés utiles ;
- date de publication et date de mise à jour ;
- image principale, légende, crédit et source lorsqu’une image exploitable existe ;
- vidéo primaire pertinente lorsqu’elle existe ;
- sinon proposition de visuel ou prompt de génération ;
- publication X ;
- publication Facebook ;
- publication LinkedIn ;
- publication Instagram lorsque le sujet se prête à un traitement visuel.

## 3. Règle de validation

Aucune publication ne doit être déclenchée automatiquement par le Radar.

Le contenu peut être préparé sans intervention humaine, mais la mise en ligne exige une validation explicite.

Commandes éditoriales de référence :

- `Go article` : produire l’article complet et ses déclinaisons.
- `Publie` : publier uniquement sur SeneSource.
- `Publie partout` : publier sur SeneSource et sur les réseaux connectés prévus pour ce contenu.
- `Mets à jour` : intégrer un nouvel élément dans un article existant sans créer automatiquement un nouvel article.

## 4. Publication SeneSource

Après `Publie`, ChatGPT doit prendre en charge la chaîne technique complète :

1. finaliser l’article ;
2. générer les métadonnées ;
3. créer ou mettre à jour le fichier de contenu ;
4. créer le slug ;
5. ajouter les sources ;
6. ajouter l’image et ses métadonnées si nécessaire ;
7. créer la branche ou le commit requis ;
8. ouvrir ou mettre à jour la PR si le workflow l’exige ;
9. fusionner après validation explicite ;
10. laisser le pipeline de déploiement reconstruire SeneSource.

L’utilisateur ne doit pas avoir à saisir manuellement le slug, la meta-description, les mots-clés, les champs SEO ou les métadonnées techniques.

## 5. Réseaux

Canaux prioritaires :

- X : angle fort, calcul, contradiction, question précise ;
- Facebook : version plus développée, lisible et partageable ;
- LinkedIn : traitement plus institutionnel, économique, administratif ou documentaire ;
- Instagram : traitement visuel lorsque pertinent, avec chiffre, mini-frise, document, citation ou infographie.

Les publications sociales ne doivent pas être de simples copier-coller de l’article. Elles doivent garder le même noyau factuel mais adopter le format du réseau.

## 6. Image et vidéo

Ordre de priorité pour les visuels :

1. source officielle ou institutionnelle exploitable ;
2. document primaire ;
3. image d’actualité pertinente et réutilisable ;
4. visuel éditorial SeneSource ;
5. image générée seulement si aucune meilleure option n’existe.

Pour les vidéos, priorité à la source originale de la déclaration ou de l’événement. Lorsque possible, indiquer le passage pertinent et son horodatage.

### Contrôle visuel permanent avant publication

- Une photographie comportant un sujet humain doit être contrôlée dans les formats réellement rendus par le site : une de la page d’accueil, page article, cartes associées, ordinateur et mobile.
- Le point focal doit conserver le sujet humain visible et compréhensible. Un cadrage qui ne montre plus que le décor, un poteau ou un objet secondaire est refusé, même si l’image source est correcte.
- L’image ne doit jamais être déformée. Le recadrage se règle avec le point focal et doit être revérifié après déploiement.
- Dans les titres, l’espace avant les signes doubles `: ; ! ?` est insécable. Aucun de ces signes ne doit apparaître seul au début d’une ligne.
- Chaque page article propose, à droite sur ordinateur et après le texte sur mobile, une sélection courte d’autres articles publiés. La priorité va aux sujets de la même catégorie, puis aux publications les plus récentes.

## 7. Suivi des dossiers

Un article publié reste lié à son dossier Radar.

Le Radar doit détecter les nouveaux éléments : décision judiciaire, décret, rapport, audit, publication officielle, échéance, réponse d’une institution, changement de chiffres ou nouvelle preuve.

Lorsqu’un nouvel élément apparaît, le système doit privilégier la mise à jour de l’article existant si elle apporte une continuité utile.

Un article mis à jour doit conserver une trace lisible de sa date de publication et de sa date de mise à jour.

## 8. Principe éditorial

SeneSource ne doit pas simplement répéter l’actualité. Chaque publication doit apporter au moins un élément supplémentaire : compréhension, calcul, comparaison, historique, responsabilité, cadre juridique, conséquence concrète, document primaire ou suivi d’une promesse.

Le Radar est un outil interne très structuré. Le lecteur, lui, doit voir un article journalistique fluide, écrit en continu, avec des sources claires et peu d’éléments d’interface inutiles.
