# Cas d’usage

Mirage WASM n’est pas un OCR comptable certifié. C’est un modèle de vision léger qui produit une lecture structurée
d’une image, utile pour comprendre, démontrer, trier ou préparer un traitement. Les cas ci-dessous précisent ce que
l’outil apporte réellement et les précautions à prendre.

## 1. Formation et démonstration d’IA locale

**Besoin.** Montrer concrètement ce qu’est un modèle de vision local, sans compte cloud ni clé API.

**Apport.** La démonstration fonctionne dans un navigateur, affiche les boîtes, les masques et le JSON, et se prête à
une explication pas à pas du pipeline. Le téléchargement initial du modèle est visible et pédagogique.

**Précaution.** Prévenir que le premier lancement télécharge environ 22 Mo et que l’interprétation textuelle est en
anglais.

## 2. Analyse de captures d’écran

**Besoin.** Retrouver les textes et la structure d’une capture d’écran : tableau de bord, interface, documentation.

**Apport.** Le test Marketing x AI Market Map montre que les catégories et de nombreux libellés sont retrouvés avec
leurs coordonnées. C’est suffisant pour un sommaire approximatif ou une recherche visuelle.

**Précaution.** Les noms propres, les logos serrés et les petites polices sont fragiles. Ne pas utiliser le résultat
comme source de vérité pour un libellé contractuel.

## 3. Supports pédagogiques et schémas

**Besoin.** Vérifier qu’un support contient bien les étapes attendues, ou préparer une indexation d’images de
formation.

**Apport.** Le test Schéma Power BI retrouve les étapes numérotées, les zones de texte, une flèche et une icône. Le
JSON permet de compter et de localiser les éléments.

**Précaution.** Les libellés longs sont découpés en fragments et le cycle métier n’est pas reconstruit. Une relecture
humaine reste nécessaire.

## 4. Préparation d’un flux documentaire

**Besoin.** Alimenter un traitement ultérieur (classement, résumé, routage) à partir d’une image de document.

**Apport.** La sortie JSON est stable et directement exploitable par un script. L’export ajoute des métadonnées utiles
(nom du fichier, dimensions, durée, version).

**Précaution.** Prévoir une étape de normalisation de l’ordre de lecture et une validation humaine avant tout usage
métier. Voir [architecture-cible.md](architecture-cible.md).

## 5. Vérification de confidentialité avant un projet

**Besoin.** Rassurer une équipe sur la possibilité d’analyser des images sans les envoyer à un fournisseur.

**Apport.** L’onglet « Réseau » permet de constater qu’aucune requête ne transporte l’image. Le code est court et
lisible.

**Précaution.** Le moteur et les poids viennent du site qui héberge la page ; héberger soi-même la démonstration pour
maîtriser cette origine.

## 6. Automatisation n8n ou traitement par lot

**Besoin.** Enchaîner analyse d’image, décision et stockage dans un outil métier.

**Apport.** Le JSON structuré est un format d’échange naturel. La version serveur peut être appelée par un script ou un
nœud HTTP.

**Précaution.** Cette version ne fournit ni webhook ni file d’attente. L’intégration n8n est décrite comme évolution,
pas comme fonctionnalité livrée.

## 7. Odoo, SharePoint, GED

**Besoin.** Rattacher une lecture d’image à un document déjà stocké.

**Apport.** Les métadonnées d’export donnent un point d’entrée (nom, dimensions, date, version de l’application).

**Précaution.** Aucun connecteur Odoo ou SharePoint n’est livré. Une extraction de champs critiques (montant, date,
fournisseur) demanderait un travail dédié et une validation comptable.

## Ce que Mirage ne fait pas

- reconnaître un tableau financier avec garantie de montants ;
- reconstituer un PDF multi-page ;
- garantir l’ordre de lecture d’une page dense ;
- remplacer un OCR spécialisé pour une facture ou un acte ;
- produire une traduction française du texte du modèle.

Ces limites sont détaillées dans [limites.md](limites.md).
