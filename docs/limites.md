# Limites

Les limites ci-dessous sont constatées sur les trois tests de référence, ou directement dans le code. Elles sont
classées par nature.

## Limites du périmètre

- **Images seulement.** Aucun import PDF, aucun traitement multi-page, aucune conversion automatique. Il faut fournir
  une image JPG, PNG ou WebP.
- **Pas de sortie métier.** Le JSON décrit une scène et des objets ; il ne produit ni montant, ni date, ni fournisseur
  validé.
- **Pas d’historique.** Rien n’est conservé après rechargement de la page ou réinitialisation.
- **Pas de traitement par lot.** Une image à la fois dans l’interface.

## Limites du modèle

- **Interprétation en anglais.** La chaîne `reasoning` et les attributs de `description` sont rédigés en anglais ; seule
  l’interface est traduite. Aucune traduction automatique n’est appliquée.
- **Identifiants répétés.** Sur le test Marketing x AI Market Map et sur le test Power BI, plusieurs objets portent
  `id: 1`. Les relations deviennent ambiguës et l’interface affiche le premier objet correspondant.
- **Scores variables.** Sur le test café, la tasse de gauche obtient 0,393 et celle de droite 0,810, alors que les deux
  sont correctement détectées. Un score bas n’est pas une preuve d’erreur, et un score haut n’est pas une preuve
  d’exactitude.
- **Noms propres fragiles.** Sur la carte marketing : `Wwritesonic`, `Aletterdrop`, `creatily`, `coptions`, `Typetace`
  sont des déformations de marques réelles.
- **Logos fusionnés.** Le texte `IdeogramFFlairaiSPebble` regroupe trois logos voisins en une seule chaîne.
- **Libellés longs découpés.** Sur le schéma Power BI, « Mise à jour des données et des informations » revient en trois
  fragments, et « 3-Création de mesures » n’apparaît que partiellement.
- **Ordre de lecture non garanti.** La liste `text` suit l’ordre de détection, pas la lecture humaine.
- **Petites polices.** Les textes très petits ou peu contrastés passent sous le seuil de confiance.

## Limites techniques

- **Résolution plafonnée.** L’image est réduite à 1024 pixels sur le grand côté avant l’inférence. Cela accélère le
  traitement et n’affecte pas les coordonnées normalisées, mais peut faire perdre de petits textes.
- **Mémoire.** Le tampon de sortie est fixé à 16 Mo ; une image extrêmement dense pourrait dépasser la capacité du
  modèle.
- **Pas de contrôle de taille d’entrée.** Une image très lourde est chargée entièrement en mémoire par le navigateur.
- **Compatibilité.** Le mode WebAssembly a été testé avec Microsoft Edge 157. Google Chrome n’était pas installé sur le
  poste de mesure : la compatibilité Chrome est attendue mais non vérifiée ici. Firefox et Safari ne sont pas testés.
- **Mode `file://` bloqué.** Il faut un serveur HTTP, même minimal.

## Limites de mesure

- Les durées dépendent du poste, du navigateur et de la première compilation WebAssembly. Les valeurs publiées sont
  celles du poste de test, le 17/11/2026.
- Les tests ont été exécutés en navigateur sans interface, avec un profil neuf à chaque exécution. Le premier appel
  inclut le téléchargement du modèle depuis `localhost` (ou Hugging Face sur GitHub Pages).
- Un antivirus qui injecte un script dans la page peut ajouter des requêtes sans rapport avec l’application.

## Limites juridiques et documentaires

- **Licence du code de démonstration.** Le dépôt d’origine ne déclare aucune licence. Voir [NOTICE.md](../NOTICE.md).
- **Droits sur les images.** Les trois images de test ont été fournies pour ce dépôt ; leur provenance exacte et leurs
  droits de diffusion doivent être confirmés par le propriétaire avant toute réutilisation externe.
- **Absence de garantie.** Aucun résultat ne doit servir de base à une décision contractuelle, fiscale ou comptable sans
  validation humaine.
