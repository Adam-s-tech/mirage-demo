# Installation et publication

## Prérequis

| Outil | Usage | Version constatée |
|---|---|---|
| [Bun](https://bun.sh) | commandes du dépôt et serveur local | 1.4.4 |
| Node.js | scripts de test et de vérification | 24.13.0 |
| Python 3 | serveur statique de secours | 3.12.10 |
| CLI Cactus | mode serveur uniquement (`pip install -U cactus-compute`) | non installée sur le poste de test |

Le mode WebAssembly ne demande ni Python ni la CLI Cactus : un navigateur récent suffit.

## Installation locale

```bash
git clone https://github.com/Adam-s-tech/ocr-llm-miniature.git
cd ocr-llm-miniature
bun install
```

## Lancer la version WebAssembly

```bash
bun run start:wasm
```

Puis ouvrez **http://localhost:3001**.

Au premier lancement, le petit serveur `wasm-app/serve.ts` télécharge `mirage.cact` depuis Hugging Face et le conserve
dans `wasm-app/models/`. Les lancements suivants réutilisent ce fichier ; le navigateur garde également une copie en
cache.

### Variante sans Bun

Après un premier passage par `serve.ts`, le dossier `wasm-app/` est autonome :

```bash
cd wasm-app
python -m http.server 8000
```

Ouvrez **http://localhost:8000**. Le fichier `models/mirage.cact` est servi localement s’il existe. Sinon, la page
tente de récupérer les poids officiels sur Hugging Face.

Le mode `file://` ne fonctionne pas : le navigateur bloque WebAssembly et les fichiers locaux. Un serveur HTTP, même
minimal, est obligatoire.

## Lancer la version serveur

Installez la CLI Cactus, puis :

```bash
bun run start
```

Ouvrez **http://localhost:3000**. La commande exécutée est `cactus mirage describe <fichier>` ; l’image est écrite
temporairement sur disque puis supprimée après l’analyse.

Sans CLI Cactus, l’interface reste utilisable mais chaque analyse renvoie une erreur explicite.

## Vérifications disponibles

```bash
bun run lint          # analyse statique Biome
bun run check:site    # vérifie les fichiers SEO de la version publiée
node tests/e2e-wasm.mjs --image exemples/images/01-deux-cafes-latte-art.png \
  --json exemples/resultats/01-cafe-deux-tasses.json --runs 2
```

Le test de bout en bout pilote un navigateur Chromium sans interface (Edge ou Chrome), réalise une inférence réelle,
puis vérifie le filtre de confiance, les couches visuelles, la copie, le téléchargement et la réinitialisation. Il écrit
un rapport à côté du JSON demandé (`*.report.json`).

## Publication GitHub Pages

Le dépôt contient un workflow `.github/workflows/pages.yml`. Il est volontairement **manuel** : aucun déploiement ne
part tant que vous ne le déclenchez pas.

Procédure d’activation :

1. pousser la branche puis fusionner la pull request dans `main` ;
2. ouvrir **Settings > Pages** ;
3. choisir **Source : GitHub Actions** ;
4. ouvrir l’onglet **Actions**, sélectionner « Déploiement GitHub Pages », puis **Run workflow** sur `main` ;
5. attendre la fin du job et vérifier l’URL affichée.

Le workflow installe Bun, lance `bun run lint` et `bun run check:site`, prépare `_site/` en copiant `wasm-app/` et
`exemples/images/`, puis publie l’artefact. Aucun secret n’est nécessaire.

Après la première publication :

- vérifiez que `https://adam-s-tech.github.io/ocr-llm-miniature/` correspond bien à l’URL canonique écrite dans
  `wasm-app/index.html`, `wasm-app/documentation.html`, `robots.txt` et `sitemap.xml` ;
- si le nom du dépôt ou le propriétaire change, remplacez cette URL partout avant publication.

### Configuration du dépôt

La description et les topics se règlent dans **Settings** (ou par l’API). Valeurs prévues :

- description : `Démo française de Mirage WASM : OCR, vision par ordinateur, détection d’objets, segmentation et extraction JSON locale dans le navigateur.` ;
- topics : `mirage`, `cactus-compute`, `webassembly`, `wasm`, `ocr`, `computer-vision`, `object-detection`,
  `image-segmentation`, `local-ai`, `browser-ai`, `document-ai`, `french`.

### Social preview

L’image est prête : `wasm-app/og-image.png` (1280 × 640). GitHub ne permet pas de la téléverser par API. Il faut la
déposer à la main dans **Settings > General > Social preview**.

## Dépannage

| Symptôme | Cause probable | Action |
|---|---|---|
| « Ouvrez cette page via un petit serveur local » | page ouverte en `file://` | lancer `python -m http.server` |
| « WebAssembly n’est pas disponible » | navigateur trop ancien ou WebAssembly désactivé | utiliser Edge, Chrome ou Firefox récent |
| Téléchargement du modèle en échec | réseau bloqué vers Hugging Face, ou fichier absent | vérifier `wasm-app/models/mirage.cact`, relancer `bun run start:wasm` |
| « Échec de cactus_load » | archive de modèle différente ou corrompue | supprimer `wasm-app/models/mirage.cact` puis relancer |
| Mode serveur en erreur | CLI Cactus absente du `PATH` | `pip install -U cactus-compute`, vérifier `cactus --version` |
| Modèle rechargé à chaque visite | cache du navigateur vidé, navigation privée | comportement normal, le téléchargement est refait |

## Retour arrière

Le dépôt reste sur `main` tant que la pull request n’est pas fusionnée. Pour revenir en arrière après fusion :

```bash
git revert <commit de la fusion>
```

Aucun réglage externe n’est modifié par le code, sauf l’activation manuelle de GitHub Pages.
