# Crédits et statut des licences

## Origine du dépôt

Ce dépôt est un fork de [`joemaddalone/mirage-demo`](https://github.com/joemaddalone/mirage-demo).

- **Démonstration originale** : Joe Maddalone.
- **Moteur Cactus et modèle Mirage** : Cactus Compute.
- **Code de la version française, documentation, tests, cas d’usage et adaptations de l’interface** : Adama BELEM,
  Adam AI / Next Gen AI.

L’interface reprend la structure de la démonstration d’origine. Les textes visibles ont été traduits en français, sans
modifier la logique d’inférence. Les crédits d’origine restent affichés dans l’interface et dans le README.

## Statut des licences

| Élément | Licence | Preuve |
|---|---|---|
| Code de la démonstration d’origine | **Aucune licence déclarée** | API GitHub, `license` vide sur `joemaddalone/mirage-demo` |
| Ce fork | **Aucune licence ajoutée** | décision explicite, voir ci-dessous |
| Modèle Mirage (`Cactus-Compute/mirage`) | Apache 2.0 | Apache 2.0 confirmé par la documentation Cactus et le dépôt runtime |
| Runtime Cactus (`cactus-compute/cactus`) | Apache 2.0 | Apache 2.0 confirmé par la documentation Cactus et le dépôt runtime |
| `wasm-app/vendor/cactus.js` et `cactus.wasm` | Apache 2.0 (artefacts du runtime) | fichiers fournis par la démonstration d’origine |

La licence Apache 2.0 du modèle et du runtime est confirmée par la documentation Cactus et le dépôt runtime :
<https://github.com/cactus-compute/cactus> et <https://huggingface.co/Cactus-Compute/mirage>. Elle couvre le modèle et
le runtime Cactus, jamais le code de démonstration, qui reste sans licence.

Vérifications effectuées le 20 novembre 2026.

### Pourquoi aucune licence n’est ajoutée au dépôt

Le code de la démonstration d’origine n’est accompagné d’aucun fichier `LICENSE`. Appliquer Apache 2.0 à l’ensemble du
dépôt au motif que le modèle et le runtime sont sous Apache 2.0 serait juridiquement faux : la licence du modèle ne
couvre pas le code de démonstration.

En conséquence :

- aucun fichier `LICENSE` n’est créé dans ce dépôt ;
- la mention `UNLICENSED` de `package.json` reflète cette absence ;
- le propriétaire du dépôt doit obtenir l’accord de l’auteur d’origine, ou choisir une licence compatible, avant toute
  diffusion large ou réutilisation commerciale du code.

## Correctif appliqué au moteur

`wasm-app/vendor/cactus.js` contenait une instruction concaténée invalide :

```
...wasmBinary=Module["wasmBinary"]Module["ccall"]=ccall;...
```

L’absence du point-virgule faisait échouer le chargement du script et rendait le mode WebAssembly inutilisable, dans le
dépôt d’origine comme dans le fork. Le correctif ajoute uniquement le séparateur manquant. Aucun autre changement n’est
apporté au fichier, et `cactus.wasm` n’est pas modifié.

## Images de démonstration

Les trois images de `exemples/images/` ont été réalisées par Adama BELEM, qui en détient les droits et autorise leur
diffusion dans ce dépôt. Elles ne contiennent aucune donnée personnelle ni information confidentielle. Aucune licence
ouverte n’est déclarée sur ces images : les droits restent ceux de leur auteur.

## Composants tiers

Voir [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Recommandations

1. Demander à l’auteur d’origine sa position sur la licence du code de démonstration.
2. Si une licence est accordée, l’ajouter à la racine et mettre à jour `package.json`.
3. Conserver la mention des crédits dans toute copie ou adaptation.
