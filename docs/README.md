# Documentation de Mirage Demo français

Cette documentation accompagne la démonstration française du modèle de vision Mirage, exécuté en WebAssembly dans le
navigateur. Elle s’adresse à trois publics :

- **utilisateur curieux** : découvrir ce que fait la démonstration et ce qu’elle ne fait pas ;
- **formateur ou consultant** : reproduire les tests, comprendre les résultats et les limites ;
- **développeur** : installer, étendre vers les PDF, les factures ou un workflow n8n.

## Par où commencer

| Vous voulez | Lisez |
|---|---|
| Installer et lancer la démonstration | [installation.md](installation.md) |
| Comprendre le pipeline et le format JSON | [fonctionnement.md](fonctionnement.md) |
| Vérifier ce qui sort du navigateur | [confidentialite.md](confidentialite.md) |
| Voir des cas d’usage professionnels | [cas-usage.md](cas-usage.md) |
| Connaître les limites observées | [limites.md](limites.md) |
| Rejouer les trois tests | [tests/README.md](tests/README.md) |
| Préparer une extension PDF, factures, n8n | [architecture-cible.md](architecture-cible.md) |
| Comprendre la demande initiale | [expression-de-besoin.md](expression-de-besoin.md) |

## Les trois tests

1. [Deux cafés](tests/01-cafe.md) : détection d’objets et segmentation sur une photographie.
2. [Marketing x AI Market Map](tests/02-marketing-ai-market-map.md) : OCR et localisation de nombreux petits textes.
3. [Schéma Power BI](tests/03-schema-power-bi.md) : lecture d’un support pédagogique français.

Les images utilisées sont dans `exemples/images/`, les sorties JSON dans `exemples/resultats/`.

## Repères

- version de l’application : 1.0.0 ;
- mode principal : WebAssembly dans le navigateur ;
- mode secondaire : serveur local avec la CLI Cactus ;
- poids du modèle : environ 22 Mo, téléchargés une fois puis mis en cache ;
- aucune image envoyée à un service distant.

## Crédits

Mirage et Cactus sont développés par Cactus Compute. La démonstration originale est de Joe Maddalone. La version
française, la documentation, les tests et les cas d’usage ont été adaptés par Adama BELEM (Adam AI / Next Gen AI).
Voir [NOTICE.md](../NOTICE.md).
