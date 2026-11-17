# Exemples et résultats de référence

Ce dossier contient les trois expériences de référence de la démonstration française : les images analysées et les
sorties JSON réellement produites par le modèle.

## Contenu

```
exemples/
├── images/
│   ├── 01-deux-cafes-latte-art.png      1100 × 693, 1,15 Mo
│   ├── 02-marketing-ai-market-map.png    774 × 606, 264 Ko
│   └── 03-schema-power-bi.png           1819 × 1055, 1,20 Mo
└── resultats/
    ├── 01-cafe-deux-tasses.json
    ├── 02-marketing-ai-market-map.json
    └── 03-schema-power-bi.json
```

| Image | Texte alternatif | Résultat | Page de test |
|---|---|---|---|
| Deux cafés | « Deux tasses de café vues de dessus sur une table en bois, avec un cœur dessiné dans la mousse. » | [JSON](resultats/01-cafe-deux-tasses.json) | [01-cafe.md](../docs/tests/01-cafe.md) |
| Marketing x AI Market Map | « Capture d’écran d’une carte marketing des outils d’intelligence artificielle, organisée en lignes et colonnes de logos. » | [JSON](resultats/02-marketing-ai-market-map.json) | [02-marketing-ai-market-map.md](../docs/tests/02-marketing-ai-market-map.md) |
| Schéma Power BI | « Schéma pédagogique Power BI en français avec cinq étapes numérotées, des flèches et des icônes. » | [JSON](resultats/03-schema-power-bi.json) | [03-schema-power-bi.md](../docs/tests/03-schema-power-bi.md) |

Les noms de fichiers sont descriptifs et sans accents, pour éviter les problèmes d’URL et de dépôt.

## Nature des fichiers JSON

- Chaque fichier est exactement la sortie `cactus_describe()` affichée par l’application, mise en forme avec deux
  espaces d’indentation.
- Les clés techniques ne sont pas traduites et le contenu n’est pas retouché.
- L’export proposé par l’interface ajoute, lui, un bloc `analysis_metadata` séparé ; ce n’est pas le cas ici.

## Droits de diffusion

Les trois images ont été fournies par Adama BELEM pour ce dépôt. Elles ne contiennent aucune donnée personnelle ni
information confidentielle identifiable. Leur provenance exacte (photo libre de droits, capture personnelle, support
interne) doit être confirmée par le propriétaire avant toute réutilisation hors du dépôt. Voir
[NOTICE.md](../NOTICE.md).

## Rejouer une analyse

```bash
bun run start:wasm
node tests/e2e-wasm.mjs \
  --image exemples/images/01-deux-cafes-latte-art.png \
  --json exemples/resultats/01-cafe-deux-tasses.json \
  --annotated docs/images/tests/01-cafe-annote.png \
  --runs 2
```

Le harnais écrit aussi `01-cafe-deux-tasses.report.json` à côté du JSON : ce rapport contient les durées, les contrôles
et les requêtes réseau. Il n’est pas versionné.
