# Journal des modifications

## 1.0.1 - 2026-11-20

Consolidation après le renommage du dépôt en `ocr-llm-miniature`.

### Modifié

- nom du produit « OCR et vision avec un LLM miniature » dans le titre, le H1, les métadonnées Open Graph et Twitter,
  les données structurées, le manifeste, l’image sociale, `package.json` et les pages de documentation ; le moteur
  « Mirage » reste cité dans le corps, les crédits et les mots-clés ;
- URL de référence unique `https://adam-s-tech.github.io/ocr-llm-miniature/` dans `sitemap.xml`, `robots.txt` et les
  métadonnées des deux pages ;
- `scripts/check-site.mjs` lit désormais l’URL canonique de `index.html` au lieu de la coder en dur, compare le même
  origin dans `documentation.html`, les images sociales, `robots.txt`, `sitemap.xml` et `package.json.homepage`, et
  accepte la variable d’environnement `SITE_URL` pour forcer l’URL attendue ;
- workflow `check.yml` déclenché aussi sur `push` vers `main` ;
- workflow `pages.yml` : ajout de `actions/configure-pages@v5` avant la publication de l’artefact ;
- `NOTICE.md` et `THIRD_PARTY_NOTICES.md` : licence Apache 2.0 du modèle et du runtime Cactus confirmée par la
  documentation Cactus et le dépôt runtime, avec les liens ; le code de démonstration reste sans licence ;
- paternité du code de la version française et droits des images de test confirmés par Adama BELEM, consignés dans les
  notices ; description et topics réels du dépôt documentés dans `docs/installation.md`, avec ajout des topics `vision`
  et `llm` ;
- note en tête de `docs/tests/rapport-execution-2026-11-17.md` : les mesures datent du 17 novembre 2026, avant le
  renommage.

## 1.0.0 - 2026-11-17

Première version française documentée.

### Ajouté

- interface entièrement en français pour les deux modes, WebAssembly et serveur local ;
- panneau « Relations » avec traduction des prédicats connus ;
- filtre de confiance, couches boîtes, masques, étiquettes, textes et mise en évidence ;
- copie du JSON brut et téléchargement avec `mirage_output` et `analysis_metadata` séparés ;
- messages d’état et d’erreur en français, y compris format refusé, WebAssembly indisponible et mode `file://` ;
- documentation complète dans `docs/`, dont trois pages de test et une expression de besoin ;
- trois expériences de référence avec images, annotations et sorties JSON réelles ;
- page de documentation publiée avec métadonnées Open Graph, Twitter Card et données structurées ;
- `robots.txt`, `sitemap.xml`, manifeste, favicon, icônes et image de prévisualisation 1280 × 640 ;
- workflows GitHub Actions pour les vérifications et le déploiement manuel sur GitHub Pages ;
- harnais de test de bout en bout piloté par le protocole DevTools, sans dépendance ;
- script de vérification des fichiers SEO (`bun run check:site`) ;
- notices de crédits et composants tiers.

### Modifié

- README réécrit en français ; l’original anglais est conservé dans `README.original.md` ;
- `package.json` complété : nom, version, description, auteur, dépôt, page d’accueil, anomalies, mots-clés, scripts ;
- `wasm-app/serve.ts` sert aussi `exemples/` en lecture seule et davantage de types de fichiers ;
- `index.ts` sert les fichiers SVG du mode serveur.

### Corrigé

- `wasm-app/vendor/cactus.js` : séparateur manquant entre deux instructions, qui empêchait tout chargement du moteur
  WebAssembly. Un point-virgule a été ajouté, sans autre modification.
- Le temps affiché distingue désormais le chargement du moteur, l’inférence et le total.
- La réinitialisation vide aussi le JSON brut mémorisé, pour éviter de copier un ancien résultat.

### Sécurité

- aucun secret, jeton ou clé dans le dépôt ;
- aucune image envoyée à un service distant ;
- chemins statiques contrôlés dans les deux serveurs ;
- aucune dépendance d’exécution ajoutée.

### Notes

- Le mode serveur n’a pas été exécuté : la CLI Cactus n’était pas installée sur le poste de test.
- Google Chrome n’était pas installé : le test de navigateur a été réalisé avec Microsoft Edge 157 en mode sans
  interface.
