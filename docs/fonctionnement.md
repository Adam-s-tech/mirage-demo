# Fonctionnement technique

## Structure du dépôt

```
mirage-demo/
├── index.ts                  serveur local du mode CLI Cactus (port 3000)
├── public/                   interface du mode serveur
├── wasm-app/                 interface et site publié (mode WebAssembly)
│   ├── index.html            démonstration
│   ├── documentation.html    page de documentation publiée
│   ├── app.js                logique d’analyse et d’affichage
│   ├── styles.css
│   ├── serve.ts              serveur statique local (port 3001) et cache du modèle
│   ├── vendor/cactus.js      colle JavaScript du moteur Cactus
│   ├── vendor/cactus.wasm    moteur compilé
│   ├── models/mirage.cact    poids (non versionné, téléchargé au premier usage)
│   └── sitemap.xml, robots.txt, manifest.webmanifest, images SEO
├── exemples/                 images et sorties JSON de référence
├── docs/                     documentation
└── tests/                    scripts de test et de génération d’images
```

## Pipeline d’une analyse en mode WebAssembly

1. **Sélection du fichier.** `selectFile()` vérifie le type (`image/jpeg`, `image/png`, `image/webp`) et crée une URL
   locale `blob:`.
2. **Décodage.** Un objet `Image` charge l’URL locale ; ses dimensions naturelles sont conservées pour l’affichage.
3. **Chargement du moteur.** `ensureEngine()` charge `vendor/cactus.js`, télécharge `vendor/cactus.wasm`, instancie le
   module, puis télécharge les poids et appelle `_cactus_load()`.
4. **Préparation de l’image.** `imageToRGB()` réduit l’image à 1024 pixels sur le grand côté, la dessine dans un
   canevas hors écran et produit un tableau RGB sans canal alpha.
5. **Inférence.** `_cactus_describe(rgb, largeur, hauteur, "{}", 0, 0, sortie, capacité)` renvoie une taille d’octets
   positive ou un code négatif. Le résultat est du JSON UTF-8.
6. **Affichage.** Les boîtes sont exprimées en 0 à 1000 ; elles sont converties en pixels pour le canevas. Les masques
   sont des polygones de points successifs, également en 0 à 1000.
7. **Export.** Le JSON brut est affiché sans transformation. La copie reprend ce texte exact. Le téléchargement ajoute
   un objet `analysis_metadata` à côté de `mirage_output`.

Constantes utiles dans `wasm-app/app.js` : `MAX_EDGE` (1024), `OUT_CAPACITY` (16 Mo), `CACTUS_VISION` (4).

## Format des sorties

Le modèle renvoie sept clés de premier niveau. Les clés techniques ne sont jamais traduites : l’interface traduit
uniquement les libellés d’affichage.

| Clé | Contenu | Remarque |
|---|---|---|
| `scene` | objet libre : `surface`, `lighting`, `style`, `setting`, `background`… | les clés varient selon l’image |
| `objects` | liste d’objets : `name`, `bbox`, `score`, `mask`, `position`, `description` | `bbox` et `mask` en 0 à 1000 |
| `text` | liste de textes : `string`, `bbox`, `score` | l’ordre n’est pas un ordre de lecture garanti |
| `relations` | liste de triplets `subject`, `predicate`, `object` | les valeurs sont des `id` d’objets |
| `regions` | zones agrégées | vide sur les trois tests |
| `events` | événements détectés | vide sur les trois tests |
| `reasoning` | chaîne séparée par des barres verticales | commence souvent par `lang: en` |

Extrait réel du test café, masque tronqué :

```json
{
  "id": 1,
  "name": "foam",
  "bbox": [72, 108, 468, 656],
  "score": 0.758,
  "mask": [176, 114, 155, 131, 129, 164],
  "position": "inside mugs",
  "description": { "color": "orange", "texture": "smooth" }
}
```

### Points d’attention observés

- **Identifiants répétés.** Sur les tests 2 et 3, plusieurs objets partent avec `id: 1`. Les relations pointent donc
  vers un identifiant ambigu. L’interface résout le premier objet portant cet identifiant ; c’est une limite du modèle,
  pas une erreur d’affichage.
- **Descriptions anglaises.** `reasoning`, `position` et les attributs de `description` sont produits en anglais. La
  traduction française concerne l’interface et les prédicats de relations, pas le contenu du modèle.
- **Scores.** Un score bas ne signifie pas « faux » : sur le café, la tasse de gauche obtient 0,393 et celle de droite
  0,810, alors que les deux sont correctement détectées.
- **Résolution.** Boîtes et masques étant normalisés, réduire à 1024 pixels ne change pas les coordonnées, mais peut
  faire perdre de petits textes.

## Mesure des performances

L’interface distingue trois durées :

- `engine_load_ms` : chargement du moteur et des poids, mesuré séparément ;
- `inference_ms` : appel `cactus_describe()` seul ;
- `total_ms` : du clic à l’affichage.

Le premier appel après chargement est plus lent (compilation WebAssembly et initialisation des buffers). Sur ce poste,
le test café passe de 6,89 s à froid à 3,73 s à chaud.

## Le moteur Cactus dans ce dépôt

`wasm-app/vendor/cactus.js` a été récupéré tel quel depuis la démonstration d’origine. Le fichier publié contenait une
instruction concaténée invalide (`...Module["wasmBinary"]Module["ccall"]...`) qui empêchait tout chargement du moteur.
Une seule ponctuation manquante a été ajoutée (`;`) pour rétablir un JavaScript valide. Le binaire `cactus.wasm` et les
poids ne sont pas modifiés. Le détail figure dans [CHANGELOG.md](../CHANGELOG.md) et [NOTICE.md](../NOTICE.md).

## Mode serveur

`index.ts` sert les fichiers de `public/` et expose `POST /api/describe`. Le serveur écrit l’image reçue dans un fichier
temporaire, lance `cactus mirage describe`, renvoie `{ result, filename, serverMs }` puis supprime le fichier temporaire.
Aucune donnée n’est conservée après la réponse.

## Sécurité des chemins

Le serveur statique `wasm-app/serve.ts` résout chaque requête à l’intérieur d’un dossier de base et refuse toute remontée
de répertoire. Le serveur `index.ts` ne sert que des fichiers plats de `public/` et bloque `..`, `/` et `\` dans le nom.
