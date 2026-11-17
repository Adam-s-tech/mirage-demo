# Architecture cible

Ce document décrit les évolutions envisagées. Aucune de ces fonctions n’est livrée dans la version 1.

## Version 1 livrée

```
Navigateur
  └── page statique (wasm-app)
        ├── cactus.wasm        moteur
        ├── mirage.cact        poids (cache)
        └── app.js             canevas, affichage, export JSON
```

Le traitement est entièrement côté client. Le mode serveur reste disponible pour comparer avec la CLI.

## Version 2 : import PDF

Objectif : analyser un PDF page par page sans quitter le navigateur.

```
PDF local
  └── rendu page -> image (canevas)
        └── pipeline Mirage par page (existant)
              └── agrégation : pages[], métadonnées, ordre de lecture
```

Points à décider :

- bibliothèque de rendu PDF côté client, chargée à la demande (poids et licence à vérifier) ;
- limite de pages et de résolution par page ;
- progression, annulation, reprise ;
- rapport consolidé (une entrée par page, champs communs) ;
- normalisation de l’ordre de lecture (tri par position, regroupement en lignes).

Livrable attendu : une page de démonstration dédiée, un format JSON versionné (`schema_version`), et des tests PDF
réutilisant le harnais existant.

## Version 3 : industrialisation

```
Image ou PDF
  └── normalisation OCR (déduplication, lignes, colonnes)
        └── classification documentaire (facture, capture, support)
              └── seuils métier (score minimal par champ)
                    └── webhook n8n -> routage
```

Points à décider :

- règles de déduplication (texte identique, boîtes qui se chevauchent) ;
- classification : heuristiques ou petit modèle local ;
- seuils par type de document ;
- contrat d’échange n8n (schéma JSON, idempotence, reprise sur erreur) ;
- routage vers un OCR spécialisé quand la confiance est insuffisante ;
- génération Markdown pour la revue humaine ;
- comparaison entre moteurs sur un jeu de test commun.

## Version 4 : flux métier

```
Réception (mail, dossier, GED)
  └── analyse locale (v3)
        └── extraction de champs critiques (montant, date, fournisseur)
              └── validation humaine
                    └── intégration Odoo ou SharePoint
                          └── journal et mesures de performance
```

Points à décider :

- champs critiques et règles de contrôle (somme, TVA, échéance) ;
- interface de validation (fichier corrigé, motifs de rejet) ;
- connecteurs Odoo et SharePoint, périmètre et droits ;
- API locale optionnelle, ou simple CLI ;
- tableau de bord des performances (temps, taux d’extraction, corrections).

## Principes transverses

- **Local d’abord.** Toute nouvelle étape doit pouvoir fonctionner sans service distant.
- **Traçabilité.** Chaque résultat conserve la sortie brute du modèle et les métadonnées du pipeline.
- **Versionnement des schémas.** Les évolutions de JSON doivent être identifiables (`schema_version`).
- **Tests reproductibles.** Chaque version ajoute ses images de référence et ses sorties attendues.
- **Sécurité.** Aucun secret dans le dépôt, aucune image envoyée à un tiers, chemins de fichiers contrôlés.
- **Licences.** Vérifier chaque nouvelle dépendance et chaque nouveau modèle avant intégration.

## Décisions ouvertes

| Sujet | Options | Critère |
|---|---|---|
| Rendu PDF | bibliothèque cliente, conversion serveur | confidentialité, poids, licence |
| Ordre de lecture | tri géométrique, modèle dédié | simplicité, qualité sur pages denses |
| Classification | heuristiques, modèle local | coût, explicabilité |
| Validation humaine | interface intégrée, export CSV | rapidité de mise en œuvre |
| Intégration Odoo | API externe, module Odoo, import fichier | droits, maintenance |

## Ce qui ne changera pas

- la sortie brute du modèle reste accessible ;
- l’image ne part pas vers un service d’inférence ;
- les crédits restent visibles ;
- la documentation et les tests restent en français.
