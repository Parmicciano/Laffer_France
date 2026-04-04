// ============================================================
// Données macro France 2024 — Sources : INSEE, OCDE, Rexecode
// ============================================================

export const macroData = {
  pib: 2920, // Md€
  prelevementsObligatoires: 1250, // Md€
  taxToGdp: 43.5, // % (OCDE définition large)
  taxToGdpInsee: 42.8, // % (INSEE définition PO : 1250/2920)
  taxToGdpOcde: 34.1, // % moyenne OCDE
  taxToGdpDanemark: 45.2, // % Danemark (1er)
  deficit: -168.6, // Md€
  deficitPct: 5.8, // % du PIB
  dette: 3305, // Md€
  dettePct: 113.2, // % du PIB
  chargeDette: 55, // Md€/an
  recettesPubliques: 1501.6, // Md€
  depensesPubliques: 1670.2, // Md€
  nichesFiscales: 83, // Md€
  nbNiches: 467,
  classementCompetitivite: 38, // sur 38 OCDE (dernier)
  totalOcde: 38,
  actifs: 30_500_000, // emploi total 2024 (INSEE)
};

// ============================================================
// Données emploi et taux PO
// ============================================================

export const EMPLOYMENT = {
  total: 30_500_000,        // INSEE, emploi total 2024
  salarie_prive: 20_000_000, // Pour les calculs cotisations patronales
  population_active: 32_900_000, // INSEE 2024 : emploi (30.5M) + chômeurs (~2.4M, taux 7.2%)
};

export const PO_RATE = {
  insee: 0.428,   // PO au sens français : 1250/2920
  ocde: 0.435,    // Tax-to-GDP OCDE (inclut recettes non-PO)
  used: 0.428,    // UTILISER la définition INSEE pour la cohérence interne
  source_note: "INSEE 2024. Note : l'OCDE donne 43.5% avec une définition plus large.",
};

// ============================================================
// Décomposition des recettes par type d'impôt
// ============================================================

export const recettesParType = {
  cotisationsSociales: 400, // Md€
  csgCrds: 140,
  tva: 200,
  ir: 90,
  is: 60,
  taxesFoncieres: 45,
  dmtg: 20,
  taxesEnergie: 40,
  autres: 255,
};

// ============================================================
// Paramètres Laffer par type d'impôt — CORRIGÉS POST-AUDIT
// ============================================================

export type TaxTypeKey = "travail" | "capital" | "cotisationsPatronales" | "tva";

export interface TaxTypeParams {
  label: string;
  shortLabel: string;
  recettes: number; // Md€
  elasticity: number; // Élasticité de base (ETI)
  optimalRate: number; // τ* = 1/(1+ε) pour l'élasticité de base
  currentEffectiveRate: number;
  selfFinancingRate_ETI: number;  // ε/(1+ε) — équilibre partiel
  selfFinancingRate_TU: number;   // Trabandt & Uhlig EU-14
  maxAdditionalRevenue: number; // % max de recettes en plus si on monte le taux
  position: "left_of_peak" | "left_near_peak" | "near_peak" | "at_or_past_peak";
  positionLabel: string;
  positionDescription: string;
  crossElasticity?: number;
  employmentElasticity?: number;
  color: string;
  sourceElasticity: string;
  // Capital-specific : multiples élasticités selon le modèle choisi
  elasticity_direct?: number;
  elasticity_composite_noCross?: number;
  elasticity_composite_payroll?: number;
  optimalRate_noCross?: number;
  optimalRate_withCross?: number;
  optimalRate_withPayroll?: number;
}

export const taxTypes: Record<TaxTypeKey, TaxTypeParams> = {
  travail: {
    label: "Travail (IR + CSG + cotisations salariales)",
    shortLabel: "Travail",
    recettes: 650,
    // [SOLIDE] Saez, Slemrod & Giertz (2012, JEL 50(1) pp.3-50) :
    //   ETI médiane tous salariés = 0.25 (range 0.12-0.40)
    //   ETI médiane France (population générale) = 0.35
    elasticity: 0.35,
    optimalRate: 0.74, // 1/(1+0.35)
    currentEffectiveRate: 0.65,
    selfFinancingRate_ETI: 0.259,  // 0.35/(1+0.35)
    selfFinancingRate_TU: 0.54,    // Trabandt & Uhlig EU-14
    maxAdditionalRevenue: 0.08,
    position: "left_near_peak",
    positionLabel: "Proche du sommet",
    positionDescription:
      "Taux marginal 57-65% (vérifié Urssaf/CARMF/barème IR). Seuil optimal 74% (élasticité médiane 0.35, Saez et al. 2012). La France est en dessous du sommet mais dans la zone où chaque point de hausse rapporte peu.",
    color: "#f59e0b",
    sourceElasticity: "Saez, Slemrod & Giertz (2012), JEL 50(1), ETI médiane",
  },
  capital: {
    label: "Capital (IS + PFU + IFI + plus-values)",
    shortLabel: "Capital",
    recettes: 120,
    // [SOLIDE] Lefebvre, Lehmann & Sicsic (2025, Scand. J. Econ.) :
    //   ε_direct = 0.50 (résultat principal)
    //   Les composites (0.75, 1.86) dépendent du périmètre choisi
    elasticity: 0.50, // élasticité directe (défaut)
    optimalRate: 0.43, // Résultat principal avec cross-élasticité
    currentEffectiveRate: 0.55,
    selfFinancingRate_ETI: 0.333,  // 0.50/(1+0.50) pour ε_direct
    selfFinancingRate_TU: 0.79,    // Trabandt & Uhlig EU-14
    maxAdditionalRevenue: 0.01,
    position: "at_or_past_peak",
    positionLabel: "DÉPASSÉ",
    positionDescription:
      "Le seuil optimal dépend du modèle : 43% (avec cross-élasticité, Lefebvre et al. 2025), 57% (sans), ou 35% (avec cotisations). La France est à ~55% (IS 25% + PFU 30%). L'abolition du PFL en 2013 l'a prouvé : les recettes ont BAISSÉ. Le PFU 2017 les a restaurées.",
    // Cross-élasticité : seulement utilisée quand capitalElasticityModel = 'direct'
    crossElasticity: 0.05, // Lefebvre et al. : ~10× plus faible que directe
    color: "#ef4444",
    sourceElasticity: "Lefebvre, Lehmann & Sicsic (2025), Scand. J. Econ. 127(2), 460-489",
    // Valeurs par modèle
    elasticity_direct: 0.50,
    elasticity_composite_noCross: 0.75,
    elasticity_composite_payroll: 1.86,
    optimalRate_noCross: 0.57,
    optimalRate_withCross: 0.43,
    optimalRate_withPayroll: 0.35,
  },
  cotisationsPatronales: {
    label: "Cotisations patronales",
    shortLabel: "Cotisations",
    recettes: 280,
    // [SOLIDE] Crépon & Desplatz (2001), allègements Juppé
    elasticity: 0.40,
    optimalRate: 0.71, // 1/(1+0.40)
    currentEffectiveRate: 0.45,
    selfFinancingRate_ETI: 0.286, // 0.40/(1+0.40)
    selfFinancingRate_TU: 0.60,   // Trabandt & Uhlig (estimation)
    maxAdditionalRevenue: 0.04,
    position: "near_peak",
    positionLabel: "Proche du sommet",
    positionDescription:
      "Charges patronales de 43-47% du brut (Urssaf). Le coin fiscal total (employeur → net salarié) atteint 55-62%. Avec la perte des aides sociales, le taux marginal implicite monte à ~60% pour les bas revenus (INSEE Analyses n.32).",
    employmentElasticity: -0.3,
    color: "#3b82f6",
    sourceElasticity: "Crépon & Desplatz (2001) ; France Stratégie, évaluations CICE",
  },
  tva: {
    label: "TVA / Consommation",
    shortLabel: "TVA",
    recettes: 200,
    elasticity: 0.15,
    optimalRate: 0.87,
    currentEffectiveRate: 0.20,
    selfFinancingRate_ETI: 0.130, // 0.15/(1+0.15)
    selfFinancingRate_TU: 0.20,
    maxAdditionalRevenue: 0.35,
    position: "left_of_peak",
    positionLabel: "Large marge",
    positionDescription:
      "Pas de pic de Laffer pour la TVA dans les modèles standards (Trabandt & Uhlig 2011, confirmé). C'est l'impôt le moins distorsif — de nombreux pays sont à 25% (Danemark, Suède) ou 27% (Hongrie).",
    color: "#10b981",
    sourceElasticity: "Estimation consensus (ε ≈ 0.15). Pas de source directe unique.",
  },
};

// ============================================================
// Exemples concrets — cas réels
// ============================================================

export interface ConcreteExample {
  title: string;
  description: string;
  marginalRate: number;
  netPerEuro: number;
  optimalRate: number;
  verdict: string;
  category: "travail" | "capital" | "cotisations" | "energie";
}

export const concreteExamples: ConcreteExample[] = [
  {
    title: "Médecin libéral (BNC 150k€)",
    description:
      "IR au TMI 41% + CSG 9.7% + cotisations CARMF/URSSAF ~31.5% = taux marginal de 57-62%. Sur chaque euro en plus, il garde 38 à 43 centimes. Résultat : beaucoup travaillent 3-4 jours au lieu de 5.",
    marginalRate: 0.60,
    netPerEuro: 0.40,
    optimalRate: 0.74,
    verdict: "À 81% du seuil optimal (74%). Les libéraux au TMI 45% (>180k) montent à 65%, soit 88% du seuil.",
    category: "travail",
  },
  {
    title: "Caissier → chef de caissier",
    description:
      "Le net augmente de 200€/mois, mais il perd ~80€ de prime d'activité et ~40€ d'APL. Gain réel : ~80€/mois pour 2x plus de responsabilités. Taux marginal effectif : ~60% (INSEE Analyses n.32).",
    marginalRate: 0.60,
    netPerEuro: 0.40,
    optimalRate: 0.74,
    verdict: "Trappe à promotion : 60% du gain est absorbé par impôts + perte d'aides (INSEE)",
    category: "cotisations",
  },
  {
    title: "Essence SP95 à la pompe",
    description:
      "Sur ~1,78€/L : accise (TICPE) 67-69 cts + TVA sur le produit 13 cts + TVA sur l'accise 13-14 cts. Total taxes : 57-60% du prix final (FIPECO, prix-carburant.eu).",
    marginalRate: 0.58,
    netPerEuro: 0.42,
    optimalRate: 0.80,
    verdict: "Élevé mais sous le seuil — la demande de carburant est peu élastique (ε ≈ 0.25)",
    category: "energie",
  },
  {
    title: "Actionnaire (IS + PFU combinés)",
    description:
      "100€ de bénéfice → IS 25% = 75€ distribuables → PFU 30% = -22.50€ → net 52.50€. Taux combiné : 47.5%. Le seuil de Lefebvre et al. (2025) dépend du modèle choisi (35%-57%).",
    marginalRate: 0.475,
    netPerEuro: 0.525,
    optimalRate: 0.43,
    verdict: "Position relative au sommet variable selon le modèle (τ*=35% à 57%). Prouvé empiriquement en 2013 (recettes en baisse).",
    category: "capital",
  },
];

// ============================================================
// Données historiques — épisodes fiscaux français
// ============================================================

export interface HistoricalEvent {
  year: number;
  title: string;
  description: string;
  type: "hausse" | "baisse";
  impact: string;
  recettesAvant?: string;
  recettesApres?: string;
  verdict: "laffer_confirme" | "laffer_infirme" | "neutre";
  verdictLabel: string;
  details: string;
}

export const historicalEvents: HistoricalEvent[] = [
  {
    year: 1982,
    title: "Création de l'IGF (Impôt sur les Grandes Fortunes)",
    description: "Mitterrand crée l'IGF, ancêtre de l'ISF.",
    type: "hausse",
    impact: "Début de l'exode fiscal des grandes fortunes",
    verdict: "laffer_confirme",
    verdictLabel: "Laffer confirmé",
    details:
      "Les premiers départs de contribuables fortunés commencent dès la création de l'IGF. La fuite des capitaux s'amorce.",
  },
  {
    year: 1986,
    title: "Suppression de l'IGF par Chirac",
    description: "Le gouvernement Chirac supprime l'IGF.",
    type: "baisse",
    impact: "Retour de capitaux, amélioration de l'attractivité",
    verdict: "laffer_confirme",
    verdictLabel: "Laffer confirmé",
    details:
      "La suppression entraîne un retour de capitaux et une amélioration de l'attractivité fiscale de la France.",
  },
  {
    year: 1988,
    title: "Recréation de l'ISF par Mitterrand",
    description: "L'ISF remplace l'IGF — retour de la taxation du patrimoine.",
    type: "hausse",
    impact: "Reprise des départs : ~19 000 foyers émigrés sur la durée",
    recettesAvant: "~5 Md€/an (ISF brut)",
    recettesApres: "Perte nette estimée ~3,7 Md€/an (Rexecode)",
    verdict: "laffer_confirme",
    verdictLabel: "Laffer confirmé",
    details:
      "L'ISF rapporte ~5 Md€ bruts mais coûte ~3,7 Md€/an en perte de base taxable (exil fiscal, départ de capitaux). Bilan net quasi nul ou négatif selon les estimations.",
  },
  {
    year: 2012,
    title: "Taxe à 75% sur les hauts revenus (Hollande)",
    description:
      "François Hollande propose puis met en place une contribution exceptionnelle de 75% sur les revenus > 1M€.",
    type: "hausse",
    impact: "Exode médiatisé (Depardieu, entrepreneurs), recul de l'investissement",
    recettesAvant: "Objectif : 500 M€/an",
    recettesApres: "~260 M€ collectés avant annulation",
    verdict: "laffer_confirme",
    verdictLabel: "Laffer confirmé",
    details:
      "La taxe est censurée par le Conseil Constitutionnel puis reformulée. Elle rapporte bien moins que prévu et provoque un signal désastreux. Abandonnée en 2015.",
  },
  {
    year: 2013,
    title: "Abolition du PFL → hausse impôt capital",
    description:
      "Le Prélèvement Forfaitaire Libératoire (PFL) est supprimé — les revenus du capital passent au barème progressif.",
    type: "hausse",
    impact: "Hausse du taux effectif sur les dividendes → BAISSE des recettes",
    recettesAvant: "Recettes dividendes stables",
    recettesApres: "Baisse significative des distributions",
    verdict: "laffer_confirme",
    verdictLabel: "Laffer confirmé (Lefebvre et al. 2025)",
    details:
      "Lefebvre, Lehmann & Sicsic (2025, Scand. J. Econ.) montrent que la France était déjà au sommet de la courbe de Laffer sur le capital. La hausse du taux a réduit les distributions de dividendes et fait BAISSER les recettes totales.",
  },
  {
    year: 2017,
    title: "Remplacement ISF par IFI + création PFU 30%",
    description:
      "Macron remplace l'ISF par l'IFI (immobilier seul) et instaure le PFU (flat tax 30% sur les revenus du capital).",
    type: "baisse",
    impact: "Retour de capitaux, hausse des investissements, hausse des recettes sur le capital",
    recettesAvant: "ISF : ~5 Md€ ; impôt capital total : ~100 Md€",
    recettesApres: "IFI : ~2 Md€ ; mais recettes capital totales en hausse grâce au PFU",
    verdict: "laffer_confirme",
    verdictLabel: "Laffer confirmé",
    details:
      "Malgré la baisse du taux nominal (30% flat vs barème progressif), les recettes sur le capital augmentent grâce au dynamisme des distributions et au retour de capitaux. Le rapport France Stratégie 2021 le confirme.",
  },
  {
    year: 2024,
    title: "Contribution exceptionnelle sur les hauts revenus",
    description:
      "Le gouvernement Barnier propose une contribution exceptionnelle sur les hauts revenus et les grandes entreprises.",
    type: "hausse",
    impact: "Signal négatif, départs annoncés, incertitude fiscale",
    verdict: "neutre",
    verdictLabel: "Trop tôt pour juger",
    details:
      "L'instabilité fiscale chronique (4ème changement majeur en 12 ans) est elle-même un facteur de fuite. L'effet Laffer agit aussi par le canal de l'incertitude.",
  },
];

// ============================================================
// Comparaisons internationales
// ============================================================

export const internationalComparison = [
  { country: "Danemark", taxToGdp: 45.2 },
  { country: "France", taxToGdp: 43.5 },
  { country: "Belgique", taxToGdp: 42.9 },
  { country: "Italie", taxToGdp: 42.5 },
  { country: "Autriche", taxToGdp: 42.0 },
  { country: "Suède", taxToGdp: 41.3 },
  { country: "Allemagne", taxToGdp: 37.6 },
  { country: "Pays-Bas", taxToGdp: 36.8 },
  { country: "Royaume-Uni", taxToGdp: 34.3 },
  { country: "Moyenne OCDE", taxToGdp: 34.1 },
  { country: "Espagne", taxToGdp: 33.6 },
  { country: "Canada", taxToGdp: 33.2 },
  { country: "Japon", taxToGdp: 32.0 },
  { country: "Suisse", taxToGdp: 27.8 },
  { country: "USA", taxToGdp: 27.7 },
  { country: "Irlande", taxToGdp: 21.7 },
];

// ============================================================
// Boost de croissance supply-side — AVEC AVERTISSEMENT
// ============================================================

export const GROWTH_BOOST = {
  // Dérivation : ranking qualitatif OCDE (2010) et Arnold et al. (2008) :
  //   - Impôts sur les sociétés/capital : les plus nocifs pour la croissance → 0.30
  //   - IR/travail : modérément nocifs → 0.10
  //   - Cotisations sociales : intermédiaire → 0.15
  // Le ranking ordinal EST robuste (confirmé par Acosta-Ormaechea & Yoo 2012,
  // Xing 2012), mais les magnitudes cardinales sont notre inférence.
  travail: 0.10,
  capital: 0.30,
  cotisationsPatronales: 0.15,
  source: "Interprétation des résultats OCDE (2010) et Arnold et al. (2008)",
  confidence: "INFÉRENCE — ces coefficients sont extrapolés du ranking qualitatif, pas directement publiés",
  note: "Le ranking est robuste (IS > IR > consommation), les magnitudes sont incertaines",
};

// ============================================================
// Pouvoir d'achat — données de base
// ============================================================

export const PURCHASING_POWER = {
  population: 68_000_000,              // INSEE 2024
  foyersFiscaux: 40_000_000,          // INSEE 2024
  salaireNetAnnuelMoyen: 30_000,      // €/an (INSEE 2024, tous salariés)
  newJobNetAnnualSalary: 21_000,     // €/an (P25 distribution, INSEE) — emplois créés en majorité bas salaires
  wageShareOfGDP: 0.50,               // part masse salariale / PIB
  wageGDPElasticity: 0.70,            // Verdugo (2016), INSEE Analyses : 0.6-0.8
  cotisPassthroughShortTerm: 0.40,    // Crépon & Desplatz (2001) : 30-50% court terme
  cotisPassthroughLongTerm: 0.70,     // 60-80% long terme
  cotisPassthroughPhaseInYears: 5,    // transition court → long terme
  capitalBroadDiffusionRate: 0.10,    // conservateur : 10% du gain capital se diffuse large
  inflationRate: 0.02,                // baseline 2%
};

// ============================================================
// Sources académiques — CORRIGÉES
// ============================================================

export const sources = [
  {
    authors: "Saez, E., Slemrod, J. & Giertz, S.",
    year: 2012,
    title: "The Elasticity of Taxable Income with Respect to Marginal Tax Rates: A Critical Review",
    journal: "Journal of Economic Literature, 50(1), 3-50",
  },
  {
    authors: "Lefebvre, M., Lehmann, E. & Sicsic, M.",
    year: 2025,
    title: "Estimating the Laffer Tax Rate on Capital Income",
    journal: "Scandinavian Journal of Economics, 127(2), 460-489",
  },
  {
    authors: "Trabandt, M. & Uhlig, H.",
    year: 2011,
    title: "The Laffer Curve Revisited",
    journal: "Journal of Monetary Economics, 58(4), 305-327",
  },
  {
    authors: "Trabandt, M. & Uhlig, H.",
    year: 2012,
    title: "How Do Laffer Curves Differ Across Countries?",
    journal: "IFDP 1048, Federal Reserve Board",
  },
  {
    authors: "Crépon, B. & Desplatz, R.",
    year: 2001,
    title: "Une nouvelle évaluation des effets des allègements de charges sociales sur les bas salaires",
    journal: "Économie et Statistique, 348(1), 3-24",
  },
  {
    authors: "Arnold, J., Brys, B., Heady, C., Johansson, Å., Schwellnus, C. & Vartia, L.",
    year: 2008,
    title: "Tax Policy for Economic Recovery and Growth",
    journal: "OECD Economics Department Working Papers, No. 620",
  },
  {
    authors: "OCDE",
    year: 2010,
    title: "Tax Policy Reform and Economic Growth",
    journal: "OECD Tax Policy Studies, No. 20",
  },
  {
    authors: "Lundberg, J.",
    year: 2017,
    title: "The Laffer Curve for High Incomes",
    journal: "Uppsala University Working Paper",
  },
  {
    authors: "OCDE",
    year: 2025,
    title: "Revenue Statistics 2025",
    journal: "",
  },
  {
    authors: "INSEE",
    year: 2024,
    title: "Comptes nationaux 2024",
    journal: "",
  },
  {
    authors: "Rexecode",
    year: 2020,
    title: "Études ISF et exil fiscal",
    journal: "",
  },
];
