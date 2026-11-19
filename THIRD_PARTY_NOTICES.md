# Composants tiers

Ce fichier recense les composants utilisés par la démonstration et leur licence, vérifiée le 20 novembre 2026.

## Composants d’exécution

| Composant | Rôle | Auteur | Licence | Source |
|---|---|---|---|---|
| Modèle Mirage (`mirage.cact`) | vision, OCR, détection, segmentation | Cactus Compute | Apache 2.0 | https://huggingface.co/Cactus-Compute/mirage |
| Runtime Cactus | moteur d’inférence | Cactus Compute | Apache 2.0 | https://github.com/cactus-compute/cactus |
| `wasm-app/vendor/cactus.js` | colle JavaScript du moteur | généré depuis le runtime Cactus | Apache 2.0 | démonstration d’origine |
| `wasm-app/vendor/cactus.wasm` | moteur compilé | Cactus Compute | Apache 2.0 | démonstration d’origine |

Le fichier `cactus.js` a reçu un correctif d’une ponctuation, documenté dans [NOTICE.md](NOTICE.md). Le binaire
`cactus.wasm` et les poids ne sont pas modifiés.

La licence Apache 2.0 du modèle et du runtime est confirmée par la documentation Cactus et le dépôt runtime :
<https://github.com/cactus-compute/cactus> et <https://huggingface.co/Cactus-Compute/mirage>. Elle ne couvre pas le
code de démonstration, qui reste sans licence.

## Outils de développement

| Composant | Rôle | Licence |
|---|---|---|
| Bun | exécution et serveur local | MIT |
| Biome | analyse statique et formatage | MIT |
| TypeScript | types | Apache 2.0 |
| @types/bun | types Bun | MIT |
| Node.js | scripts de test | MIT |

Ces outils ne sont pas redistribués dans le dépôt ; ils sont installés par `bun install` ou fournis par le poste.

## Contenus

| Contenu | Licence |
|---|---|
| Code de la démonstration d’origine | aucune licence déclarée |
| Version française et documentation | aucune licence déclarée, voir NOTICE.md |
| Images de `exemples/images/` | aucune licence déclarée, fournies par le propriétaire du dépôt |

## Absence de services externes

La démonstration ne charge ni police distante, ni bibliothèque depuis un CDN, ni script d’analyse. Le seul
téléchargement externe prévu est celui des poids du modèle depuis Hugging Face, et uniquement sur l’hébergement statique
où aucun serveur ne peut relayer le fichier.
