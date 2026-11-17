# Protocole des trois tests

## Objectif

Vérifier que la version française analyse réellement trois images de nature différente, puis conserver des sorties JSON
comparables pour les prochaines évolutions.

## Environnement de mesure

| Élément | Valeur |
|---|---|
| Date | 17 novembre 2026 |
| Système | Windows 11 |
| Navigateur | Microsoft Edge 157.0.4341.60, mode sans interface |
| Moteur | `cactus.wasm` du dépôt, chargé par `wasm-app/serve.ts` |
| Modèle | `Cactus-Compute/mirage` (`mirage.cact`, 21 611 043 octets) |
| Résolution d’entrée | 1024 pixels sur le grand côté |
| Mode | WebAssembly, profil de navigateur neuf à chaque exécution |

Google Chrome n’était pas installé sur le poste : la compatibilité Chrome est attendue mais non vérifiée ici.

## Déroulement d’un test

1. démarrer le serveur statique local : `bun run start:wasm` ;
2. lancer le harnais avec l’image voulue ;
3. le harnais ouvre la page, dépose le fichier par le champ prévu, clique sur « Analyser l’image » ;
4. il attend la fin réelle de l’inférence, capture le JSON affiché et une image annotée ;
5. il rejoue une seconde analyse dans le même onglet pour mesurer le temps à chaud ;
6. il vérifie le filtre de confiance, les couches visuelles, la copie, le téléchargement et la réinitialisation ;
7. il écrit le JSON brut, un rapport et la capture.

Commande type :

```bash
node tests/e2e-wasm.mjs \
  --image exemples/images/01-deux-cafes-latte-art.png \
  --json exemples/resultats/01-cafe-deux-tasses.json \
  --shot docs/images/interface-francaise.png \
  --annotated docs/images/tests/01-cafe-annote.png \
  --runs 2
```

Le rapport `*.report.json` est écrit à côté du JSON. Il n’est pas versionné : il contient des chemins et des durées
propres au poste.

## Résultats

| Test | Objets | Textes | Relations | Inférence à froid | Inférence à chaud | Total premier lancement |
|---|---|---|---|---|---|---|
| [01 · Deux cafés](01-cafe.md) | 5 | 0 | 6 | 6,89 s | 3,73 s | 7,87 s |
| [02 · Marketing x AI Market Map](02-marketing-ai-market-map.md) | 29 | 32 | 2 | 9,86 s | 6,14 s | 10,81 s |
| [03 · Schéma Power BI](03-schema-power-bi.md) | 20 | 25 | 1 | 8,49 s | 5,64 s | 9,71 s |

« À froid » désigne la première inférence après chargement du moteur ; le total du premier lancement inclut le
téléchargement du modèle depuis `localhost`.

## Contrôles effectués par le harnais

- le fichier est bien accepté par le champ d’import ;
- le JSON affiché est analysable ;
- décocher « Boîtes » modifie réellement le canevas (empreinte SHA-256 du canevas) ;
- le filtre de confiance réduit la liste des objets affichés ;
- le bouton « Télécharger le JSON » produit un fichier UTF-8 contenant `mirage_output` et `analysis_metadata` ;
- « Réinitialiser » vide l’aperçu, le JSON et remet la confiance à zéro ;
- aucune requête réseau ne transporte l’image.

## Ce que ces tests ne prouvent pas

- la qualité générale du modèle sur d’autres images ;
- la compatibilité avec Firefox et Safari ;
- la tenue de charge sur des images très grandes ;
- l’extraction fiable de montants ou de champs comptables ;
- le mode serveur, non exécuté faute de CLI Cactus sur le poste.

## Rapport d’exécution

Le détail des mesures, des contrôles et des limites de la campagne du 17/11/2026 est dans
[rapport-execution-2026-11-17.md](rapport-execution-2026-11-17.md).

## Rejouer les tests

Les images sont dans `exemples/images/`. Les JSON de référence sont dans `exemples/resultats/`. Pour comparer une
nouvelle version, relancer le harnais et comparer les fichiers : les scores et les libellés doivent rester proches, sans
exiger une égalité stricte, le modèle n’étant pas garanti déterministe d’une plateforme à l’autre.
