# Confidentialité et requêtes réseau

## Principe

En mode WebAssembly, l’image analysée reste dans le navigateur. Elle est lue depuis un objet local, dessinée dans un
canevas, puis traitée par le moteur Cactus inclus dans la page. Aucun pixel n’est transmis à un serveur d’inférence.

## Ce qui est envoyé, et quand

| Moment | Requête | Contenu | Destination |
|---|---|---|---|
| Ouverture de la page | `index.html`, `styles.css`, `app.js`, `favicon.svg`, `manifest.webmanifest` | fichiers du site | le site qui héberge la page |
| Premier clic sur « Analyser l’image » | `vendor/cactus.js`, `vendor/cactus.wasm` | moteur | le site qui héberge la page |
| Premier clic sur « Analyser l’image » | `mirage.cact` (environ 22 Mo) | poids du modèle | Hugging Face sur GitHub Pages, ou `localhost` via `serve.ts` |
| Pendant l’analyse | aucune requête | aucune | aucune |

Aucune requête ne transporte l’image, son nom, ses dimensions ou le résultat de l’analyse. Le nom du fichier reste dans
l’onglet et n’apparaît que dans l’interface et dans le JSON téléchargé.

## Ce qui n’est pas utilisé

- pas d’outil de mesure d’audience ;
- pas de cookie applicatif ;
- pas de compte utilisateur ;
- pas de stockage distant ni de base de données ;
- pas de service de traduction ou d’OCR externe.

## Cache

Deux caches entrent en jeu :

- le cache HTTP du navigateur pour `cactus.wasm` et `mirage.cact` ;
- le dossier `wasm-app/models/` du poste, rempli par `serve.ts` lors du premier lancement local.

Vider le cache du navigateur ou naviguer en fenêtre privée provoque un nouveau téléchargement des poids.

## Mode serveur local

Le mode serveur (`bun run start`) écrit l’image reçue dans un fichier temporaire pour appeler la CLI Cactus, puis la
supprime dans un bloc `finally`, y compris en cas d’erreur. L’image transite donc par le disque local, jamais par
Internet.

## Comment vérifier

1. ouvrir la démonstration ;
2. ouvrir les outils de développement, onglet « Réseau », cocher « Préserver le journal » ;
3. vider le journal, puis analyser une image ;
4. constater que les seules requêtes sont les fichiers du site, le moteur et les poids du modèle ;
5. vérifier qu’aucune requête ne dépasse la taille de l’image analysée ni ne contient son contenu.

L’onglet « Application » permet aussi de constater qu’aucun cookie ni stockage local applicatif n’est créé.

## Cas particulier du poste de test

Lors des mesures du 17/11/2026, une extension de sécurité Kaspersky a injecté un script
(`me.kis.v2.scr.kaspersky-labs.com`) dans la page de test. Cette requête vient de l’antivirus installé sur le poste, pas
de l’application. Le rapport de test la signale explicitement pour éviter toute confusion.

## Recommandations pour des documents sensibles

- utiliser le mode WebAssembly, jamais le mode serveur, si l’image ne doit pas toucher le disque ;
- vérifier l’onglet « Réseau » avant de confier un document réel ;
- ne pas installer d’extension qui réécrit la page sur un poste utilisé pour des documents sensibles ;
- conserver le dépôt et le site sur une origine de confiance, car le moteur et les poids sont chargés depuis l’origine
  de la page.

## Limites

Cette note décrit le comportement du code de ce dépôt. Elle ne couvre pas :

- les journaux du serveur qui héberge la page (GitHub Pages) ;
- le cache du fournisseur de poids (Hugging Face) ;
- les politiques des navigateurs et des antivirus installés sur le poste.
