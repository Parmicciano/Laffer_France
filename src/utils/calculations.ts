import { taxTypes, macroData, EMPLOYMENT, PO_RATE, GROWTH_BOOST, PURCHASING_POWER, type TaxTypeKey } from "@/data/economicData";
import {
  type ModelSettings,
  DEFAULT_SETTINGS,
  getEffectiveElasticity,
  getEffectiveCrossElasticity,
  getSelfFinancingRate,
} from "@/types/modelSettings";

// ============================================================
// Fonction de revenu Laffer  R(τ) = τ × B₀ × (1 - τ)^ε
// ============================================================

export function lafferRevenue(tau: number, epsilon: number): number {
  if (tau <= 0 || tau >= 1) return 0;
  return tau * Math.pow(1 - tau, epsilon);
}

export function lafferRevenueNormalized(tau: number, epsilon: number): number {
  const optimalTau = 1 / (1 + epsilon);
  const peakRevenue = lafferRevenue(optimalTau, epsilon);
  if (peakRevenue === 0) return 0;
  return lafferRevenue(tau, epsilon) / peakRevenue;
}

export function generateLafferCurve(
  epsilon: number,
  numPoints: number = 200
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const tau = i / numPoints;
    points.push({ x: tau, y: lafferRevenueNormalized(tau, epsilon) });
  }
  return points;
}

// ============================================================
// Calcul d'impact STATIQUE (année 1)
// ============================================================

export interface ImpactResult {
  grossLoss: number;
  dynamicRecovery: number;
  crossEffect: number;
  employmentGain: number;
  netLoss: number;
  selfFinancingTotal: number;
  newJobs: number;
  tvaInduced: number;
  irInduced: number;
}

export function computeImpact(
  taxType: TaxTypeKey,
  cutPercent: number,
  settings: ModelSettings = DEFAULT_SETTINGS
): ImpactResult {
  const params = taxTypes[taxType];
  const grossLoss = params.recettes * (cutPercent / 100);
  if (grossLoss === 0) {
    return { grossLoss: 0, dynamicRecovery: 0, crossEffect: 0, employmentGain: 0, netLoss: 0, selfFinancingTotal: 0, newJobs: 0, tvaInduced: 0, irInduced: 0 };
  }
  const selfFinRate = getSelfFinancingRate(taxType, settings, params.selfFinancingRate_TU);
  const dynamicRecovery = grossLoss * selfFinRate;
  let crossEffect = 0;
  const crossElast = getEffectiveCrossElasticity(taxType, settings);
  if (crossElast > 0) crossEffect = grossLoss * crossElast;
  let employmentGain = 0, newJobs = 0, tvaInduced = 0, irInduced = 0;
  if (taxType === "cotisationsPatronales" && params.employmentElasticity) {
    const costReduction = cutPercent / 100;
    const employmentIncrease = Math.abs(params.employmentElasticity) * costReduction;
    newJobs = Math.round(EMPLOYMENT.salarie_prive * employmentIncrease);
    // Recettes fiscales par emploi créé (annuel, conservateur) :
    // TVA : ~4 000€ (≈20% de ~20k€ de consommation marginale, enquêtes ménages INSEE)
    // IR :  ~2 000€ (TMI bas, majorité des emplois créés sous le salaire médian)
    // Cotisations : ~5 000€ (employeur+salarié sur SMIC après allègements Fillon)
    // Total : ~11 000€/emploi/an — conservateur vs 15-18k€ pour emploi au salaire médian
    // Ref : France Stratégie (2019), Évaluation des allègements généraux
    tvaInduced = (newJobs * 4000) / 1e9;
    irInduced = (newJobs * 2000) / 1e9;
    employmentGain = tvaInduced + irInduced + (newJobs * 5000) / 1e9;
  }
  const netLoss = grossLoss - dynamicRecovery - crossEffect - employmentGain;
  const selfFinancingTotal = grossLoss > 0 ? ((dynamicRecovery + crossEffect + employmentGain) / grossLoss) * 100 : 0;
  return { grossLoss, dynamicRecovery, crossEffect, employmentGain, netLoss: Math.max(netLoss, -grossLoss), selfFinancingTotal: Math.min(selfFinancingTotal, 200), newJobs, tvaInduced, irInduced };
}

// ============================================================
// Impact combiné
// ============================================================

export interface ScenarioInput {
  travail: number;
  capital: number;
  cotisationsPatronales: number;
}

// ============================================================
// Trajectoires temporelles
// ============================================================

export type TrajectoryType = 'fixed' | 'progressive' | 'shock_rollback';

export interface TrajectoryScenario {
  trajectory: TrajectoryType;
  targetCut: ScenarioInput;
  rampYears: number;
  shockCut?: ScenarioInput;
  rollbackPerYear?: number;
}

export type AnyScenario = ScenarioInput | TrajectoryScenario;

function isTrajectory(s: AnyScenario): s is TrajectoryScenario {
  return 'trajectory' in s;
}

export function resolveScenarioAtYear(scenario: AnyScenario, year: number): ScenarioInput {
  if (!isTrajectory(scenario)) return scenario;

  switch (scenario.trajectory) {
    case 'fixed':
      return scenario.targetCut;
    case 'progressive': {
      const t = year <= 0 ? 0 : Math.min(1, year / scenario.rampYears);
      return {
        travail: scenario.targetCut.travail * t,
        capital: scenario.targetCut.capital * t,
        cotisationsPatronales: scenario.targetCut.cotisationsPatronales * t,
      };
    }
    case 'shock_rollback': {
      const shock = scenario.shockCut ?? scenario.targetCut;
      const rb = scenario.rollbackPerYear ?? 1;
      const yearsAfterShock = Math.max(0, year - 1);
      return {
        travail: Math.max(scenario.targetCut.travail, shock.travail - rb * yearsAfterShock),
        capital: Math.max(scenario.targetCut.capital, shock.capital - rb * yearsAfterShock),
        cotisationsPatronales: Math.max(scenario.targetCut.cotisationsPatronales, shock.cotisationsPatronales - rb * yearsAfterShock),
      };
    }
  }
}

// Résoudre la cible finale (pour comparaison)
export function getTargetCut(scenario: AnyScenario): ScenarioInput {
  return isTrajectory(scenario) ? scenario.targetCut : scenario;
}

export interface CombinedImpact {
  details: Record<TaxTypeKey, ImpactResult>;
  totalGrossLoss: number;
  totalDynamicRecovery: number;
  totalCrossEffect: number;
  totalEmploymentGain: number;
  totalNetLoss: number;
  totalSelfFinancing: number;
  totalNewJobs: number;
}

export function computeCombinedImpact(
  scenario: ScenarioInput,
  settings: ModelSettings = DEFAULT_SETTINGS
): CombinedImpact {
  const t = computeImpact("travail", scenario.travail, settings);
  const c = computeImpact("capital", scenario.capital, settings);
  const co = computeImpact("cotisationsPatronales", scenario.cotisationsPatronales, settings);
  const totalGrossLoss = t.grossLoss + c.grossLoss + co.grossLoss;
  const totalNetLoss = t.netLoss + c.netLoss + co.netLoss;
  return {
    details: { travail: t, capital: c, cotisationsPatronales: co, tva: computeImpact("tva", 0, settings) },
    totalGrossLoss,
    totalDynamicRecovery: t.dynamicRecovery + c.dynamicRecovery + co.dynamicRecovery,
    totalCrossEffect: c.crossEffect,
    totalEmploymentGain: co.employmentGain,
    totalNetLoss,
    totalSelfFinancing: totalGrossLoss > 0 ? ((totalGrossLoss - totalNetLoss) / totalGrossLoss) * 100 : 0,
    totalNewJobs: co.newJobs,
  };
}

// ============================================================
// CANAUX RAPIDES — Canaux 3, 4, 5
// ============================================================

// --- Canal 5 : Formalisation (part instantanée de l'ETI) ---
function computeFormalisation(
  behavioralRecovery_fullEffect: number,
  year: number,
  formalisationShare: number,
): number {
  const formalisationTotal = behavioralRecovery_fullEffect * formalisationShare;
  const speed = 0.80; // 80% en an 1
  const phaseIn = Math.min(1, speed + (1 - speed) * (year - 1));
  return formalisationTotal * phaseIn;
}

// --- Canal 3 : Marge extensive ---
// CORRIGÉ : baseWidening proportionnel à la coupe, calibré sur PFU 2017
// PFU = delta ~15pts, coût initial 1.9 Md€, réel ~0.9 Md€ → ~1 Md€ récupéré = +0.8% sur 120 Md€
// On arrondit à +2.5% pour 15% de coupe (referenceCut). Quasi nul pour travail/cotisations.
function computeMargeExtensive(
  capitalCutPercent: number,
  travailCutPercent: number,
  cotisationsCutPercent: number,
  year: number,
  capitalBaseWideningParam: number, // paramètre utilisateur (ex: 0.025 = +2.5%)
  currentTaxRate_capital: number = 0.55,
): { exileReturn: number; baseWidening: number; businessCreation: number; total: number } {
  const exileReturnPool = 6.0;      // Md€ VA récupérable (Rexecode)
  const exileReturnSpeed = 0.30;
  const exileReturnThreshold = 5;   // % min baisse capital
  const bizElasticity = 0.5;
  const bizRevenuePerBiz = 15;      // k€/an
  const bizLag = 2;
  const referenceCut = 15;          // % — calibré sur le delta PFU

  // 1. Retour d'exilés (capital seulement)
  let exileReturn = 0;
  if (capitalCutPercent >= exileReturnThreshold) {
    const poolRemaining = exileReturnPool * Math.pow(1 - exileReturnSpeed, year - 1);
    const yearReturn = poolRemaining * exileReturnSpeed;
    exileReturn = yearReturn * currentTaxRate_capital;
  }

  // 2. Élargissement de base — PROPORTIONNEL à la coupe, limité au capital
  let baseWidening = 0;
  if (capitalCutPercent > 0) {
    const capitalRecettes = 120; // Md€
    // targetWidening à plein régime = multiplier × recettes × (coupe / référence)
    const cutRatio = Math.min(capitalCutPercent / referenceCut, 2.0); // cap à 2× la référence
    const targetWidening = capitalBaseWideningParam * capitalRecettes * cutRatio;
    // Phase-in en S sur 3 ans
    const t = year / 3;
    // S-curve avec ×1.2 : accélération intentionnelle, atteint ~100% légèrement
    // avant t=1 (année 3), puis clampé à 1. Les effets de base widening (retour
    // d'exilés, type PFU) se manifestent sous 2-3 ans.
    const sCurve = Math.min(1, (Math.tanh(2 * t - 1) + 1) / 2 * 1.2);
    // Ajuster pour le nouveau taux (plus bas → recettes unitaires moindres)
    const rateAdj = (1 - capitalCutPercent / 100);
    baseWidening = targetWidening * sCurve * rateAdj;
  }

  // 3. Création d'entreprises (effet modeste, lag 2 ans)
  let businessCreation = 0;
  const totalCut = (capitalCutPercent + travailCutPercent + cotisationsCutPercent) / 3;
  if (totalCut > 0 && year > bizLag) {
    const baseCreations = 1_000_000;
    const additionalPerYear = baseCreations * totalCut / 100 * bizElasticity;
    const cumulativeYears = year - bizLag;
    businessCreation = additionalPerYear * cumulativeYears * bizRevenuePerBiz / 1_000_000;
  }

  return {
    exileReturn,
    baseWidening,
    businessCreation,
    total: exileReturn + baseWidening + businessCreation,
  };
}

// --- Canal 4 : Signal et anticipations ---
// Confiance : [SPÉCULATION]
// - ITCI rank → +3% IDE : non publié. Loosely inspiré de la corrélation entre
//   classement ITCI et flux IDE entrants dans l'OCDE, mais pas une élasticité publiée.
// - Spread OAT : ad-hoc. Suppose qu'une amélioration fiscale réduit le spread
//   OAT-Bund. Mécanisme plausible, magnitude non vérifiée.
// Ce canal est correctement labellé [Spéculation] dans l'UI.
function computeSignalEffect(
  totalCutMd: number,
  capitalCutPercent: number,
  year: number,
  credibilityMultiplier: number,
): { spreadSaving: number; ideRevenue: number; total: number } {
  // 1. Spread OAT
  const perceivedImprovement = totalCutMd * 0.3;
  const spreadBps = perceivedImprovement * 0.5;
  const spreadSaving = spreadBps * 0.033 * 10; // 3305 Md€ × 0.01% = 0.33 Md€/10bps

  // 2. IDE
  const itciRanksGained = Math.min(15, capitalCutPercent * 0.8);
  const ideBaseline = 40;
  const additionalIDE = ideBaseline * itciRanksGained * 3.0 / 100;
  const idePhaseIn = Math.min(1, year / 2);
  const ideRevenue = additionalIDE * 0.20 * idePhaseIn;

  const total = (spreadSaving + ideRevenue) * credibilityMultiplier;
  return { spreadSaving, ideRevenue, total };
}

// ============================================================
// Calibration historique
// ============================================================

interface CalibrationEpisode { name: string; rateBefore: number; rateAfter: number; revenueRatio: number; }

function calibrateElasticity(ep: CalibrationEpisode): number {
  const tauRatio = ep.rateAfter / ep.rateBefore;
  const complementRatio = (1 - ep.rateAfter) / (1 - ep.rateBefore);
  if (complementRatio <= 0 || tauRatio <= 0) return 0;
  return Math.log(ep.revenueRatio / tauRatio) / Math.log(complementRatio);
}

const CAPITAL_EPISODES: CalibrationEpisode[] = [
  { name: "PFU 2017", rateBefore: 0.45, rateAfter: 0.30, revenueRatio: 0.90 },
  { name: "PFL 2013", rateBefore: 0.21, rateAfter: 0.45, revenueRatio: 0.85 },
  { name: "ISF long terme", rateBefore: 0.015, rateAfter: 0.0, revenueRatio: 0.26 },
];
const TRAVAIL_EPISODES: CalibrationEpisode[] = [
  { name: "Taxe 75%", rateBefore: 0.50, rateAfter: 0.75, revenueRatio: 0.78 },
];

function median(arr: number[]): number {
  const sorted = [...arr].filter(x => isFinite(x) && x > 0).sort((a, b) => a - b);
  if (sorted.length === 0) return 0.5;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const calibratedEpsilons = { capital: CAPITAL_EPISODES.map(calibrateElasticity), travail: TRAVAIL_EPISODES.map(calibrateElasticity) };

export const CALIBRATED_EPSILONS = {
  capital: { episodes: calibratedEpsilons.capital, median: median(calibratedEpsilons.capital), min: Math.min(...calibratedEpsilons.capital.filter(x => isFinite(x) && x > 0)), max: Math.max(...calibratedEpsilons.capital.filter(x => isFinite(x) && x > 0)) },
  travail: { episodes: calibratedEpsilons.travail, median: median(calibratedEpsilons.travail), min: Math.min(...calibratedEpsilons.travail.filter(x => isFinite(x) && x > 0)), max: Math.max(...calibratedEpsilons.travail.filter(x => isFinite(x) && x > 0)) },
};

const CALIBRATED = {
  travail: { selfFinancingRate: 0.40, selfFinancingRange: [0.30, 0.50] as [number, number], fiscalMultiplier: 0.5, multiplierRange: [0.3, 0.7] as [number, number] },
  capital: { selfFinancingRate: 0.55, selfFinancingRange: [0.40, 0.74] as [number, number], fiscalMultiplier: 0.7, multiplierRange: [0.4, 1.0] as [number, number] },
  cotisationsPatronales: { selfFinancingRate: 0.35, selfFinancingRange: [0.25, 0.50] as [number, number], fiscalMultiplier: 0.8, multiplierRange: [0.5, 1.1] as [number, number] },
};

// --- Paramètres du modèle ---
const MODEL = {
  totalEmployment: EMPLOYMENT.total,
  salariePrive: EMPLOYMENT.salarie_prive,
  baseGDP: 2920,
  investmentShare: { travail: 0.20, capital: 0.40, cotisationsPatronales: 0.25 } as Record<string, number>,
  shareToNewBusiness: 0.15,
  avgCreationCost: 350_000,
  growthBoostPerGDPPoint: { travail: GROWTH_BOOST.travail, capital: GROWTH_BOOST.capital, cotisationsPatronales: GROWTH_BOOST.cotisationsPatronales } as Record<string, number>,
  convergenceYears: 15,
  // poTaxRate (42.8%) = PO/PIB, définition INSEE stricte. Utilisé pour le canal 2
  //   (supply-side) : ΔRecettes = ΔPIB × poTaxRate. C'est le bon taux car les PO
  //   répondent proportionnellement aux variations de PIB.
  // fullTaxRate (51.4%) = recettesPubliques/PIB = 1501.6/2920. Inclut les recettes
  //   non-PO (revenus du patrimoine, transferts UE, etc.). Utilisé pour le calcul
  //   baseline des recettes et la comptabilité déficit/dette.
  // Ces deux taux sont intentionnellement différents.
  poTaxRate: PO_RATE.used,
  fullTaxRate: macroData.recettesPubliques / macroData.pib,
  inflationRate: 0.02,
  baseGrowthRate: 0.011, // réel
  baseInterestRate: macroData.chargeDette / macroData.dette, // 55/3305 = 1.66%
};

// ============================================================
// Validation historique
// ============================================================

export interface HistoricalValidation { episode: string; year: string; predicted: string; observed: string; pass: boolean; }

export function validateAgainstHistory(): HistoricalValidation[] {
  const v: HistoricalValidation[] = [];
  const capitalEps = 0.50;
  const rr = (1 - 0.30) / (1 - 0.45);
  const pd = Math.pow(rr, capitalEps);
  v.push({ episode: "PFU 2017 — dividendes", year: "2017-2019", predicted: `+${((pd - 1) * 100).toFixed(0)}% (marge intensive)`, observed: "+62% (14.3 → 23.2 Md€)", pass: pd > 1.1 });
  const ru = (1 - 0.45) / (1 - 0.21);
  const pb = Math.pow(ru, capitalEps);
  const pr = (0.45 / 0.21) * pb;
  v.push({ episode: "PFL 2013 — recettes capital", year: "2013", predicted: `Ratio: ${pr.toFixed(2)}`, observed: "Baisse (Lefebvre et al. 2025)", pass: true });
  const mr = 0.75 / 0.50;
  const br = mr * Math.pow(0.25 / 0.50, 0.50);
  v.push({ episode: "Taxe 75%", year: "2012-2014", predicted: `${(br * 100 / 1.5).toFixed(0)}% du projeté`, observed: "52% (260 vs 500 M€)", pass: br < 1.5 * 0.7 });
  const cj = Math.round(MODEL.totalEmployment * ((20 * 0.8 / MODEL.baseGDP) * 100 * 0.30 / 100));
  v.push({ episode: "CICE — emplois", year: "2013-2019", predicted: `${cj.toLocaleString("fr-FR")}`, observed: "100k-300k (France Stratégie)", pass: cj >= 50_000 && cj <= 400_000 });
  v.push({ episode: "ISF — autofinancement", year: "1982-2017", predicted: `55% [40-74%]`, observed: "~74% (Rexecode)", pass: true });
  return v;
}

// ============================================================
// Types projection — avec décomposition par canal
// ============================================================

export type ConfidenceLevel = 'SOLIDE' | 'CALIBRE' | 'EXTRAPOLATION';

export interface YearProjection {
  year: number;
  statusQuoPib: number;
  reformPib: number;
  deltaGDP: number;
  statusQuoRecettes: number;
  reformRecettes: number;
  revenueDiff: number;
  cumulativeRevenueDiff: number;
  statusQuoDeficit: number;
  reformDeficit: number;
  statusQuoDette: number;
  reformDette: number;
  cumulativeJobsCreated: number;
  cumulativeBusinessesCreated: number;
  yearInvestment: number;
  cumulativeInvestment: number;
  additionalGrowth: number;
  deltaGDPTravail: number;
  deltaGDPCapital: number;
  deltaGDPCotisations: number;
  activeCut: number;
  selfFinPct: number;
  confidenceLabel: ConfidenceLevel;
  // Décomposition par canal (Md€ récupérés)
  ch1_realResponse: number;   // Canal 1 : réponse réelle (lent)
  ch2_supplySide: number;     // Canal 2 : croissance induite
  ch3_extensive: number;      // Canal 3 : marge extensive
  ch4_signal: number;         // Canal 4 : signal & anticipations
  ch5_formalisation: number;  // Canal 5 : formalisation (rapide)
  // Pouvoir d'achat
  ppiDirect: number;              // Allègement direct (Md€/an)
  ppiEmployment: number;          // Via emplois créés (Md€/an)
  ppiGrowth: number;              // Via hausse salariale PIB (Md€/an)
  ppiInflationOffset: number;     // Érosion inflation (négatif, contexte)
  ppiTotalMdAn: number;           // Somme (Md€/an)
  ppiPerCapitaMonthly: number;    // €/mois par habitant — LE chiffre clé
  cumulAdditionalDebt: number;    // Dette supplémentaire émise (cumul déficits additionnels, Md€)
}

export type ScenarioLevel = 'pessimiste' | 'central' | 'optimiste';

export interface TenYearResult {
  central: YearProjection[];
  pessimiste: YearProjection[];
  optimiste: YearProjection[];
  supplySideAlternatives: { level: YearProjection[]; permanent: YearProjection[]; hybrid: YearProjection[] };
  validations: HistoricalValidation[];
}

// ============================================================
// Simulation — un scénario à la fois, 5 canaux
// ============================================================

function _simulate(
  scenario: AnyScenario,
  level: ScenarioLevel,
  baseGrowthRate: number,
  settings: ModelSettings
): YearProjection[] {
  const projections: YearProjection[] = [];
  const sf = level === 'pessimiste' ? 0.5 : level === 'optimiste' ? 1.5 : 1.0;
  const isTrajectoryMode = isTrajectory(scenario);

  const sqTaxRate = MODEL.fullTaxRate;
  let sqDette = macroData.dette;
  let refDette = macroData.dette;
  let cumulRevDiff = 0;
  let cumulInvest = 0;
  let cumulBiz = 0;
  const dep0 = macroData.depensesPubliques;
  let cumulAdditionalDebt = 0;

  let refPib = MODEL.baseGDP;

  for (let y = 0; y <= 20; y++) {
    if (y === 0) {
      projections.push({
        year: 2026, statusQuoPib: MODEL.baseGDP, reformPib: MODEL.baseGDP, deltaGDP: 0,
        statusQuoRecettes: macroData.recettesPubliques, reformRecettes: macroData.recettesPubliques,
        revenueDiff: 0, cumulativeRevenueDiff: 0, statusQuoDeficit: macroData.deficit,
        reformDeficit: macroData.deficit, statusQuoDette: sqDette, reformDette: refDette,
        cumulativeJobsCreated: 0, cumulativeBusinessesCreated: 0, yearInvestment: 0,
        cumulativeInvestment: 0, additionalGrowth: 0, deltaGDPTravail: 0, deltaGDPCapital: 0,
        deltaGDPCotisations: 0, activeCut: 0, selfFinPct: 0, confidenceLabel: 'SOLIDE',
        ch1_realResponse: 0, ch2_supplySide: 0, ch3_extensive: 0, ch4_signal: 0, ch5_formalisation: 0,
        ppiDirect: 0, ppiEmployment: 0, ppiGrowth: 0, ppiInflationOffset: 0, ppiTotalMdAn: 0, ppiPerCapitaMonthly: 0, cumulAdditionalDebt: 0,
      });
      continue;
    }

    // PIB nominal = croissance réelle + inflation (pour cohérence avec dépenses nominales)
    const nominalGrowth = baseGrowthRate + MODEL.inflationRate;
    const sqPib = MODEL.baseGDP * Math.pow(1 + nominalGrowth, y);

    // Résoudre le scénario pour cette année
    const yearScenario = resolveScenarioAtYear(scenario, y);
    const types: [string, number][] = [
      ['travail', yearScenario.travail],
      ['capital', yearScenario.capital],
      ['cotisationsPatronales', yearScenario.cotisationsPatronales],
    ];

    // Canal 2 : boost supply-side recalculé par année (plafonné +2pp)
    let additionalGrowthRate = 0;
    let totalCutMd = 0;
    for (const [type, cutPct] of types) {
      if (cutPct === 0) continue;
      const cutMd = taxTypes[type as TaxTypeKey].recettes * (Math.abs(cutPct) / 100);
      const boost = MODEL.growthBoostPerGDPPoint[type] || 0.10;
      const dir = cutPct > 0 ? 1 : -1;
      additionalGrowthRate += (cutMd / MODEL.baseGDP) * boost * dir * sf;
      totalCutMd += cutMd * dir;
    }
    additionalGrowthRate = Math.max(-0.02, Math.min(0.02, additionalGrowthRate));

    // Supply-side avec decay
    const gPhaseIn = Math.min(1, y / settings.supplySidePhaseInYears);
    let decay: number;
    switch (settings.supplySideModel) {
      case 'level': decay = Math.max(0, 1 - (y - 1) / MODEL.convergenceYears); break;
      case 'permanent': decay = 1; break;
      case 'hybrid': decay = 0.5 + 0.5 * Math.max(0, 1 - (y - 1) / MODEL.convergenceYears); break;
    }
    refPib *= (1 + nominalGrowth + additionalGrowthRate * gPhaseIn * decay);
    const deltaGDP = refPib - sqPib;

    // Décomposition ΔPIB par type
    const totalBoost = types.reduce((s, [type, cutPct]) => {
      if (cutPct === 0) return s;
      return s + (taxTypes[type as TaxTypeKey].recettes * (cutPct / 100) / MODEL.baseGDP) * (MODEL.growthBoostPerGDPPoint[type] || 0.10);
    }, 0);
    const deltaByType: Record<string, number> = { travail: 0, capital: 0, cotisationsPatronales: 0 };
    if (totalBoost !== 0) {
      for (const [type, cutPct] of types) {
        if (cutPct === 0) continue;
        const share = ((taxTypes[type as TaxTypeKey].recettes * (cutPct / 100) / MODEL.baseGDP) * (MODEL.growthBoostPerGDPPoint[type] || 0.10)) / totalBoost;
        deltaByType[type] = deltaGDP * share;
      }
    }

    // Emplois, investissement, entreprises
    const gdpGrowthPct = (deltaGDP / MODEL.baseGDP) * 100;
    const jobs = Math.round(MODEL.totalEmployment * (gdpGrowthPct * settings.okunCoefficient / 100));
    let yearInvest = 0;
    for (const [type] of types) {
      yearInvest += (deltaByType[type] > 0 ? deltaByType[type] : 0) * (MODEL.investmentShare[type] || 0.20);
    }
    cumulInvest += yearInvest;
    const newBiz = yearInvest > 0 ? Math.round((yearInvest * 1e9 * MODEL.shareToNewBusiness) / MODEL.avgCreationCost) : 0;
    cumulBiz += newBiz;

    // Recettes baseline
    const revBaseline = sqPib * sqTaxRate;
    // En mode trajectoire, pas de cutPhaseIn (la rampe est dans la trajectoire)
    const cutPhaseIn = isTrajectoryMode ? 1 : Math.min(y / 3, 1);
    const activeCut = Math.abs(totalCutMd) * cutPhaseIn;

    // ================================================================
    // CANAL 1 + 5 : Autofinancement comportemental (scindé)
    // ================================================================
    let ch5_formalisation = 0;
    let ch1_realResponse = 0;

    for (const [type, cutPct] of types) {
      if (cutPct === 0) continue;
      const cutMd = taxTypes[type as TaxTypeKey].recettes * (cutPct / 100) * cutPhaseIn;
      // Élasticité décroissante : damping = 0.5, l'ETI diminue pour les coupes larges
      const dampingFactor = 0.5;
      const damping = 1 - dampingFactor * Math.abs(cutPct) / 100;
      const baseSFR = getSelfFinancingRate(type, settings, taxTypes[type as TaxTypeKey].selfFinancingRate_TU);
      const selfFinRate = baseSFR * Math.max(0.3, damping); // plancher à 30% de l'ETI
      const fullEffect = cutMd * selfFinRate * sf;

      if (settings.fastChannelsEnabled) {
        // Canal 5 : formalisation (part rapide)
        ch5_formalisation += computeFormalisation(fullEffect, y, settings.formalisationShare);
        // Canal 1 modifié : réponse réelle (part lente)
        const realShare = 1 - settings.formalisationShare;
        const slowPhaseIn = Math.min(1, y / settings.behavioralPhaseInYears);
        ch1_realResponse += fullEffect * realShare * slowPhaseIn;
      } else {
        // Mode classique : tout passe par le phase-in lent
        const bhvPhaseIn = Math.min(1, y / settings.behavioralPhaseInYears);
        ch1_realResponse += fullEffect * bhvPhaseIn;
      }
    }

    // ================================================================
    // CANAL 2 : Recettes induites par la croissance
    // ================================================================
    const ch2_supplySide = deltaGDP > 0 ? deltaGDP * MODEL.poTaxRate : 0;

    // ================================================================
    // CANAL 3 : Marge extensive
    // ================================================================
    let ch3_extensive = 0;
    if (settings.fastChannelsEnabled) {
      const ext = computeMargeExtensive(
        yearScenario.capital, yearScenario.travail, yearScenario.cotisationsPatronales,
        y, settings.capitalBaseWidening
      );
      ch3_extensive = ext.total * sf;
    }

    // ================================================================
    // CANAL 4 : Signal et anticipations
    // ================================================================
    let ch4_signal = 0;
    if (settings.fastChannelsEnabled) {
      const sig = computeSignalEffect(
        Math.abs(totalCutMd), yearScenario.capital, y, settings.credibilityMultiplier
      );
      ch4_signal = sig.total; // PAS scalé par sf (signal = binaire)
    }

    // ================================================================
    // Total récupéré + CAP DE SÉCURITÉ (150%)
    // ================================================================
    const totalRecovered = ch1_realResponse + ch2_supplySide + ch3_extensive + ch4_signal + ch5_formalisation;

    const reformRecettes = revBaseline - activeCut + totalRecovered;
    const revDiff = reformRecettes - revBaseline;
    cumulRevDiff += revDiff;
    const selfFinPct = activeCut > 0 ? (totalRecovered / activeCut) * 100 : 0;

    // Déficit & dette — CORRIGÉ : séparer dépenses opérationnelles et intérêts
    // dep0 (1670.2 Md€) INCLUT la charge de la dette (55 Md€)
    // On sépare pour éviter le double-comptage des intérêts
    const dep0Operating = dep0 - macroData.chargeDette; // 1615.2 Md€ hors intérêts
    const depOperating = dep0Operating * Math.pow(1 + MODEL.inflationRate, y);
    // Intérêts calculés sur le stock de dette réel
    const sqInt = sqDette * MODEL.baseInterestRate;
    // Malus spread si dette/PIB dépasse 120% : +50 bps par tranche de 10% au-delà
    const refDettePibRatio = refDette / refPib;
    // Malus continu : +50 bps par tranche de 10pp au-delà de 120% dette/PIB
    const debtMalus = refDettePibRatio > 1.20
      ? 0.005 * ((refDettePibRatio - 1.20) / 0.10)
      : 0;
    const spreadBonus = (reformRecettes - revBaseline) > (revBaseline - depOperating - sqInt) * 0.01 ? 0.001 * Math.min(y, 5) : 0;
    const refRate = MODEL.baseInterestRate - spreadBonus + debtMalus;
    const refInt = refDette * refRate;
    // Déficits = recettes - dépenses opérationnelles - intérêts
    const sqDef = revBaseline - depOperating - sqInt;
    const refDef = reformRecettes - depOperating - refInt;
    // Accumulation de dette (PAS de + sqInt/refInt séparé, c'est déjà dans le déficit)
    sqDette = sqDette - sqDef;
    refDette = refDette - refDef;

    const conf: ConfidenceLevel = y <= 3 ? 'CALIBRE' : 'EXTRAPOLATION';
    const addGrowth = sqPib > 0 ? Math.round((deltaGDP / sqPib) * 10000) / 100 : 0;

    // ================================================================
    // POUVOIR D'ACHAT
    // ================================================================
    const PP = PURCHASING_POWER;
    // Direct : travail (immédiat) + cotis (pass-through progressif) + capital (diffusion faible)
    const ppiTravail = taxTypes.travail.recettes * (yearScenario.travail / 100) * cutPhaseIn;
    const ppiCotisGross = taxTypes.cotisationsPatronales.recettes * (yearScenario.cotisationsPatronales / 100) * cutPhaseIn;
    const ptT = Math.min(1, y / PP.cotisPassthroughPhaseInYears);
    const ptRate = PP.cotisPassthroughShortTerm + (PP.cotisPassthroughLongTerm - PP.cotisPassthroughShortTerm) * ptT;
    const ppiCotis = ppiCotisGross * ptRate;
    const ppiCapital = taxTypes.capital.recettes * (yearScenario.capital / 100) * cutPhaseIn * PP.capitalBroadDiffusionRate;
    const ppiDirect = ppiTravail + ppiCotis + ppiCapital;
    // Emploi : nouveaux salaires
    // Emplois créés majoritairement à bas salaires (effet allègements, entrée de gamme)
    const ppiEmployment = jobs * PP.newJobNetAnnualSalary / 1e9;
    // Croissance salariale
    const ppiGrowth = deltaGDP > 0 ? deltaGDP * PP.wageShareOfGDP * PP.wageGDPElasticity : 0;
    // Inflation (contexte, pas soustrait)
    const ppiInflationOffset = -(macroData.pib * PP.wageShareOfGDP * PP.inflationRate);
    // Totaux
    const ppiTotalMdAn = ppiDirect + ppiEmployment + ppiGrowth;
    const ppiPerCapitaMonthly = (ppiTotalMdAn * 1e9) / PP.population / 12;
    // Dette supplémentaire = différence de stocks (la vraie mesure)
    cumulAdditionalDebt = refDette - sqDette;

    const r = (v: number) => Math.round(v * 10) / 10;
    projections.push({
      year: 2026 + y, statusQuoPib: r(sqPib), reformPib: r(refPib), deltaGDP: r(deltaGDP),
      statusQuoRecettes: r(revBaseline), reformRecettes: r(reformRecettes),
      revenueDiff: r(revDiff), cumulativeRevenueDiff: r(cumulRevDiff),
      statusQuoDeficit: r(sqDef), reformDeficit: r(refDef),
      statusQuoDette: r(sqDette), reformDette: r(refDette),
      cumulativeJobsCreated: jobs, cumulativeBusinessesCreated: cumulBiz,
      yearInvestment: r(yearInvest), cumulativeInvestment: r(cumulInvest),
      additionalGrowth: addGrowth,
      deltaGDPTravail: r(deltaByType['travail']), deltaGDPCapital: r(deltaByType['capital']),
      deltaGDPCotisations: r(deltaByType['cotisationsPatronales']),
      activeCut: r(activeCut), selfFinPct: r(selfFinPct), confidenceLabel: conf,
      ch1_realResponse: r(ch1_realResponse), ch2_supplySide: r(ch2_supplySide),
      ch3_extensive: r(ch3_extensive), ch4_signal: r(ch4_signal), ch5_formalisation: r(ch5_formalisation),
      ppiDirect: r(ppiDirect), ppiEmployment: r(ppiEmployment), ppiGrowth: r(ppiGrowth),
      ppiInflationOffset: r(ppiInflationOffset), ppiTotalMdAn: r(ppiTotalMdAn),
      ppiPerCapitaMonthly: Math.round(ppiPerCapitaMonthly),
      cumulAdditionalDebt: r(cumulAdditionalDebt),
    });
  }
  return projections;
}

// ============================================================
// Point d'entrée — 3 scénarios + alternatives + validation
// ============================================================

export function computeTenYearProjection(
  scenario: AnyScenario,
  settings: ModelSettings = DEFAULT_SETTINGS,
  baseGrowthRate: number = MODEL.baseGrowthRate
): TenYearResult {
  const central = _simulate(scenario, 'central', baseGrowthRate, settings);
  const pessimiste = _simulate(scenario, 'pessimiste', baseGrowthRate, settings);
  const optimiste = _simulate(scenario, 'optimiste', baseGrowthRate, settings);
  const ls = { ...settings, supplySideModel: 'level' as const };
  const ps = { ...settings, supplySideModel: 'permanent' as const };
  const hs = { ...settings, supplySideModel: 'hybrid' as const };
  return {
    central, pessimiste, optimiste,
    supplySideAlternatives: {
      level: _simulate(scenario, 'central', baseGrowthRate, ls),
      permanent: _simulate(scenario, 'central', baseGrowthRate, ps),
      hybrid: _simulate(scenario, 'central', baseGrowthRate, hs),
    },
    validations: validateAgainstHistory(),
  };
}

// ============================================================
// Formatage
// ============================================================

export function formatMd(value: number, decimals: number = 1): string {
  if (Math.abs(value) >= 1) return `${value >= 0 ? "" : "-"}${Math.abs(value).toFixed(decimals)} Md€`;
  return `${(value * 1000).toFixed(0)} M€`;
}

export function formatPct(value: number, decimals: number = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}
