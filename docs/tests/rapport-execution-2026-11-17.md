# Rapport d’exécution des tests

Date : 17 novembre 2026.

> Note de consolidation : les mesures de ce rapport ont été réalisées le 17 novembre 2026, avant le renommage du dépôt
> en `ocr-llm-miniature` le 18 novembre 2026. Les noms de fichiers, les commandes et les résultats restent valables.

## Environnement

| Élément | Valeur |
|---|---|
| Système | Windows 11 |
| Navigateur | Microsoft Edge 157.0.4341.60, mode sans interface, profil neuf à chaque exécution |
| Bun | 1.4.4 |
| Node.js | 24.13.0 |
| Modèle | `Cactus-Compute/mirage`, `mirage.cact` de 21 611 043 octets |
| Moteur | `vendor/cactus.wasm` du dépôt |

Google Chrome n’était pas installé sur le poste. Firefox et Safari n’ont pas été testés.

## Tests fonctionnels

Commande type :

```bash
node tests/e2e-wasm.mjs --image exemples/images/<image>.png \
  --json exemples/resultats/<resultat>.json --runs 2
```

| Test | Objets | Textes | Relations | Inférence à froid | Inférence à chaud | Total premier lancement |
|---|---|---|---|---|---|---|
| 01 · Deux cafés | 5 | 0 | 6 | 6,89 s | 3,73 s | 7,87 s |
| 02 · Marketing x AI Market Map | 29 | 32 | 2 | 9,86 s | 6,14 s | 10,81 s |
| 03 · Schéma Power BI | 20 | 25 | 1 | 8,49 s | 5,64 s | 9,71 s |

Les trois JSON de référence ont été comparés après réexécution : contenu identique pour une même image.

## Contrôles d’interface

| Contrôle | Résultat |
|---|---|
| Import par le champ de fichier | OK |
| Glisser-déposer simulé avec un `File` réel | OK, fichier accepté, bouton activé |
| Format refusé (`.txt`) | OK, message « Format non accepté… », bouton désactivé |
| Décocher « Boîtes » | OK, empreinte du canevas modifiée |
| Filtre de confiance à 0,80 | OK, « 5 objets » devient « 1 sur 5 objets » (test café) |
| Copie du JSON | OK côté charge utile : le texte remis à l’API presse-papiers est exactement le JSON affiché |
| Lecture du presse-papiers par le harnais | Échec attendu en mode sans interface (« Document is not focused »), non bloquant |
| Téléchargement du JSON | OK, fichier UTF-8 avec `mirage_output` et `analysis_metadata` |
| Réinitialisation | OK, aperçu, JSON et confiance remis à zéro |
| Affichage mobile 390 × 844 | OK, aucun défilement horizontal |
| Console du navigateur | Aucune erreur applicative |
| Requêtes réseau | Aucune requête ne transporte l’image |

Détail du bloc `analysis_metadata` réellement téléchargé lors du test café (le contenu `mirage_output` est omis ici,
il est complet dans le fichier) :

```json
{
  "file_name": "01-deux-cafes-latte-art.png",
  "file_size_bytes": 1153741,
  "image_width": 1100,
  "image_height": 693,
  "input_width": 1024,
  "input_height": 645,
  "inference_ms": 3728,
  "engine_load_ms": 0,
  "total_ms": 3728,
  "engine": "cactus.wasm (WebAssembly)",
  "model": "Cactus-Compute/mirage (mirage.cact)",
  "app_version": "1.0.0",
  "locale": "fr",
  "exported_at_local": "2026-11-17T12:37:07+01:00"
}
```

## Publication statique

Un dossier `_site` a été construit comme le fait le workflow (contenu de `wasm-app/` et images de `exemples/`), puis
servi par `python -m http.server` sans modèle local. L’application a téléchargé `mirage.cact` depuis Hugging Face, puis
analysé l’image. Le JSON produit est **identique octet pour octet** à celui obtenu avec le modèle servi localement
(empreinte SHA-256 `BD53EB469C6FDA5674FF47E1D45F562D758B51ED23FA4BF9AB474F66CDE13401`).

Ce test valide le chemin de publication, mais pas le déploiement GitHub Pages lui-même.

## Mode serveur

| Requête | Résultat |
|---|---|
| `GET /` | 200, page française |
| `GET /favicon.svg` | 200, `image/svg+xml` |
| `GET /api/health` | `{"ok":true}` |
| `POST /api/describe` | 500, `{"error":"Executable not found in $PATH: \"cactus\""}` |

Le code 500 est attendu : la CLI Cactus n’est pas installée sur le poste. L’interface affiche ce message en français.
L’inférence en mode serveur n’a donc **pas** été vérifiée.

## Vérifications SEO et fichier de site

- `bun run check:site` : OK ;
- image sociale : 1280 × 640 ;
- `robots.txt` et `sitemap.xml` : présents, deux URL publiques ;
- données structurées : `SoftwareApplication`, `WebSite`, `BreadcrumbList` ;
- liens internes et ressources locales : résolus ;
- `bun run lint` : aucune erreur.

## Ce qui n’a pas été vérifié

- exécution réelle du workflow GitHub Actions et déploiement GitHub Pages ;
- téléversement de l’image de prévisualisation sociale (action manuelle dans GitHub) ;
- Google Chrome, Firefox et Safari ;
- inférence du mode serveur avec la CLI Cactus ;
- comportement sur une connexion lente ou coupée pendant le téléchargement du modèle ;
- accessibilité par lecteur d’écran (contrôles manuels partiels seulement).

## Anomalies d’environnement

Une extension de sécurité Kaspersky injecte un script depuis `me.kis.v2.scr.kaspersky-labs.com` dans les pages de test.
Cette requête vient de l’antivirus du poste, pas de l’application. Elle est signalée dans chaque rapport de harnais.

## Conclusion

Le mode WebAssembly, l’interface française, l’export JSON et les trois tests de référence fonctionnent et sont
reproductibles. Les limites restantes sont documentées dans [../limites.md](../limites.md).
