# Simulateur Laffer France

**Le seul simulateur interactif de courbe de Laffer calibré sur les données économiques françaises.**

[laffer.quixotry.app](https://laffer.quixotry.app)

## Ce que c'est

Un outil interactif qui modélise l'impact de réformes fiscales en France, calibré sur la littérature académique :

- **Elasticités** : Lefebvre, Lehmann & Sicsic (2025), Saez et al. (2012)
- **Autofinancement** : Trabandt & Uhlig (2011)
- **Données macro** : INSEE 2024, OCDE Revenue Statistics 2025
- **Croissance** : OCDE (2010), Arnold et al. (2008)

## Fonctionnalités

- Sliders de réforme fiscale (travail, capital, cotisations)
- Choix du modèle d'autofinancement (équilibre partiel vs général)
- Choix du modèle supply-side (effet de niveau vs permanent vs hybride)
- Décomposition en 5 canaux (formalisation, réponse réelle, marge extensive, signal, supply-side) avec niveaux de confiance
- Projection sur 20 ans avec fan chart pessimiste/optimiste
- Episodes historiques de validation (PFU 2017, taxe 75%, ISF)
- Labels de confiance sur chaque paramètre ([Solide] / [Inference] / [Speculation])
- Partage de simulation via URL parametrée

## Architecture du modèle (5 canaux)

1. **Canal 1 — Réponse réelle** [Solide] : autofinancement comportemental (ETI)
2. **Canal 2 — Supply-side** [Inference] : croissance induite par la baisse fiscale
3. **Canal 3 — Marge extensive** [Inference] : retour d'exilés, élargissement de base, création d'entreprises
4. **Canal 4 — Signal** [Speculation] : spread OAT, IDE, classement ITCI
5. **Canal 5 — Formalisation** [Solide] : part instantanée de l'ETI (optimisation → déclaration)

## Stack technique

Next.js 14 · React 18 · TypeScript · Tailwind CSS · Recharts

## Développement

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # Export statique
```

## Audit méthodologique

Le document [AUDIT_METHODOLOGY.md](./AUDIT_METHODOLOGY.md) détaille les formules, sources, hypothèses, limites, et épisodes historiques de calibration.

## Sources principales

- Lefebvre, M.-N., Lehmann, E. et Sicsic, M. (2025). *Scandinavian Journal of Economics*, 127(2), 460-489.
- Trabandt, M. et Uhlig, H. (2011). *Journal of Monetary Economics*, 58(4), 305-327.
- Saez, E., Slemrod, J. et Giertz, S. (2012). *Journal of Economic Literature*, 50(1), 3-50.
- OCDE (2010). Tax Policy Reform and Economic Growth. OECD Tax Policy Studies No. 20.
- Arnold, J. et al. (2008). OECD Economics Department Working Papers No. 620.

## Licence

MIT

## Auteur

Jean-Marie — ENSTA Paris (MAMS)
