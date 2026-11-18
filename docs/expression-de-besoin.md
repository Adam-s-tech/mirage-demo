# Expression de besoin

## Contexte

Le dépôt `Adam-s-tech/ocr-llm-miniature` est un fork public de la démonstration `joemaddalone/mirage-demo`. L’application
utilise le modèle de vision Mirage de Cactus Compute selon deux modes : une version serveur fondée sur la CLI Cactus,
et une version WebAssembly exécutée dans le navigateur.

La démonstration d’origine est en anglais, sans documentation pédagogique, sans tests de référence et sans métadonnées
de découvrabilité. Elle contient par ailleurs un défaut bloquant dans la colle JavaScript du moteur, qui empêchait tout
chargement en WebAssembly.

## Problème à résoudre

Un utilisateur francophone ne peut pas :

- comprendre ce que fait Mirage sans lire le code ;
- savoir si l’image quitte le poste ;
- reproduire une analyse avec un résultat de référence ;
- distinguer ce qui relève du modèle et ce qui relève de l’interface ;
- projeter un usage professionnel (documents, captures d’écran, PDF, n8n).

## Publics

- développeurs francophones et consultants en automatisation ;
- formateurs numériques et créateurs de tutoriels ;
- utilisateurs de modèles IA locaux ;
- TPE et PME sensibles à la confidentialité des documents ;
- utilisateurs de n8n, Microsoft 365 et Power BI.

## Objectifs de la version 1

1. Proposer une interface entièrement en français, fidèle au fonctionnement d’origine.
2. Démontrer et documenter le traitement local : aucun pixel envoyé à un serveur d’inférence.
3. Fournir trois tests reproductibles avec images et sorties JSON réelles.
4. Rendre le résultat exploitable : copie, téléchargement, métadonnées d’analyse.
5. Rendre le dépôt compréhensible et découvrable : README, description, topics, page publiée, données structurées.
6. Préparer, sans la livrer, l’extension vers les PDF, les factures et n8n.

## Périmètre inclus

- import JPG, PNG, WebP par dépôt ou sélection ;
- analyse locale par WebAssembly ;
- affichage de la scène, des objets, des textes, des relations ;
- boîtes, masques, étiquettes, textes, mise en évidence ;
- filtre de confiance ;
- JSON brut, copie, téléchargement avec métadonnées ;
- messages d’état et d’erreur en français ;
- documentation et tests ;
- métadonnées SEO, page de documentation publiée, sitemap, robots, manifeste ;
- workflow de publication manuel.

## Hors périmètre

- analyse directe de PDF, multi-page ;
- extraction comptable validée ;
- envoi automatique vers Odoo ou SharePoint ;
- webhook n8n ;
- authentification, compte, historique, stockage distant ;
- entraînement ou modification du modèle ;
- application mobile native ;
- traduction automatique de l’interprétation du modèle.

## Contraintes

- ne pas retirer les crédits de Joe Maddalone et de Cactus Compute ;
- ne pas modifier les poids du modèle ;
- ne pas ajouter d’API externe, de suivi utilisateur ni d’envoi d’image ;
- ne pas inclure de secret dans le dépôt ;
- ne pas affirmer qu’une fonctionnalité fonctionne sans l’avoir testée ;
- préserver en priorité le mode WebAssembly ;
- respecter les règles d’accessibilité WCAG 2.2 AA sur les composants principaux.

## Critères d’acceptation

- la version WebAssembly démarre localement et réalise une analyse réelle ;
- l’interface principale est en français ;
- les trois images de référence sont analysables et leurs JSON sont dans le dépôt ;
- le JSON est affiché, copiable, téléchargeable ;
- le filtre de confiance et les couches visuelles fonctionnent ;
- aucune image n’est envoyée à un service distant ;
- les crédits et l’état des licences sont visibles ;
- les fichiers SEO sont présents et valides ;
- le workflow de publication se construit sans secret et sans erreur ;
- aucun secret n’est présent dans le dépôt.

## Risques

| Risque | Impact | Réduction |
|---|---|---|
| Poids du modèle indisponibles | démonstration bloquée | cache local, repli documenté, message explicite |
| Compatibilité navigateur | parcours impossible | messages d’erreur clairs, test Edge, réserve Chrome |
| Dérive de licence | diffusion non autorisée | NOTICE, aucune licence ajoutée sans vérification |
| Images non libres de droits | litige | provenance déclarée, validation par le propriétaire |
| Surpromesse commerciale | perte de crédibilité | limites explicites dans chaque page |

## Livrables

- branche `feat/version-francaise-seo` et pull request non fusionnée ;
- interface française et export JSON ;
- README français et README original archivé ;
- documentation complète dans `docs/` ;
- trois tests et résultats JSON dans `exemples/` ;
- métadonnées SEO et image de prévisualisation ;
- workflow GitHub Pages ;
- notices de crédits et journal des modifications ;
- rapport de tests et liste des limites restantes.
