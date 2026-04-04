// ============================================================
// Types et presets pour les hypothèses du modèle
// ============================================================

export type SelfFinancingModel = 'eti' | 'trabandt_uhlig';
export type CapitalElasticityModel = 'direct' | 'noCross' | 'withPayroll';
export type SupplySideModel = 'level' | 'permanent' | 'hybrid';

export interface ModelSettings {
  selfFinancingModel: SelfFinancingModel;
  capitalElasticityModel: CapitalElasticityModel;
  supplySideModel: SupplySideModel;
  okunCoefficient: number;
  behavioralPhaseInYears: number;
  supplySidePhaseInYears: number;
  // Canaux rapides (canaux 3, 4, 5)
  fastChannelsEnabled: boolean;
  formalisationShare: number;      // 0.30–0.70 : part formalisation dans l'ETI
  capitalBaseWidening: number;     // 0.10–0.70 : élargissement base capital (ex: 0.40 = +40%)
  credibilityMultiplier: number;   // 1.0–2.0
}

// ============================================================
// Presets
// ============================================================

export const DEFAULT_SETTINGS: ModelSettings = {
  selfFinancingModel: 'eti',
  capitalElasticityModel: 'direct',
  supplySideModel: 'hybrid',
  okunCoefficient: 0.30,
  behavioralPhaseInYears: 5,
  supplySidePhaseInYears: 8,
  fastChannelsEnabled: true,
  formalisationShare: 0.50,
  capitalBaseWidening: 0.025,
  credibilityMultiplier: 1.0,
};

export const CONSERVATIVE_PRESET: ModelSettings = {
  selfFinancingModel: 'eti',
  capitalElasticityModel: 'direct',
  supplySideModel: 'level',
  okunCoefficient: 0.30,
  behavioralPhaseInYears: 6,
  supplySidePhaseInYears: 10,
  fastChannelsEnabled: true,
  formalisationShare: 0.30,
  capitalBaseWidening: 0.01,
  credibilityMultiplier: 1.0,
};

export const CENTRAL_PRESET: ModelSettings = {
  selfFinancingModel: 'eti',
  capitalElasticityModel: 'noCross',
  supplySideModel: 'hybrid',
  okunCoefficient: 0.35,
  behavioralPhaseInYears: 5,
  supplySidePhaseInYears: 8,
  fastChannelsEnabled: true,
  formalisationShare: 0.50,
  capitalBaseWidening: 0.025,
  credibilityMultiplier: 1.0,
};

export const OPTIMISTIC_PRESET: ModelSettings = {
  selfFinancingModel: 'trabandt_uhlig',
  capitalElasticityModel: 'noCross',
  supplySideModel: 'permanent',
  okunCoefficient: 0.40,
  behavioralPhaseInYears: 4,
  supplySidePhaseInYears: 4,
  fastChannelsEnabled: true,
  formalisationShare: 0.65,
  capitalBaseWidening: 0.05,
  credibilityMultiplier: 1.3,
};

export const OPTIMISTIC_COORDINATED_PRESET: ModelSettings = {
  ...OPTIMISTIC_PRESET,
  credibilityMultiplier: 1.5,
};

// ============================================================
// Helpers — élasticités et self-financing
// ============================================================

export function getCapitalElasticity(model: CapitalElasticityModel): {
  epsilon: number;
  crossElasticity: number;
  optimalRate: number;
} {
  switch (model) {
    case 'direct':
      // epsilon=0.50 = élasticité directe (Lefebvre et al. 2025, Scand. J. Econ.)
      // optimalRate=0.43 = τ* du modèle COMPLET avec cross-base responses
      // Ce n'est PAS 1/(1+0.50)=0.67 — c'est le résultat principal du papier
      // qui intègre les effets croisés capital→travail. Voir economicData.ts:117-139.
      return { epsilon: 0.50, crossElasticity: 0.05, optimalRate: 0.43 };
    case 'noCross':
      // Composite sans cross-élasticité : ε=0.75, τ*=1/(1+0.75)=0.57
      return { epsilon: 0.75, crossElasticity: 0, optimalRate: 0.57 };
    case 'withPayroll':
      // Composite incluant cotisations : ε=1.86, τ*=1/(1+1.86)=0.35
      return { epsilon: 1.86, crossElasticity: 0, optimalRate: 0.35 };
  }
}

export function getEffectiveElasticity(
  taxTypeKey: string,
  settings: ModelSettings
): number {
  if (taxTypeKey === 'capital') {
    return getCapitalElasticity(settings.capitalElasticityModel).epsilon;
  }
  const baseElasticities: Record<string, number> = {
    travail: 0.35,
    cotisationsPatronales: 0.40,
    tva: 0.15,
  };
  return baseElasticities[taxTypeKey] ?? 0.35;
}

export function getEffectiveOptimalRate(
  taxTypeKey: string,
  settings: ModelSettings
): number {
  if (taxTypeKey === 'capital') {
    return getCapitalElasticity(settings.capitalElasticityModel).optimalRate;
  }
  const eps = getEffectiveElasticity(taxTypeKey, settings);
  return 1 / (1 + eps);
}

export function getSelfFinancingRate(
  taxTypeKey: string,
  settings: ModelSettings,
  selfFinancingRate_TU: number
): number {
  if (settings.selfFinancingModel === 'eti') {
    const eps = getEffectiveElasticity(taxTypeKey, settings);
    return eps / (1 + eps);
  }
  return selfFinancingRate_TU;
}

export function getEffectiveCrossElasticity(
  taxTypeKey: string,
  settings: ModelSettings
): number {
  if (taxTypeKey === 'capital') {
    return getCapitalElasticity(settings.capitalElasticityModel).crossElasticity;
  }
  return 0;
}

// ============================================================
// Profile & bias detection
// ============================================================

export function getProfileLabel(
  settings: ModelSettings
): 'Conservateur' | 'Central' | 'Optimiste' | 'Optimiste + coordination' | 'Personnalisé' {
  if (settingsEqual(settings, CONSERVATIVE_PRESET)) return 'Conservateur';
  if (settingsEqual(settings, CENTRAL_PRESET)) return 'Central';
  if (settingsEqual(settings, OPTIMISTIC_COORDINATED_PRESET)) return 'Optimiste + coordination';
  if (settingsEqual(settings, OPTIMISTIC_PRESET)) return 'Optimiste';
  return 'Personnalisé';
}

export function getProfileColor(label: string): string {
  switch (label) {
    case 'Conservateur': return '#10b981';
    case 'Central': return '#f59e0b';
    case 'Optimiste': return '#ef4444';
    case 'Optimiste + coordination': return '#8b5cf6';
    default: return '#3b82f6';
  }
}

export function countOptimisticParams(settings: ModelSettings): {
  optimistic: number;
  total: number;
} {
  let optimistic = 0;
  const total = 9;
  if (settings.selfFinancingModel === 'trabandt_uhlig') optimistic++;
  if (settings.capitalElasticityModel !== 'direct') optimistic++;
  if (settings.supplySideModel === 'permanent') optimistic++;
  if (settings.okunCoefficient > 0.35) optimistic++;
  if (settings.behavioralPhaseInYears < 5) optimistic++;
  if (settings.supplySidePhaseInYears < 8) optimistic++;
  // Canaux rapides
  if (settings.formalisationShare > 0.50) optimistic++;
  if (settings.capitalBaseWidening > 0.025) optimistic++;
  if (settings.credibilityMultiplier > 1.0) optimistic++;
  return { optimistic, total };
}

function settingsEqual(a: ModelSettings, b: ModelSettings): boolean {
  return (
    a.selfFinancingModel === b.selfFinancingModel &&
    a.capitalElasticityModel === b.capitalElasticityModel &&
    a.supplySideModel === b.supplySideModel &&
    a.okunCoefficient === b.okunCoefficient &&
    a.behavioralPhaseInYears === b.behavioralPhaseInYears &&
    a.supplySidePhaseInYears === b.supplySidePhaseInYears &&
    a.fastChannelsEnabled === b.fastChannelsEnabled &&
    a.formalisationShare === b.formalisationShare &&
    a.capitalBaseWidening === b.capitalBaseWidening &&
    a.credibilityMultiplier === b.credibilityMultiplier
  );
}
