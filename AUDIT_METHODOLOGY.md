# Simulateur Laffer France --- Document d'audit

**Version** : v2.1 (supply-side + calibration historique)
**Date de generation** : Avril 2026
**Objet** : Documentation complete des sources, formules et hypotheses pour audit externe

---

## I. Donnees macro France 2024

| Variable | Valeur | Source |
|----------|--------|--------|
| PIB | 2 920 Md EUR | INSEE, Comptes nationaux 2024 |
| Prelevements obligatoires | 1 250 Md EUR (42.8% PIB) | OCDE Revenue Statistics 2025 |
| Taux PO/PIB | 43.5% | OCDE 2025 (2e mondial) |
| Moyenne OCDE | 34.1% | OCDE 2025 |
| Deficit public | -168.6 Md EUR (5.8% PIB) | INSEE 2024 |
| Dette publique | 3 305 Md EUR (113.2% PIB) | INSEE 2024 |
| Charge de la dette | 55 Md EUR/an | Projet de loi de finances 2024 |
| Recettes publiques totales | 1 501.6 Md EUR | INSEE 2024 |
| Depenses publiques | 1 670.2 Md EUR | INSEE 2024 |
| Niches fiscales | 83 Md EUR (467 dispositifs) | DGFiP, Voies et Moyens 2024 |
| Classement competitivite fiscale | 38/38 OCDE (dernier) | Tax Foundation, ITCI 2024 |
| Emploi total | 30.5 millions | INSEE, Enquete Emploi 2024 |
| PIB par emploi | ~95 700 EUR | Calcul : 2920e9 / 30.5e6 |
| Croissance tendancielle | 1.1%/an | INSEE, croissance potentielle |

---

## II. Recettes par type d'impot

| Type | Recettes (Md EUR) | Elasticite (epsilon) | Taux optimal (tau*) | Taux effectif actuel | Source elasticite |
|------|-------------------|---------------------|--------------------|--------------------|-------------------|
| Travail (IR+CSG+cotis. salariales) | 650 | 0.35 | 74% | 65% | Saez, Slemrod & Giertz (2012), ETI mediane France |
| Capital (IS+PFU+IFI+PV) | 120 | 0.77 | 57% | 55% | Lefebvre, Lehmann & Sicsic (2024) |
| Cotisations patronales | 280 | 0.50 | 67% | 45% | Cahuc & Carcillo (2014) |
| TVA | 200 | 0.15 | ~87% (theorique) | 20% | Keen & Lockwood (2010) |

---

## III. Formules du modele

### III.1 Courbe de Laffer

**Fonction de revenu** :
```
R(tau) = tau x B0 x (1 - tau)^epsilon
```
- `tau` : taux d'imposition effectif
- `B0` : base taxable potentielle (normalisee)
- `epsilon` : elasticite de la base taxable au taux net de retention (ETI)

**Taux optimal** (derivation analytique) :
```
dR/dtau = 0
=> (1-tau) = epsilon x tau
=> tau* = 1 / (1 + epsilon)
```

**Taux d'autofinancement derive de l'elasticite** :
```
selfFinancingRate = epsilon / (1 + epsilon)
```
- Travail : 0.35 / 1.35 = 0.259 (26%)
- Capital : 0.77 / 1.77 = 0.435 (43%)
- Cotisations : 0.50 / 1.50 = 0.333 (33%)

### III.2 Calibration sur episodes historiques

**Methode** : resolution numerique de epsilon a partir des donnees observees.
```
R_new / R_old = (tau_new / tau_old) x ((1 - tau_new) / (1 - tau_old))^epsilon
=> epsilon = ln(revenue_ratio / rate_ratio) / ln(complement_ratio)
```

**Episodes utilises** :

| Episode | Taux avant | Taux apres | Ratio recettes observe | Epsilon calibre |
|---------|-----------|-----------|----------------------|-----------------|
| PFU 2017 (capital) | 45% | 30% | 0.90 | Variable |
| PFL 2013 (capital, hausse) | 21% | 45% | 0.85 | Variable |
| ISF long terme (capital) | 1.5% | 0% | 0.26 | Variable |
| Taxe 75% (travail, hausse) | 50% | 75% | 0.78 | Variable |

**Agregation** : mediane des epsilons calibres par type, avec intervalle [min, max].

### III.3 Canal 1 --- Demande (keynesien, court terme)

Perte brute mecanique :
```
grossCut = SUM( recettes_type x cutPercent / 100 )
```

Autofinancement comportemental avec phase-in :
```
behavioralRecovery = SUM( cutMd_type x selfFinRate_type x behaviorPhaseIn[year] x scaleFactor )

behaviorPhaseIn = [0.25, 0.50, 0.75, 1.0]  (annees 1 a 4)
selfFinRate = epsilon / (1 + epsilon)        (derive de l'elasticite)
```

Justification du phase-in : les effets comportementaux (retour d'exiles, creation d'emploi, reallocation de capital) mettent 2-5 ans a se materialiser. An 1 = 25% seulement (effet mecanique : moins d'optimisation fiscale immediate).

### III.4 Canal 2 --- Offre (supply-side, permanent)

**Source principale** : OCDE (2010) "Tax Policy Reform and Economic Growth", Arnold et al. (2008)

L'argent non preleve est investi, augmentant le stock de capital productif et le taux de croissance en PERMANENCE.

```
additionalGrowthRate = SUM( (cutMd / GDP) x growthBoostPerGDPPoint[type] x scaleFactor )
```

**Boost de croissance par point de PIB de coupe** (OCDE 2010, fourchette basse) :

| Type d'impot | Boost (pp/an par pt PIB) | Justification OCDE |
|-------------|------------------------|-------------------|
| Travail (IR/CSG) | 0.10 | Moins distorsif, effet offre de travail modere |
| Capital (IS/PFU) | 0.30 | Le plus nocif pour la croissance (OCDE ranking #1) |
| Cotisations patronales | 0.15 | Intermediaire, effet cout du travail |

**PIB reforme** (compose annee par annee) :
```
Pour chaque annee yr = 1 a Y :
  growthPhaseIn = [0.20, 0.50, 0.80, 1.0][yr-1] si yr <= 4, sinon 1.0
  yearGrowthRate = baseGrowthRate + additionalGrowthRate x growthPhaseIn
  GDP_reform *= (1 + yearGrowthRate)

deltaGDP = GDP_reform - GDP_baseline
```

Difference fondamentale avec le canal 1 : le canal 2 change la PENTE de croissance (pas juste le niveau). C'est ce qui permet le crossover a long terme.

### III.5 Recettes induites par la croissance

```
growthInducedRevenue = deltaGDP x poTaxRate

poTaxRate = 0.435 (taux PO/PIB France, OCDE)
```

Le PIB additionnel genere des recettes fiscales au taux moyen de prelevement.

### III.6 Recettes totales avec reforme

```
revenueReform = revenueBaseline - activeCut + behavioralRecovery + growthInducedRevenue

autofinancement_total(%) = (behavioralRecovery + growthInducedRevenue) / activeCut x 100
```

### III.7 Emplois --- Loi d'Okun adaptee France

```
gdpGrowthPct = (deltaGDP / GDP_base) x 100
jobs = totalEmployment x (gdpGrowthPct x okunCoefficient / 100)

okunCoefficient = 0.4     (1pt PIB -> 0.4pt emploi)
totalEmployment = 30 500 000
```

**Verification CICE** : 20 Md EUR -> mult 0.8 -> deltaGDP ~16 Md -> growth = 0.55% -> emplois = 30.5M x 0.55% x 0.4 = ~67 000. Estimation officielle CICE : 100 000 - 300 000. Notre modele donne le bas de la fourchette.

### III.8 Investissement induit

```
yearInvestment = SUM( deltaGDP_type x investmentShare[type] )
```

| Type | Part investissement | Justification |
|------|-------------------|---------------|
| Travail | 20% | Menages : investissement modere |
| Capital | 40% | IS reduit -> retention benefices -> fort investissement |
| Cotisations | 25% | Intermediaire |

### III.9 Scenarios de confiance (fan chart)

Trois scenarios scalent les parametres :

| Scenario | scaleFactor | Signification |
|----------|-----------|---------------|
| Pessimiste | 0.50 | Multiplicateurs divises par 2 |
| Central | 1.00 | Tel quel |
| Optimiste | 1.50 | Multiplicateurs x 1.5 |

---

## IV. Episodes historiques de validation

### Episode 1 --- PFU 2017 (Flat Tax 30% + IFI)

- **Reforme** : Prelevement Forfaitaire Unique 30% remplace bareme progressif. ISF -> IFI.
- **Donnees** (France Strategie 2020, 2023 ; Boursorama 2018) :
  - Dividendes : 13.6 Md EUR (moy. 2013-2017) -> 23.2 Md EUR (2019) = **+62%**
  - Cout brut estime initial : 1.9 Md EUR (Bercy)
  - Cout reel : ~0.9 Md EUR (Les Echos)
  - France Strategie 2023 : "le cout budgetaire serait annule les premieres annees"
- **Verdict** : Taux reduit MAIS recettes en hausse grace a l'elargissement de la base

### Episode 2 --- Abolition PFL 2013

- **Reforme** : Dividendes au bareme progressif IR au lieu du PFL (~20%)
- **Donnees** (Lefebvre et al. 2024, Bach et al. 2019) :
  - Dividendes : 22 Md EUR (2012) -> 13 Md EUR (2013) = **-41%**
  - Recettes totales sur le capital : EN BAISSE malgre taux en hausse
- **Verdict** : Preuve empirique directe de l'effet Laffer sur le capital francais

### Episode 3 --- Taxe a 75% (2012-2014)

- **Reforme** : Contribution exceptionnelle >1M EUR au taux de 75%
- **Donnees** :
  - Objectif : 500 M EUR/an
  - Recettes reelles : 260 M EUR = **52% du projete**
  - Abandon en 2015
- **Verdict** : Au-dela de ~70% de taux marginal, l'elasticite explose

### Episode 4 --- CICE (2013-2019)

- **Reforme** : Credit d'impot ~20 Md EUR/an -> baisse de cotisations
- **Donnees** (France Strategie, OFCE, LIEPP) :
  - Emplois crees : 100 000 - 300 000
  - Cout par emploi : 67 000 - 200 000 EUR/an
  - Effet PIB : 0.5-1 point cumule
- **Verdict** : Effet emploi reel, autofinancement ~25-50%

### Episode 5 --- ISF (1982-2017, 35 ans)

- **Donnees** (Rexecode) :
  - 19 000 departs de contribuables
  - Perte fiscale directe : 2.5 Md EUR/an
  - Perte de VA entreprises : 6 Md EUR
  - Pertes fiscales associees : 1.2 Md EUR/an
  - Recette brute ISF : 5 Md EUR/an
  - **Autofinancement de la suppression : 74%** ((2.5+1.2)/5)
- **Verdict** : L'ISF rapportait 5 Md bruts mais coutait 3.7 Md en externalites

---

## V. Hypotheses et limites

### Hypotheses principales

1. **Croissance tendancielle** : 1.1%/an (INSEE). Conservateur.
2. **Taux PO/PIB marginal** : 43.5% (OCDE). Le PIB additionnel genere des recettes au taux moyen.
3. **Phase-in de la croissance** : 4 ans (20% -> 50% -> 80% -> 100%). L'investissement met du temps a produire du capital.
4. **Phase-in de l'autofinancement** : 4 ans (25% -> 50% -> 75% -> 100%). Les comportements s'ajustent graduellement.
5. **Depenses publiques** : croissent a 2%/an (inflation). Pas de coupes de depenses modelisees.
6. **Taux d'interet dette** : 2.5% fixe. Spread reduit si la trajectoire s'ameliore.

### Limites connues

1. **Le modele ne capture pas la marge extensive** (creation/destruction d'entreprises, entree/sortie du marche du travail). Seulement la marge intensive (ajustement des quantites).
2. **Les elasticites sont des moyennes**. L'elasticite au sommet de la distribution (hauts revenus) est significativement plus elevee.
3. **Le canal supply-side est le plus incertain**. Le boost de croissance permanent est calibre sur la fourchette basse de l'OCDE (2010), mais la realite pourrait etre plus haute ou plus basse.
4. **Horizon 20 ans** : au-dela de 5 ans, l'incertitude est substantielle. Les projections sont des extrapolations, pas des predictions.
5. **Pas de modele d'equilibre general**. Les interactions entre types d'impots sont simplifiees (cross-elasticite capital->travail = 0.15).

---

## VI. References completes

### Elasticites et courbe de Laffer

- Saez, E., Slemrod, J. & Giertz, S. (2012). "The Elasticity of Taxable Income with Respect to Marginal Tax Rates: A Critical Review." *Journal of Economic Literature* 50(1), pp.3-50.
- Lefebvre, M.-N., Lehmann, E. & Sicsic, M. (2024). "Estimating the Laffer Tax Rate on Capital Income: Cross-Base Responses Matter!" *CEPR Discussion Paper* / *IZA DP* 16112. Publie dans *Scandinavian Journal of Economics* (2025).
- Trabandt, M. & Uhlig, H. (2011). "The Laffer Curve Revisited." *Journal of Monetary Economics* 58(4), pp.305-327.
- Trabandt, M. & Uhlig, H. (2012). "How Do Laffer Curves Differ Across Countries?" *FRB IFDP* 1048 / *NBER WP* 17862.
- Lundberg, J. (2017). "The Laffer Curve for High Incomes." Uppsala University Working Paper 2017:9.
- Saez, E. (2004). "Reported Incomes and Marginal Tax Rates, 1960-2000." *Tax Policy and the Economy* 18, pp.117-173.
- Cahuc, P. & Carcillo, S. (2014). "The Detaxation of Overtime Hours." *Journal of Public Economics* 112, pp.23-44.
- Keen, M. & Lockwood, B. (2010). "The Value Added Tax: Its Causes and Consequences." *Journal of Development Economics* 92(2), pp.138-151.

### Modele de croissance et supply-side

- OCDE (2010). "Tax Policy Reform and Economic Growth." *OECD Tax Policy Studies* No. 20.
- Arnold, J. et al. (2008). "Taxation and Economic Growth." *OECD Economics Department Working Papers* No. 620.
- Romer, C. & Romer, D. (2010). "The Macroeconomic Effects of Tax Changes." *American Economic Review* 100(3), pp.763-801.
- Blanchard, O. & Leigh, D. (2013). "Growth Forecast Errors and Fiscal Multipliers." *American Economic Review* 103(3), pp.117-120.

### Donnees France

- INSEE (2024). Comptes nationaux annuels.
- OCDE (2025). Revenue Statistics.
- France Strategie (2020). "Comite d'evaluation des reformes de la fiscalite du capital --- 2e rapport."
- France Strategie (2023). "Comite d'evaluation --- 4e rapport."
- Rexecode (2020). "Etudes ISF et exil fiscal."
- IPP (Institut des politiques publiques). Baremes IPP, modele TAXIPP. https://www.ipp.eu/baremes-ipp/
- DGFiP. Voies et Moyens, annexe au PLF 2024.
- Tax Foundation. International Tax Competitiveness Index 2024.

### Episodes historiques

- PFU 2017 : France Strategie (2020, 2023) ; Boursorama (2018) ; Les Echos.
- PFL 2013 : Bach, L. et al. (2019) ; Lefebvre, Lehmann & Sicsic (2024).
- Taxe 75% : Donnees publiques recettes fiscales ; presse.
- CICE : France Strategie ; OFCE ; LIEPP (evaluation CICE).
- ISF : Rexecode ; Cour des Comptes ; rapports parlementaires.

---

## VII. Code source

Le moteur de calcul est dans `src/utils/calculations.ts`. Les donnees dans `src/data/economicData.ts`. Le code est open source et auditable.
