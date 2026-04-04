import {
  lafferRevenue,
  lafferRevenueNormalized,
  generateLafferCurve,
  computeImpact,
  computeCombinedImpact,
  computeTenYearProjection,
  resolveScenarioAtYear,
  formatMd,
  formatPct,
  formatNumber,
  validateAgainstHistory,
  CALIBRATED_EPSILONS,
  type ImpactResult,
  type ScenarioInput,
  type TrajectoryScenario,
} from '@/utils/calculations';
import {
  DEFAULT_SETTINGS,
  CONSERVATIVE_PRESET,
  CENTRAL_PRESET,
  OPTIMISTIC_PRESET,
  type ModelSettings,
} from '@/types/modelSettings';
import { taxTypes, macroData } from '@/data/economicData';

// ============================================================
// lafferRevenue()
// ============================================================

describe('lafferRevenue', () => {
  test('returns 0 when tau = 0', () => {
    expect(lafferRevenue(0, 0.5)).toBe(0);
  });

  test('returns 0 when tau = 1', () => {
    expect(lafferRevenue(1, 0.5)).toBe(0);
  });

  test('returns 0 when tau is negative', () => {
    expect(lafferRevenue(-0.1, 0.5)).toBe(0);
  });

  test('returns 0 when tau > 1', () => {
    expect(lafferRevenue(1.5, 0.5)).toBe(0);
  });

  test('returns positive value for tau in (0, 1)', () => {
    expect(lafferRevenue(0.3, 0.5)).toBeGreaterThan(0);
    expect(lafferRevenue(0.5, 0.5)).toBeGreaterThan(0);
    expect(lafferRevenue(0.9, 0.5)).toBeGreaterThan(0);
  });

  test('peak is at tau = 1/(1+epsilon) for epsilon = 0.5', () => {
    const epsilon = 0.5;
    const optimalTau = 1 / (1 + epsilon); // 2/3
    const peakRevenue = lafferRevenue(optimalTau, epsilon);
    // Revenue slightly below and above the peak should be lower
    expect(lafferRevenue(optimalTau - 0.01, epsilon)).toBeLessThan(peakRevenue);
    expect(lafferRevenue(optimalTau + 0.01, epsilon)).toBeLessThan(peakRevenue);
  });

  test('peak is at tau = 1/(1+epsilon) for epsilon = 1.0', () => {
    const epsilon = 1.0;
    const optimalTau = 1 / (1 + epsilon); // 0.5
    const peakRevenue = lafferRevenue(optimalTau, epsilon);
    expect(lafferRevenue(optimalTau - 0.01, epsilon)).toBeLessThan(peakRevenue);
    expect(lafferRevenue(optimalTau + 0.01, epsilon)).toBeLessThan(peakRevenue);
  });

  test('peak is at tau = 1/(1+epsilon) for epsilon = 0.35 (travail)', () => {
    const epsilon = 0.35;
    const optimalTau = 1 / (1 + epsilon);
    const peakRevenue = lafferRevenue(optimalTau, epsilon);
    expect(lafferRevenue(optimalTau - 0.01, epsilon)).toBeLessThan(peakRevenue);
    expect(lafferRevenue(optimalTau + 0.01, epsilon)).toBeLessThan(peakRevenue);
  });

  test('is symmetric around peak only when epsilon = 1', () => {
    // When epsilon = 1, R(tau) = tau * (1-tau), symmetric around 0.5
    expect(lafferRevenue(0.3, 1.0)).toBeCloseTo(lafferRevenue(0.7, 1.0), 10);
  });

  test('higher epsilon shifts peak leftward', () => {
    const peakLow = 1 / (1 + 0.2);
    const peakHigh = 1 / (1 + 2.0);
    expect(peakHigh).toBeLessThan(peakLow);
  });

  test('tau = 0.5 with epsilon = 1 gives 0.25', () => {
    // R(0.5) = 0.5 * (1-0.5)^1 = 0.25
    expect(lafferRevenue(0.5, 1.0)).toBeCloseTo(0.25, 10);
  });
});

// ============================================================
// lafferRevenueNormalized()
// ============================================================

describe('lafferRevenueNormalized', () => {
  test('peak value is exactly 1.0', () => {
    const epsilon = 0.5;
    const optimalTau = 1 / (1 + epsilon);
    expect(lafferRevenueNormalized(optimalTau, epsilon)).toBeCloseTo(1.0, 10);
  });

  test('peak is 1.0 for various epsilon values', () => {
    for (const eps of [0.15, 0.35, 0.5, 0.75, 1.0, 1.86]) {
      const optTau = 1 / (1 + eps);
      expect(lafferRevenueNormalized(optTau, eps)).toBeCloseTo(1.0, 8);
    }
  });

  test('returns 0 at boundaries', () => {
    expect(lafferRevenueNormalized(0, 0.5)).toBe(0);
    expect(lafferRevenueNormalized(1, 0.5)).toBe(0);
  });

  test('all interior values are between 0 and 1', () => {
    const epsilon = 0.5;
    for (let tau = 0.01; tau < 1; tau += 0.05) {
      const val = lafferRevenueNormalized(tau, epsilon);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1.0001); // small tolerance for floating point
    }
  });

  test('values closer to the peak are higher', () => {
    const epsilon = 0.5;
    const optimalTau = 1 / (1 + epsilon);
    // A point near the peak should have a higher value than one far from it
    const near = lafferRevenueNormalized(optimalTau - 0.05, epsilon);
    const far = lafferRevenueNormalized(0.05, epsilon);
    expect(near).toBeGreaterThan(far);
  });
});

// ============================================================
// generateLafferCurve()
// ============================================================

describe('generateLafferCurve', () => {
  test('generates correct number of points (default = 201)', () => {
    const curve = generateLafferCurve(0.5);
    expect(curve).toHaveLength(201); // 0..200 inclusive
  });

  test('generates correct number of points with custom numPoints', () => {
    const curve = generateLafferCurve(0.5, 100);
    expect(curve).toHaveLength(101); // 0..100 inclusive
  });

  test('first point is at x=0, y=0', () => {
    const curve = generateLafferCurve(0.5);
    expect(curve[0].x).toBe(0);
    expect(curve[0].y).toBe(0);
  });

  test('last point is at x=1, y=0', () => {
    const curve = generateLafferCurve(0.5);
    const last = curve[curve.length - 1];
    expect(last.x).toBe(1);
    expect(last.y).toBe(0);
  });

  test('curve rises then falls (single peak)', () => {
    const curve = generateLafferCurve(0.5);
    // Find the index of the max
    let maxIdx = 0;
    let maxY = 0;
    for (let i = 0; i < curve.length; i++) {
      if (curve[i].y > maxY) {
        maxY = curve[i].y;
        maxIdx = i;
      }
    }
    // Before peak: monotonically increasing (with tolerance for plateau near peak)
    for (let i = 1; i < maxIdx; i++) {
      expect(curve[i].y).toBeGreaterThanOrEqual(curve[i - 1].y - 1e-10);
    }
    // After peak: monotonically decreasing (with tolerance for plateau near peak)
    for (let i = maxIdx + 1; i < curve.length; i++) {
      expect(curve[i].y).toBeLessThanOrEqual(curve[i - 1].y + 1e-10);
    }
  });

  test('peak y value is approximately 1.0 (normalized)', () => {
    const curve = generateLafferCurve(0.5);
    const maxY = Math.max(...curve.map(p => p.y));
    expect(maxY).toBeCloseTo(1.0, 2);
  });

  test('peak x is near the optimal tau', () => {
    const epsilon = 0.5;
    const curve = generateLafferCurve(epsilon);
    const peak = curve.reduce((a, b) => (a.y > b.y ? a : b));
    const expectedOptimal = 1 / (1 + epsilon);
    expect(peak.x).toBeCloseTo(expectedOptimal, 1);
  });

  test('all y values are non-negative', () => {
    const curve = generateLafferCurve(0.5);
    for (const p of curve) {
      expect(p.y).toBeGreaterThanOrEqual(0);
    }
  });
});

// ============================================================
// computeImpact()
// ============================================================

describe('computeImpact', () => {
  // --- Zero cut ---
  test('zero cut returns zero impact for all tax types', () => {
    const types: Array<'travail' | 'capital' | 'cotisationsPatronales' | 'tva'> = [
      'travail', 'capital', 'cotisationsPatronales', 'tva',
    ];
    for (const t of types) {
      const result = computeImpact(t, 0);
      expect(result.grossLoss).toBe(0);
      expect(result.dynamicRecovery).toBe(0);
      expect(result.crossEffect).toBe(0);
      expect(result.employmentGain).toBe(0);
      expect(result.netLoss).toBe(0);
      expect(result.selfFinancingTotal).toBe(0);
      expect(result.newJobs).toBe(0);
    }
  });

  // --- Positive grossLoss ---
  test('grossLoss equals recettes * cutPercent / 100', () => {
    const result = computeImpact('travail', 10);
    expect(result.grossLoss).toBeCloseTo(taxTypes.travail.recettes * 0.10, 5);
  });

  test('capital grossLoss computed correctly', () => {
    const result = computeImpact('capital', 15);
    expect(result.grossLoss).toBeCloseTo(taxTypes.capital.recettes * 0.15, 5);
  });

  // --- Self-financing rate ---
  test('self-financing rate is between 0 and 200% for reasonable cuts', () => {
    const types: Array<'travail' | 'capital' | 'cotisationsPatronales' | 'tva'> = [
      'travail', 'capital', 'cotisationsPatronales', 'tva',
    ];
    for (const t of types) {
      const result = computeImpact(t, 10);
      expect(result.selfFinancingTotal).toBeGreaterThanOrEqual(0);
      expect(result.selfFinancingTotal).toBeLessThanOrEqual(200);
    }
  });

  // --- Dynamic recovery ---
  test('dynamicRecovery is positive for all tax types with positive cut', () => {
    const types: Array<'travail' | 'capital' | 'cotisationsPatronales' | 'tva'> = [
      'travail', 'capital', 'cotisationsPatronales', 'tva',
    ];
    for (const t of types) {
      const result = computeImpact(t, 10);
      expect(result.dynamicRecovery).toBeGreaterThan(0);
    }
  });

  // --- Cross-elasticity only for capital ---
  test('crossEffect is zero for non-capital tax types', () => {
    expect(computeImpact('travail', 10).crossEffect).toBe(0);
    expect(computeImpact('cotisationsPatronales', 10).crossEffect).toBe(0);
    expect(computeImpact('tva', 10).crossEffect).toBe(0);
  });

  test('crossEffect is positive for capital with direct model', () => {
    // The direct model has crossElasticity = 0.05
    const settings: ModelSettings = { ...DEFAULT_SETTINGS, capitalElasticityModel: 'direct' };
    const result = computeImpact('capital', 10, settings);
    expect(result.crossEffect).toBeGreaterThan(0);
  });

  test('crossEffect is zero for capital with noCross model', () => {
    const settings: ModelSettings = { ...DEFAULT_SETTINGS, capitalElasticityModel: 'noCross' };
    const result = computeImpact('capital', 10, settings);
    expect(result.crossEffect).toBe(0);
  });

  // --- Employment gains only for cotisations patronales ---
  test('employmentGain is positive only for cotisationsPatronales', () => {
    expect(computeImpact('travail', 10).employmentGain).toBe(0);
    expect(computeImpact('capital', 10).employmentGain).toBe(0);
    expect(computeImpact('tva', 10).employmentGain).toBe(0);
    expect(computeImpact('cotisationsPatronales', 10).employmentGain).toBeGreaterThan(0);
  });

  test('newJobs are only created for cotisationsPatronales', () => {
    expect(computeImpact('travail', 10).newJobs).toBe(0);
    expect(computeImpact('capital', 10).newJobs).toBe(0);
    expect(computeImpact('tva', 10).newJobs).toBe(0);
    expect(computeImpact('cotisationsPatronales', 10).newJobs).toBeGreaterThan(0);
  });

  test('tvaInduced and irInduced are only non-zero for cotisationsPatronales', () => {
    expect(computeImpact('travail', 10).tvaInduced).toBe(0);
    expect(computeImpact('capital', 10).tvaInduced).toBe(0);
    const cotis = computeImpact('cotisationsPatronales', 10);
    expect(cotis.tvaInduced).toBeGreaterThan(0);
    expect(cotis.irInduced).toBeGreaterThan(0);
  });

  // --- Net loss is less than gross loss (self-financing recovers part) ---
  test('netLoss is less than grossLoss for all tax types', () => {
    const types: Array<'travail' | 'capital' | 'cotisationsPatronales' | 'tva'> = [
      'travail', 'capital', 'cotisationsPatronales', 'tva',
    ];
    for (const t of types) {
      const result = computeImpact(t, 10);
      if (result.grossLoss > 0) {
        expect(result.netLoss).toBeLessThan(result.grossLoss);
      }
    }
  });

  // --- Consistency: netLoss = grossLoss - recovered ---
  test('netLoss = grossLoss - dynamicRecovery - crossEffect - employmentGain', () => {
    const result = computeImpact('cotisationsPatronales', 10);
    const computed = result.grossLoss - result.dynamicRecovery - result.crossEffect - result.employmentGain;
    // netLoss is clamped to >= -grossLoss
    expect(result.netLoss).toBeCloseTo(Math.max(computed, -result.grossLoss), 5);
  });

  // --- Edge: very large cut (50%) ---
  test('50% cut produces sensible results without NaN or Infinity', () => {
    const types: Array<'travail' | 'capital' | 'cotisationsPatronales' | 'tva'> = [
      'travail', 'capital', 'cotisationsPatronales', 'tva',
    ];
    for (const t of types) {
      const result = computeImpact(t, 50);
      expect(Number.isFinite(result.grossLoss)).toBe(true);
      expect(Number.isFinite(result.dynamicRecovery)).toBe(true);
      expect(Number.isFinite(result.netLoss)).toBe(true);
      expect(Number.isFinite(result.selfFinancingTotal)).toBe(true);
      expect(result.grossLoss).toBeGreaterThan(0);
    }
  });

  // --- selfFinancingTotal is capped at 200 ---
  test('selfFinancingTotal is capped at 200', () => {
    // With an extreme scenario, self-financing should not exceed 200%
    const result = computeImpact('capital', 50, {
      ...DEFAULT_SETTINGS,
      selfFinancingModel: 'trabandt_uhlig',
      capitalElasticityModel: 'direct',
    });
    expect(result.selfFinancingTotal).toBeLessThanOrEqual(200);
  });

  // --- ETI vs Trabandt-Uhlig model comparison ---
  test('Trabandt-Uhlig gives higher self-financing than ETI for capital', () => {
    const eti = computeImpact('capital', 10, { ...DEFAULT_SETTINGS, selfFinancingModel: 'eti' });
    const tu = computeImpact('capital', 10, { ...DEFAULT_SETTINGS, selfFinancingModel: 'trabandt_uhlig' });
    // TU rate for capital is 0.79 vs ETI rate ~0.33
    expect(tu.selfFinancingTotal).toBeGreaterThan(eti.selfFinancingTotal);
  });

  // --- Different capital elasticity models ---
  test('withPayroll model gives highest self-financing for capital (ETI model)', () => {
    const direct = computeImpact('capital', 10, {
      ...DEFAULT_SETTINGS, selfFinancingModel: 'eti', capitalElasticityModel: 'direct',
    });
    const noCross = computeImpact('capital', 10, {
      ...DEFAULT_SETTINGS, selfFinancingModel: 'eti', capitalElasticityModel: 'noCross',
    });
    const withPayroll = computeImpact('capital', 10, {
      ...DEFAULT_SETTINGS, selfFinancingModel: 'eti', capitalElasticityModel: 'withPayroll',
    });
    // direct: eps=0.50 (+ cross=0.05), noCross: eps=0.75, withPayroll: eps=1.86
    // Higher epsilon => higher ETI self-financing
    // withPayroll has highest epsilon so highest selfFinancingTotal
    expect(withPayroll.dynamicRecovery).toBeGreaterThan(noCross.dynamicRecovery);
    expect(noCross.dynamicRecovery).toBeGreaterThan(direct.dynamicRecovery);
  });
});

// ============================================================
// computeCombinedImpact()
// ============================================================

describe('computeCombinedImpact', () => {
  test('zero scenario returns zero totals', () => {
    const result = computeCombinedImpact({ travail: 0, capital: 0, cotisationsPatronales: 0 });
    expect(result.totalGrossLoss).toBe(0);
    expect(result.totalNetLoss).toBe(0);
    expect(result.totalNewJobs).toBe(0);
  });

  test('totals are sums of individual impacts', () => {
    const scenario: ScenarioInput = { travail: 5, capital: 10, cotisationsPatronales: 8 };
    const result = computeCombinedImpact(scenario);
    const t = computeImpact('travail', 5);
    const c = computeImpact('capital', 10);
    const co = computeImpact('cotisationsPatronales', 8);
    expect(result.totalGrossLoss).toBeCloseTo(t.grossLoss + c.grossLoss + co.grossLoss, 5);
    expect(result.totalDynamicRecovery).toBeCloseTo(
      t.dynamicRecovery + c.dynamicRecovery + co.dynamicRecovery, 5
    );
  });

  test('TVA detail is always zero (not part of the scenario)', () => {
    const result = computeCombinedImpact({ travail: 10, capital: 10, cotisationsPatronales: 10 });
    expect(result.details.tva.grossLoss).toBe(0);
  });

  test('totalSelfFinancing is consistent with totals', () => {
    const scenario: ScenarioInput = { travail: 5, capital: 10, cotisationsPatronales: 8 };
    const result = computeCombinedImpact(scenario);
    if (result.totalGrossLoss > 0) {
      const expected = ((result.totalGrossLoss - result.totalNetLoss) / result.totalGrossLoss) * 100;
      expect(result.totalSelfFinancing).toBeCloseTo(expected, 5);
    }
  });
});

// ============================================================
// resolveScenarioAtYear()
// ============================================================

describe('resolveScenarioAtYear', () => {
  test('plain ScenarioInput is returned unchanged for any year', () => {
    const s: ScenarioInput = { travail: 5, capital: 10, cotisationsPatronales: 8 };
    expect(resolveScenarioAtYear(s, 0)).toEqual(s);
    expect(resolveScenarioAtYear(s, 5)).toEqual(s);
    expect(resolveScenarioAtYear(s, 20)).toEqual(s);
  });

  test('fixed trajectory returns targetCut at all years', () => {
    const s: TrajectoryScenario = {
      trajectory: 'fixed',
      targetCut: { travail: 10, capital: 15, cotisationsPatronales: 5 },
      rampYears: 5,
    };
    expect(resolveScenarioAtYear(s, 0)).toEqual(s.targetCut);
    expect(resolveScenarioAtYear(s, 10)).toEqual(s.targetCut);
  });

  test('progressive trajectory is zero at year 0', () => {
    const s: TrajectoryScenario = {
      trajectory: 'progressive',
      targetCut: { travail: 10, capital: 15, cotisationsPatronales: 5 },
      rampYears: 5,
    };
    const y0 = resolveScenarioAtYear(s, 0);
    expect(y0.travail).toBe(0);
    expect(y0.capital).toBe(0);
    expect(y0.cotisationsPatronales).toBe(0);
  });

  test('progressive trajectory reaches full target at rampYears', () => {
    const s: TrajectoryScenario = {
      trajectory: 'progressive',
      targetCut: { travail: 10, capital: 15, cotisationsPatronales: 5 },
      rampYears: 5,
    };
    const yFull = resolveScenarioAtYear(s, 5);
    expect(yFull.travail).toBeCloseTo(10, 5);
    expect(yFull.capital).toBeCloseTo(15, 5);
    expect(yFull.cotisationsPatronales).toBeCloseTo(5, 5);
  });

  test('progressive trajectory is partial at midpoint', () => {
    const s: TrajectoryScenario = {
      trajectory: 'progressive',
      targetCut: { travail: 10, capital: 20, cotisationsPatronales: 10 },
      rampYears: 10,
    };
    const yMid = resolveScenarioAtYear(s, 5);
    expect(yMid.travail).toBeCloseTo(5, 5);
    expect(yMid.capital).toBeCloseTo(10, 5);
    expect(yMid.cotisationsPatronales).toBeCloseTo(5, 5);
  });

  test('shock_rollback converges toward targetCut', () => {
    const s: TrajectoryScenario = {
      trajectory: 'shock_rollback',
      targetCut: { travail: 5, capital: 5, cotisationsPatronales: 5 },
      rampYears: 5,
      shockCut: { travail: 20, capital: 20, cotisationsPatronales: 20 },
      rollbackPerYear: 3,
    };
    // Year 1: should be at shockCut level
    const y1 = resolveScenarioAtYear(s, 1);
    expect(y1.travail).toBe(20);
    // Later years converge toward target
    const y10 = resolveScenarioAtYear(s, 10);
    expect(y10.travail).toBe(5);
    expect(y10.capital).toBe(5);
  });
});

// ============================================================
// computeTenYearProjection()
// ============================================================

describe('computeTenYearProjection', () => {
  const scenario: ScenarioInput = { travail: 5, capital: 10, cotisationsPatronales: 5 };

  test('produces 21 data points (year 0 through 20)', () => {
    const result = computeTenYearProjection(scenario);
    expect(result.central).toHaveLength(21);
    expect(result.pessimiste).toHaveLength(21);
    expect(result.optimiste).toHaveLength(21);
  });

  test('year 0 baseline is correct', () => {
    const result = computeTenYearProjection(scenario);
    const y0 = result.central[0];
    expect(y0.year).toBe(2026);
    expect(y0.statusQuoPib).toBe(macroData.pib);
    expect(y0.reformPib).toBe(macroData.pib);
    expect(y0.deltaGDP).toBe(0);
    expect(y0.revenueDiff).toBe(0);
    expect(y0.cumulativeRevenueDiff).toBe(0);
    expect(y0.cumulativeJobsCreated).toBe(0);
  });

  test('year 0 has zero channel decomposition', () => {
    const result = computeTenYearProjection(scenario);
    const y0 = result.central[0];
    expect(y0.ch1_realResponse).toBe(0);
    expect(y0.ch2_supplySide).toBe(0);
    expect(y0.ch3_extensive).toBe(0);
    expect(y0.ch4_signal).toBe(0);
    expect(y0.ch5_formalisation).toBe(0);
  });

  test('status quo PIB grows over time', () => {
    const result = computeTenYearProjection(scenario);
    for (let i = 2; i < result.central.length; i++) {
      expect(result.central[i].statusQuoPib).toBeGreaterThan(result.central[i - 1].statusQuoPib);
    }
  });

  test('reform PIB diverges positively from status quo when cuts are applied', () => {
    const result = computeTenYearProjection(scenario);
    // After a few years of phase-in, reform PIB should exceed status quo
    const y10 = result.central[10];
    expect(y10.reformPib).toBeGreaterThanOrEqual(y10.statusQuoPib);
  });

  test('deltaGDP is non-negative for tax cuts (positive scenario)', () => {
    const result = computeTenYearProjection(scenario);
    for (let i = 1; i < result.central.length; i++) {
      expect(result.central[i].deltaGDP).toBeGreaterThanOrEqual(0);
    }
  });

  test('central trajectory is not erratic (deltaGDP does not wildly oscillate)', () => {
    const result = computeTenYearProjection(scenario);
    // Check that year-over-year changes do not reverse sign frequently
    let reversals = 0;
    for (let i = 2; i < result.central.length; i++) {
      const prev = result.central[i - 1].deltaGDP;
      const curr = result.central[i].deltaGDP;
      const prevPrev = result.central[i - 2].deltaGDP;
      if ((curr - prev) * (prev - prevPrev) < -1) {
        reversals++;
      }
    }
    // Allow at most a few small reversals (typically zero for smooth models)
    expect(reversals).toBeLessThanOrEqual(3);
  });

  test('year labels are sequential from 2026', () => {
    const result = computeTenYearProjection(scenario);
    for (let i = 0; i < result.central.length; i++) {
      expect(result.central[i].year).toBe(2026 + i);
    }
  });

  test('confidence labels: year 0 is SOLIDE, years 1-3 are CALIBRE, years 4+ are EXTRAPOLATION', () => {
    const result = computeTenYearProjection(scenario);
    expect(result.central[0].confidenceLabel).toBe('SOLIDE');
    expect(result.central[1].confidenceLabel).toBe('CALIBRE');
    expect(result.central[3].confidenceLabel).toBe('CALIBRE');
    expect(result.central[4].confidenceLabel).toBe('EXTRAPOLATION');
    expect(result.central[20].confidenceLabel).toBe('EXTRAPOLATION');
  });

  test('supply side alternatives produce different results', () => {
    const result = computeTenYearProjection(scenario);
    const levelY10 = result.supplySideAlternatives.level[10];
    const permY10 = result.supplySideAlternatives.permanent[10];
    // Permanent should have higher reform PIB than level at year 10
    expect(permY10.reformPib).toBeGreaterThan(levelY10.reformPib);
  });

  test('validations are returned and non-empty', () => {
    const result = computeTenYearProjection(scenario);
    expect(result.validations.length).toBeGreaterThan(0);
    expect(result.validations[0]).toHaveProperty('episode');
    expect(result.validations[0]).toHaveProperty('pass');
  });

  test('zero scenario returns flat projection (no delta)', () => {
    const zeroScenario: ScenarioInput = { travail: 0, capital: 0, cotisationsPatronales: 0 };
    const result = computeTenYearProjection(zeroScenario);
    for (let i = 1; i < result.central.length; i++) {
      expect(result.central[i].deltaGDP).toBe(0);
      expect(result.central[i].activeCut).toBe(0);
    }
  });

  test('no NaN or Infinity in any projection field', () => {
    const result = computeTenYearProjection(scenario);
    for (const row of result.central) {
      for (const [key, val] of Object.entries(row)) {
        if (typeof val === 'number') {
          expect(Number.isFinite(val)).toBe(true);
        }
      }
    }
  });

  test('cumulative revenue diff accumulates over time', () => {
    const result = computeTenYearProjection(scenario);
    // cumulativeRevenueDiff at year i should be the sum of revenueDiff up to year i
    let cumul = 0;
    for (let i = 0; i < result.central.length; i++) {
      cumul += result.central[i].revenueDiff;
      expect(result.central[i].cumulativeRevenueDiff).toBeCloseTo(cumul, 0);
    }
  });
});

// ============================================================
// Preset consistency: CONSERVATIVE < CENTRAL < OPTIMISTIC
// ============================================================

describe('Preset consistency', () => {
  const scenario: ScenarioInput = { travail: 5, capital: 10, cotisationsPatronales: 5 };

  test('CONSERVATIVE self-financing <= CENTRAL self-financing at year 5', () => {
    const consResult = computeTenYearProjection(scenario, CONSERVATIVE_PRESET);
    const centResult = computeTenYearProjection(scenario, CENTRAL_PRESET);
    expect(consResult.central[5].selfFinPct).toBeLessThanOrEqual(centResult.central[5].selfFinPct + 1);
  });

  test('CENTRAL self-financing <= OPTIMISTIC self-financing at year 5', () => {
    const centResult = computeTenYearProjection(scenario, CENTRAL_PRESET);
    const optResult = computeTenYearProjection(scenario, OPTIMISTIC_PRESET);
    expect(centResult.central[5].selfFinPct).toBeLessThanOrEqual(optResult.central[5].selfFinPct + 1);
  });

  test('OPTIMISTIC produces higher deltaGDP than CONSERVATIVE at year 10', () => {
    const consResult = computeTenYearProjection(scenario, CONSERVATIVE_PRESET);
    const optResult = computeTenYearProjection(scenario, OPTIMISTIC_PRESET);
    expect(optResult.central[10].deltaGDP).toBeGreaterThan(consResult.central[10].deltaGDP);
  });

  test('OPTIMISTIC produces more jobs than CONSERVATIVE at year 10', () => {
    const consResult = computeTenYearProjection(scenario, CONSERVATIVE_PRESET);
    const optResult = computeTenYearProjection(scenario, OPTIMISTIC_PRESET);
    expect(optResult.central[10].cumulativeJobsCreated).toBeGreaterThan(
      consResult.central[10].cumulativeJobsCreated
    );
  });

  test('pessimiste <= central <= optimiste for deltaGDP within same settings', () => {
    const result = computeTenYearProjection(scenario, DEFAULT_SETTINGS);
    for (let i = 1; i < result.central.length; i++) {
      expect(result.pessimiste[i].deltaGDP).toBeLessThanOrEqual(result.central[i].deltaGDP + 0.2);
      expect(result.central[i].deltaGDP).toBeLessThanOrEqual(result.optimiste[i].deltaGDP + 0.2);
    }
  });
});

// ============================================================
// Edge cases: large cuts
// ============================================================

describe('Edge cases: large cuts', () => {
  test('50% cut across all types does not crash or produce NaN', () => {
    const scenario: ScenarioInput = { travail: 50, capital: 50, cotisationsPatronales: 50 };
    const result = computeTenYearProjection(scenario);
    expect(result.central).toHaveLength(21);
    for (const row of result.central) {
      expect(Number.isFinite(row.reformPib)).toBe(true);
      expect(Number.isFinite(row.reformRecettes)).toBe(true);
      expect(Number.isFinite(row.selfFinPct)).toBe(true);
    }
  });

  test('self-financing rate stays bounded for large cuts', () => {
    const scenario: ScenarioInput = { travail: 50, capital: 50, cotisationsPatronales: 50 };
    const result = computeTenYearProjection(scenario);
    for (const row of result.central) {
      // selfFinPct can theoretically be very high but should not be Infinity
      expect(Number.isFinite(row.selfFinPct)).toBe(true);
    }
  });

  test('very small cut (0.1%) produces proportionally small impact', () => {
    const small = computeImpact('travail', 0.1);
    const large = computeImpact('travail', 10);
    // Gross loss should scale roughly linearly
    expect(small.grossLoss).toBeCloseTo(large.grossLoss / 100, 1);
  });
});

// ============================================================
// validateAgainstHistory()
// ============================================================

describe('validateAgainstHistory', () => {
  test('returns multiple validation episodes', () => {
    const v = validateAgainstHistory();
    expect(v.length).toBeGreaterThan(3);
  });

  test('all episodes have required fields', () => {
    const v = validateAgainstHistory();
    for (const ep of v) {
      expect(typeof ep.episode).toBe('string');
      expect(typeof ep.year).toBe('string');
      expect(typeof ep.predicted).toBe('string');
      expect(typeof ep.observed).toBe('string');
      expect(typeof ep.pass).toBe('boolean');
    }
  });

  test('PFU 2017 episode passes validation', () => {
    const v = validateAgainstHistory();
    const pfu = v.find(e => e.episode.includes('PFU'));
    expect(pfu).toBeDefined();
    expect(pfu!.pass).toBe(true);
  });
});

// ============================================================
// CALIBRATED_EPSILONS
// ============================================================

describe('CALIBRATED_EPSILONS', () => {
  test('capital calibrated epsilons are positive and finite', () => {
    expect(CALIBRATED_EPSILONS.capital.median).toBeGreaterThan(0);
    expect(Number.isFinite(CALIBRATED_EPSILONS.capital.median)).toBe(true);
    expect(CALIBRATED_EPSILONS.capital.min).toBeGreaterThan(0);
    expect(CALIBRATED_EPSILONS.capital.max).toBeGreaterThan(0);
  });

  test('travail calibrated epsilons are positive', () => {
    expect(CALIBRATED_EPSILONS.travail.median).toBeGreaterThan(0);
  });

  test('min <= median <= max for capital', () => {
    expect(CALIBRATED_EPSILONS.capital.min).toBeLessThanOrEqual(CALIBRATED_EPSILONS.capital.median);
    expect(CALIBRATED_EPSILONS.capital.median).toBeLessThanOrEqual(CALIBRATED_EPSILONS.capital.max);
  });
});

// ============================================================
// Formatting functions
// ============================================================

describe('formatMd', () => {
  test('formats values >= 1 as Md (billions)', () => {
    expect(formatMd(5.3)).toBe('5.3 Md\u20ac');
    expect(formatMd(120)).toBe('120.0 Md\u20ac');
  });

  test('formats values < 1 as M (millions)', () => {
    expect(formatMd(0.5)).toBe('500 M\u20ac');
    expect(formatMd(0.123)).toBe('123 M\u20ac');
  });

  test('handles negative values >= 1 in absolute value', () => {
    expect(formatMd(-3.5)).toBe('-3.5 Md\u20ac');
  });

  test('handles negative values < 1 in absolute value', () => {
    expect(formatMd(-0.2)).toBe('-200 M\u20ac');
  });

  test('respects custom decimals', () => {
    expect(formatMd(5.123, 2)).toBe('5.12 Md\u20ac');
  });
});

describe('formatPct', () => {
  test('positive values get + prefix', () => {
    expect(formatPct(3.5)).toBe('+3.5%');
  });

  test('negative values get - prefix', () => {
    expect(formatPct(-2.1)).toBe('-2.1%');
  });

  test('zero gets + prefix', () => {
    expect(formatPct(0)).toBe('+0.0%');
  });

  test('custom decimals', () => {
    expect(formatPct(3.456, 2)).toBe('+3.46%');
  });
});

describe('formatNumber', () => {
  test('formats with French locale separators', () => {
    const formatted = formatNumber(1234567);
    // French locale uses various non-breaking spaces; just check digits are present
    expect(formatted.replace(/\s/g, '')).toBe('1234567');
  });
});

// ============================================================
// Trajectory scenarios in projection
// ============================================================

describe('Trajectory scenarios in projection', () => {
  test('progressive trajectory starts with zero impact and ramps up', () => {
    const s: TrajectoryScenario = {
      trajectory: 'progressive',
      targetCut: { travail: 10, capital: 10, cotisationsPatronales: 10 },
      rampYears: 5,
    };
    const result = computeTenYearProjection(s);
    // Year 1: cut is 1/5 of target; year 5: cut is full
    // activeCut at year 1 should be less than at year 5
    expect(result.central[1].activeCut).toBeLessThan(result.central[5].activeCut);
  });

  test('fixed trajectory applies full cut immediately', () => {
    const s: TrajectoryScenario = {
      trajectory: 'fixed',
      targetCut: { travail: 10, capital: 10, cotisationsPatronales: 10 },
      rampYears: 5,
    };
    const result = computeTenYearProjection(s);
    // After phase-in, activeCut should be the same at year 3 and year 10
    // (cutPhaseIn=1 for trajectory mode)
    expect(result.central[3].activeCut).toBeCloseTo(result.central[10].activeCut, 0);
  });
});

// ============================================================
// Purchasing power fields
// ============================================================

describe('Purchasing power in projection', () => {
  const scenario: ScenarioInput = { travail: 5, capital: 0, cotisationsPatronales: 5 };

  test('ppiDirect is positive when there are tax cuts', () => {
    const result = computeTenYearProjection(scenario);
    // After phase-in, direct purchasing power impact should be positive
    expect(result.central[5].ppiDirect).toBeGreaterThan(0);
  });

  test('ppiPerCapitaMonthly is positive for tax cuts', () => {
    const result = computeTenYearProjection(scenario);
    expect(result.central[5].ppiPerCapitaMonthly).toBeGreaterThan(0);
  });

  test('ppiInflationOffset is negative (erosion)', () => {
    const result = computeTenYearProjection(scenario);
    // Inflation offsets should be negative (representing erosion of purchasing power)
    expect(result.central[5].ppiInflationOffset).toBeLessThan(0);
  });
});
