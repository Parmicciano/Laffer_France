"use client";

import { useState, useMemo } from "react";
import {
  ComposedChart, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import {
  computeCombinedImpact, computeTenYearProjection,
  type ScenarioInput, type TrajectoryScenario, type AnyScenario, type TrajectoryType,
  getTargetCut, resolveScenarioAtYear,
} from "@/utils/calculations";
import { taxTypes, macroData, sources } from "@/data/economicData";
import {
  type ModelSettings,
  DEFAULT_SETTINGS,
  getProfileLabel,
  getProfileColor,
  countOptimisticParams,
  getCapitalElasticity,
} from "@/types/modelSettings";
import SettingsPanel from "./SettingsPanel";

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(0)}k` : n.toLocaleString("fr-FR");
}

const TT = { bg: "#fff", border: "1px solid #e2e8f0", radius: "8px", color: "#1e293b", fontSize: "11px" };

export default function Dashboard() {
  const [scenario, setScenario] = useState<ScenarioInput>({ travail: 1, capital: 6, cotisationsPatronales: 3 });
  const [activePreset, setActivePreset] = useState("Modérée");
  const [modelSettings, setModelSettings] = useState<ModelSettings>(DEFAULT_SETTINGS);
  // Mode trajectoire
  const [trajectoryMode, setTrajectoryMode] = useState(false);
  const [trajectoryType, setTrajectoryType] = useState<TrajectoryType>('progressive');
  const [rampYears, setRampYears] = useState(5);
  const [shockMultiplier, setShockMultiplier] = useState(2.0); // choc = target × multiplier
  const [rollbackPerYear, setRollbackPerYear] = useState(2);

  // Construire le scénario effectif
  const effectiveScenario: AnyScenario = useMemo(() => {
    if (!trajectoryMode) return scenario;
    if (trajectoryType === 'progressive') {
      return { trajectory: 'progressive', targetCut: scenario, rampYears } as TrajectoryScenario;
    }
    return {
      trajectory: 'shock_rollback',
      targetCut: scenario,
      shockCut: {
        travail: scenario.travail * shockMultiplier,
        capital: scenario.capital * shockMultiplier,
        cotisationsPatronales: scenario.cotisationsPatronales * shockMultiplier,
      },
      rampYears,
      rollbackPerYear,
    } as TrajectoryScenario;
  }, [trajectoryMode, trajectoryType, scenario, rampYears, shockMultiplier, rollbackPerYear]);

  const impact = useMemo(() => computeCombinedImpact(scenario, modelSettings), [scenario, modelSettings]);
  const tenYear = useMemo(() => computeTenYearProjection(effectiveScenario, modelSettings), [effectiveScenario, modelSettings]);

  // Comparaison : scénario fixe équivalent (même cible finale)
  const tenYearFixed = useMemo(() => {
    if (!trajectoryMode) return null;
    return computeTenYearProjection(scenario, modelSettings);
  }, [trajectoryMode, scenario, modelSettings]);
  const proj = tenYear.central;
  const last = proj[proj.length - 1];
  const hasChange = scenario.travail !== 0 || scenario.capital !== 0 || scenario.cotisationsPatronales !== 0;

  const y1 = proj[1];
  const y5 = proj[5];
  const y1NetCost = y1 ? Math.abs(y1.revenueDiff) : 0;
  const y5SelfFin = y5 ? y5.selfFinPct : 0;
  const lastSelfFin = last ? last.selfFinPct : 0;

  const crossoverYear = useMemo(() => {
    for (let i = 1; i < proj.length; i++) {
      if (proj[i].reformRecettes >= proj[i].statusQuoRecettes) return proj[i].year;
    }
    return null;
  }, [proj]);

  // Coût de la transition : dette supplémentaire et recettes perdues avant le crossover
  const transitionCost = useMemo(() => {
    const crossIdx = crossoverYear ? crossoverYear - 2024 : null;
    // Cumul des pertes de recettes (revenueDiff négatif) avant crossover
    let cumulLoss = 0;
    const limitIdx = crossIdx ?? proj.length - 1;
    for (let i = 1; i <= limitIdx && i < proj.length; i++) {
      if (proj[i].revenueDiff < 0) cumulLoss += proj[i].revenueDiff;
    }
    // Delta dette au crossover (ou à 10 ans si pas de crossover)
    const refIdx = crossIdx ?? Math.min(10, proj.length - 1);
    const debtDelta = proj[refIdx]
      ? proj[refIdx].reformDette - proj[refIdx].statusQuoDette
      : 0;
    // Mandats
    const yearsToBreakeven = crossIdx ?? null;
    const mandats = yearsToBreakeven ? Math.ceil(yearsToBreakeven / 5) : null;
    // Delta dette à an 5
    const debt5 = proj[5] ? proj[5].reformDette - proj[5].statusQuoDette : 0;
    const debt10 = proj[10] ? proj[10].reformDette - proj[10].statusQuoDette : 0;
    return { cumulLoss, debtDelta, yearsToBreakeven, mandats, debt5, debt10, refIdx };
  }, [proj, crossoverYear]);

  const coutNetData = proj.slice(1).map((p, i) => ({
    y: p.year,
    central: Math.round(p.revenueDiff * 10) / 10,
    pessimiste: Math.round(tenYear.pessimiste[i + 1].revenueDiff * 10) / 10,
    optimiste: Math.round(tenYear.optimiste[i + 1].revenueDiff * 10) / 10,
    ss_level: Math.round(tenYear.supplySideAlternatives.level[i + 1].revenueDiff * 10) / 10,
    ss_permanent: Math.round(tenYear.supplySideAlternatives.permanent[i + 1].revenueDiff * 10) / 10,
    ss_hybrid: Math.round(tenYear.supplySideAlternatives.hybrid[i + 1].revenueDiff * 10) / 10,
    // Comparaison fixe (si mode trajectoire)
    fixe: tenYearFixed ? Math.round(tenYearFixed.central[i + 1].revenueDiff * 10) / 10 : undefined,
  }));

  const recettesData = proj.map((p, i) => ({
    y: p.year,
    sq: Math.round(p.statusQuoRecettes * 10) / 10,
    rf: Math.round(p.reformRecettes * 10) / 10,
    pessimiste: Math.round(tenYear.pessimiste[i].reformRecettes * 10) / 10,
    optimiste: Math.round(tenYear.optimiste[i].reformRecettes * 10) / 10,
  }));

  // Pouvoir d'achat €/mois par habitant + dette supplémentaire émise
  const ppiChartData = proj.map((p) => ({
    y: p.year,
    ppiMonthly: p.ppiPerCapitaMonthly,
    debtDelta: p.cumulAdditionalDebt,
  }));

  const sliders: { key: keyof ScenarioInput; label: string; max: number }[] = [
    { key: "travail", label: "Travail (IR + CSG)", max: 50 },
    { key: "capital", label: "Capital (IS + PFU)", max: 50 },
    { key: "cotisationsPatronales", label: "Cotisations patronales", max: 50 },
  ];

  const presets = [
    { label: "Modérée", s: { travail: 1, capital: 6, cotisationsPatronales: 3 } },
    { label: "Ambitieuse", s: { travail: 5, capital: 15, cotisationsPatronales: 8 } },
    { label: "Radicale", s: { travail: 10, capital: 30, cotisationsPatronales: 15 } },
    { label: "Capital seul", s: { travail: 0, capital: 20, cotisationsPatronales: 0 } },
    { label: "Flat tax", s: { travail: 15, capital: 40, cotisationsPatronales: 20 } },
    { label: "Hausse +10%", s: { travail: -10, capital: -10, cotisationsPatronales: -10 } },
    { label: "Reset", s: { travail: 0, capital: 0, cotisationsPatronales: 0 } },
  ];

  // Waterfall décomposé par canal (année 1) — utilise activeCut (avec phase-in) pour cohérence
  const waterfallData = hasChange && y1 ? [
    { name: "Perte brute an 1", value: -y1.activeCut, color: "#ef4444" },
    { name: "Formalisation [Solide]", value: y1.ch5_formalisation, color: "#059669" },
    { name: "Réponse réelle [Solide]", value: y1.ch1_realResponse, color: "#10b981" },
    { name: "Marge extensive [Inférence]", value: y1.ch3_extensive, color: "#0ea5e9" },
    { name: "Signal [Spéculation]", value: y1.ch4_signal, color: "#6366f1" },
    { name: "Supply-side [Inférence]", value: y1.ch2_supplySide, color: "#8b5cf6" },
    { name: "Solde net an 1", value: y1.revenueDiff, color: "#1e40af" },
  ] : [];

  const profile = getProfileLabel(modelSettings);
  const profileColor = getProfileColor(profile);
  const { optimistic, total } = countOptimisticParams(modelSettings);
  const capitalOptimal = getCapitalElasticity(modelSettings.capitalElasticityModel);
  const ssModel = modelSettings.supplySideModel;

  return (
    <div className="py-8 space-y-0">

      {/* ACTE 1 — STAT CHOC */}
      <section className="pt-6 pb-14 text-center">
        <div className="text-slate-400 text-sm tracking-wide mb-2">La France prélève</div>
        <div className="text-7xl sm:text-8xl font-semibold text-slate-900 tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {macroData.taxToGdp}%
        </div>
        <div className="text-slate-400 text-sm mt-2">{"de son PIB en impôts et cotisations"}</div>
        <div className="flex items-center justify-center gap-4 mt-5 text-xs text-slate-400">
          <span>2e mondial</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>Moyenne OCDE : {macroData.taxToGdpOcde}%</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>{"Dernière en compétitivité fiscale"}</span>
        </div>
        <div className="max-w-lg mx-auto mt-7 px-4">
          <div className="relative h-2.5 rounded-full" style={{ background: "linear-gradient(to right, #10b981, #f59e0b, #ef4444)" }}>
            <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-slate-300"
              style={{ left: `${((macroData.taxToGdpOcde - 18) / (50 - 18)) * 100}%` }} />
            <div className="pulse-marker absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-amber-400 border-2 border-white shadow-md"
              style={{ left: `${((macroData.taxToGdp - 18) / (50 - 18)) * 100}%` }} />
          </div>
          <div className="flex justify-between text-[10px] mt-2 text-slate-400">
            <span>18%</span>
            <span>OCDE {macroData.taxToGdpOcde}%</span>
            <span className="text-amber-600 font-semibold">France {macroData.taxToGdp}%</span>
            <span>50%</span>
          </div>
        </div>
      </section>

      {/* PANNEAU HYPOTHÈSES */}
      <SettingsPanel settings={modelSettings} onChange={setModelSettings} />

      {/* ACTE 2 — CURSEURS */}
      <section className="pb-10">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Et si on ajustait ?</h2>
        <p className="text-sm text-slate-500 mb-6">Glissez vers la droite pour baisser, vers la gauche pour augmenter. Tout se recalcule.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {sliders.map((s) => {
            const val = scenario[s.key];
            const isHausse = val < 0;
            const isBaisse = val > 0;
            const absVal = Math.abs(val);
            const warnLevel = absVal > 35 ? 'red' : absVal > 20 ? 'orange' : null;
            return (
              <div key={s.key} className={`bg-white rounded-xl p-5 border shadow-sm ${
                warnLevel === 'red' ? 'border-red-300' : warnLevel === 'orange' ? 'border-amber-300' : 'border-slate-200'
              }`}>
                <div className="text-[13px] text-slate-500 mb-1">{s.label}</div>
                <div className="text-3xl font-semibold mb-3" style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: isHausse ? "#ef4444" : isBaisse ? "#10b981" : "#64748b",
                }}>
                  {val > 0 ? `−${val}%` : val < 0 ? `+${Math.abs(val)}%` : "0%"}
                </div>
                {val !== 0 && (
                  <div className="text-[10px] font-medium mb-2" style={{ color: isHausse ? "#ef4444" : "#10b981" }}>
                    {isHausse ? "HAUSSE" : "BAISSE"} {"d'impôt"}
                  </div>
                )}
                <input type="range" min={-s.max} max={s.max} value={val}
                  onChange={(e) => { setScenario({ ...scenario, [s.key]: Number(e.target.value) }); setActivePreset(""); }}
                  className="w-full" />
                <div className="flex justify-between text-[10px] mt-2 text-slate-400">
                  <span className="text-red-400">Hausse +{s.max}%</span>
                  <span>{taxTypes[s.key].recettes} {"Md€"}</span>
                  <span className="text-emerald-500">{"Baisse −"}{s.max}%</span>
                </div>
                {warnLevel === 'orange' && (
                  <div className="text-[9px] text-amber-600 mt-2 bg-amber-50 px-2 py-1 rounded">
                    {"⚠️ Au-delà de 20%, les élasticités sont extrapolées. Résultats indicatifs."}
                  </div>
                )}
                {warnLevel === 'red' && (
                  <div className="text-[9px] text-red-600 mt-2 bg-red-50 px-2 py-1 rounded">
                    {"🔴 Variation extrême. Les élasticités marginales ne s'appliquent plus."}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button key={p.label}
              onClick={() => { setScenario(p.s); setActivePreset(p.label); }}
              className={`rounded-full px-4 py-1.5 text-xs font-medium border transition-all ${
                activePreset === p.label
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
              }`}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Mode trajectoire */}
        <div className="mt-5 bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-3 mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={trajectoryMode} onChange={(e) => setTrajectoryMode(e.target.checked)} className="accent-blue-500" />
              <span className="text-sm font-semibold text-slate-700">{"Mode trajectoire"}</span>
            </label>
            <span className="text-[10px] text-slate-400">{"Comparer progressif vs choc vs fixe"}</span>
          </div>
          {trajectoryMode && (
            <div className="space-y-3">
              <div className="flex gap-2">
                {([['progressive', 'Progressif'], ['shock_rollback', 'Choc + rollback']] as const).map(([val, label]) => (
                  <button key={val}
                    onClick={() => setTrajectoryType(val)}
                    className={`rounded-full px-4 py-1.5 text-xs font-medium border transition-all ${
                      trajectoryType === val ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-slate-200 text-slate-500"
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-slate-600 mb-1">{"Durée de la rampe : "}<span className="font-semibold">{rampYears} ans</span></div>
                  <input type="range" min="2" max="10" step="1" value={rampYears} onChange={(e) => setRampYears(Number(e.target.value))} className="w-full" />
                </div>
                {trajectoryType === 'shock_rollback' && (
                  <>
                    <div>
                      <div className="text-xs text-slate-600 mb-1">{"Intensité du choc : "}<span className="font-semibold">{shockMultiplier.toFixed(1)}× la cible</span></div>
                      <input type="range" min="1.5" max="3.0" step="0.1" value={shockMultiplier} onChange={(e) => setShockMultiplier(Number(e.target.value))} className="w-full" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-600 mb-1">{"Rollback : "}<span className="font-semibold">{rollbackPerYear}%/an</span></div>
                      <input type="range" min="1" max="5" step="1" value={rollbackPerYear} onChange={(e) => setRollbackPerYear(Number(e.target.value))} className="w-full" />
                    </div>
                  </>
                )}
              </div>
              {/* Mini sparkline trajectoire */}
              <div className="flex items-end gap-0.5 h-8">
                {Array.from({ length: 20 }, (_, i) => {
                  const yr = resolveScenarioAtYear(effectiveScenario, i + 1);
                  const maxCut = Math.max(Math.abs(scenario.travail), Math.abs(scenario.capital), Math.abs(scenario.cotisationsPatronales)) * (trajectoryType === 'shock_rollback' ? shockMultiplier : 1);
                  const h = maxCut > 0 ? (yr.capital / maxCut) * 100 : 0;
                  return <div key={i} className="flex-1 bg-blue-400 rounded-t-sm" style={{ height: `${Math.max(2, Math.abs(h))}%`, opacity: 0.5 + Math.abs(h) / 200 }} />;
                })}
              </div>
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>An 1</span>
                <span>{"Trajectoire du capital (aperçu)"}</span>
                <span>An 20</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {hasChange && (
        <>
          {/* Bannière hors domaine si perte brute > 15% PIB */}
          {impact.totalGrossLoss > macroData.pib * 0.15 && (
            <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-xl p-4 text-sm text-red-800">
              <div className="font-bold mb-1">{"⚠️ Scénario hors domaine de validité"}</div>
              <div className="text-xs">
                {"Ce scénario implique une perte brute de "}{impact.totalGrossLoss.toFixed(0)}{" Md€, soit "}
                {((impact.totalGrossLoss / macroData.pib) * 100).toFixed(1)}{"% du PIB. "}
                {"Aucun modèle à élasticités constantes n'est valide à cette échelle. Les résultats ci-dessous sont présentés à titre illustratif uniquement."}
              </div>
            </div>
          )}

          {/* ACTE 3 — IMPACT RÉEL */}
          <section className="pb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-5">{"L'impact réel"}</h2>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="space-y-3 mb-8">
                {waterfallData.map((d, i) => {
                  const maxAbs = (y1 ? y1.activeCut : impact.totalGrossLoss) || 1;
                  const pct = Math.min(Math.abs(d.value) / maxAbs * 100, 100);
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] text-slate-500">{d.name}</span>
                        <span className="text-sm font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace", color: d.color }}>
                          {d.value >= 0 ? "+" : ""}{d.value.toFixed(1)} {"Md€"}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-100">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: d.color, opacity: 0.75 }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Autofinancement par palier */}
              <div className="pt-5 border-t border-slate-100">
                <div className="text-center mb-4">
                  <span className="text-5xl font-semibold text-emerald-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {Math.round(y5SelfFin)}%
                  </span>
                  <div className="text-lg text-slate-500 mt-1">
                    {"récupéré en 5 ans"}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1 flex-wrap">
                  {[
                    { y: 5, label: "5 ans" },
                    { y: 8, label: "8 ans" },
                    { y: 10, label: "10 ans" },
                    { y: 15, label: "15 ans" },
                    { y: 20, label: "20 ans" },
                  ].map(({ y, label }) => {
                    const p = proj[y];
                    if (!p) return null;
                    const sf = p.selfFinPct;
                    const over100 = sf >= 100;
                    return (
                      <div key={y} className="text-center px-3 py-2 min-w-[70px]">
                        <div className="text-xl font-semibold" style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          color: over100 ? "#059669" : sf > 80 ? "#10b981" : sf > 50 ? "#3b82f6" : "#64748b",
                        }}>
                          {Math.round(sf)}%
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{label}</div>
                        <div className="mx-auto mt-1 h-[3px] rounded-full" style={{
                          width: `${Math.min(sf, 100)}%`,
                          maxWidth: "48px",
                          background: over100 ? "#059669" : sf > 80 ? "#10b981" : sf > 50 ? "#3b82f6" : "#94a3b8",
                        }} />
                      </div>
                    );
                  })}
                </div>
                <div className="text-center text-[10px] text-slate-400 mt-2">
                  {lastSelfFin >= 100
                    ? "La baisse se rembourse intégralement et génère un excédent."
                    : "L'autofinancement monte chaque année grâce aux 5 canaux."}
                </div>

                {/* Décomposition par canal — timeline stacked */}
                {modelSettings.fastChannelsEnabled && (
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-600 mb-3">{"Décomposition par canal (Md€ récupérés)"}</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px] min-w-[500px]">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-100">
                            <th className="text-left py-1 pr-2">Canal</th>
                            <th className="text-center py-1 px-1">Confiance</th>
                            {[1, 3, 5, 10, 15, 20].map(y => (
                              <th key={y} className="text-right py-1 px-1">An {y}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { key: 'ch5_formalisation' as const, name: "Formalisation", color: "#059669", conf: "Solide" },
                            { key: 'ch1_realResponse' as const, name: "Réponse réelle", color: "#10b981", conf: "Solide" },
                            { key: 'ch3_extensive' as const, name: "Marge extensive", color: "#0ea5e9", conf: "Inférence" },
                            { key: 'ch4_signal' as const, name: "Signal", color: "#6366f1", conf: "Spéculation" },
                            { key: 'ch2_supplySide' as const, name: "Supply-side", color: "#8b5cf6", conf: "Inférence" },
                          ].map(ch => (
                            <tr key={ch.key} className="border-b border-slate-50">
                              <td className="py-1.5 pr-2 font-medium" style={{ color: ch.color }}>{ch.name}</td>
                              <td className="py-1.5 px-1 text-center">
                                <span className={`text-[8px] px-1 py-0.5 rounded ${
                                  ch.conf === 'Solide' ? 'bg-emerald-50 text-emerald-600' :
                                  ch.conf === 'Inférence' ? 'bg-amber-50 text-amber-600' :
                                  'bg-red-50 text-red-500'
                                }`}>{ch.conf}</span>
                              </td>
                              {[1, 3, 5, 10, 15, 20].map(y => {
                                const p = proj[y];
                                const v = p ? p[ch.key] : 0;
                                return (
                                  <td key={y} className="py-1.5 px-1 text-right font-mono" style={{ color: ch.color }}>
                                    {v > 0 ? `+${v.toFixed(1)}` : v === 0 ? "—" : v.toFixed(1)}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                          <tr className="border-t border-slate-200 font-semibold text-slate-700">
                            <td className="py-1.5 pr-2" colSpan={2}>Total</td>
                            {[1, 3, 5, 10, 15, 20].map(y => {
                              const p = proj[y];
                              if (!p) return <td key={y} className="py-1.5 px-1 text-right">—</td>;
                              const tot = p.ch1_realResponse + p.ch2_supplySide + p.ch3_extensive + p.ch4_signal + p.ch5_formalisation;
                              return (
                                <td key={y} className="py-1.5 px-1 text-right font-mono">
                                  +{tot.toFixed(1)}
                                </td>
                              );
                            })}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="flex gap-3 mt-2 text-[9px] text-slate-400">
                      <span>{"An 1-2 : effets comptables et de signal"}</span>
                      <span>{"•"}</span>
                      <span>{"An 3-5 : effets comportementaux réels"}</span>
                      <span>{"•"}</span>
                      <span>{"An 5+ : croissance induite"}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* LE PRIX DE LA TRANSITION */}
          <section className="pb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Le prix de la transition</h2>
            <p className="text-sm text-slate-500 mb-5">
              {"Une baisse d'impôt ne s'autofinance pas instantanément. Voici ce que coûte l'attente."}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Délai de crossover */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">{"Retour à l'équilibre"}</div>
                {transitionCost.yearsToBreakeven ? (
                  <>
                    <div className="text-3xl font-semibold text-slate-900" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {transitionCost.yearsToBreakeven} ans
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      soit {transitionCost.mandats} mandat{transitionCost.mandats && transitionCost.mandats > 1 ? "s" : ""} présidentiel{transitionCost.mandats && transitionCost.mandats > 1 ? "s" : ""}
                    </div>
                    <div className="text-[10px] text-amber-600 mt-2">
                      {"Implication : la réforme doit survivre à l'alternance pour produire ses effets."}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-semibold text-red-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {"Pas atteint"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {"Les recettes ne rattrapent pas le statu quo sur 20 ans avec ces hypothèses"}
                    </div>
                  </>
                )}
              </div>

              {/* Dette supplémentaire à 5 ans */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">{"Dette supplémentaire à 5 ans"}</div>
                <div className="text-3xl font-semibold" style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: transitionCost.debt5 > 0 ? "#ef4444" : "#10b981",
                }}>
                  {transitionCost.debt5 > 0 ? "+" : ""}{Math.round(transitionCost.debt5)} {"Md€"}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {"vs statu quo (fin du 1er mandat)"}
                </div>
                <div className="text-[10px] text-slate-400 mt-2">
                  {"soit "}{macroData.dette > 0 ? `${((transitionCost.debt5 / macroData.dette) * 100).toFixed(1)}% de la dette actuelle` : ""}
                </div>
                {Math.abs(transitionCost.debt5) > 0 && (
                  <div className="text-[10px] text-slate-500 mt-1 bg-slate-50 px-2 py-1 rounded">
                    {"≈ "}{(Math.abs(transitionCost.debt5) / 350 * 100).toFixed(1)}{"% du budget retraites annuel"}
                    {" · "}{(Math.abs(transitionCost.debt5) / 83 * 100).toFixed(0)}{"% des niches fiscales"}
                  </div>
                )}
              </div>

              {/* Dette supplémentaire à 10 ans */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">{"Dette supplémentaire à 10 ans"}</div>
                <div className="text-3xl font-semibold" style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: transitionCost.debt10 > 0 ? "#ef4444" : "#10b981",
                }}>
                  {transitionCost.debt10 > 0 ? "+" : ""}{Math.round(transitionCost.debt10)} {"Md€"}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {"vs statu quo (fin du 2e mandat)"}
                </div>
                {transitionCost.yearsToBreakeven && transitionCost.yearsToBreakeven <= 10 ? (
                  <div className="text-[10px] text-emerald-600 mt-2">
                    {"La dette commence à se résorber après le crossover (année "}{transitionCost.yearsToBreakeven}{")"}
                  </div>
                ) : (
                  <div className="text-[10px] text-amber-600 mt-2">
                    {"La dette continue de croître — le crossover n'est pas encore atteint"}
                  </div>
                )}
                {Math.abs(transitionCost.debt10) > 0 && (
                  <div className="text-[10px] text-slate-500 mt-1 bg-slate-50 px-2 py-1 rounded">
                    {"≈ "}{(Math.abs(transitionCost.debt10) / 55).toFixed(1)}{"× la charge annuelle de la dette"}
                    {" · "}{(Math.abs(transitionCost.debt10) / 100 * 100).toFixed(0)}{"% des dépenses admin. annuelles"}
                  </div>
                )}
              </div>

              {/* Pouvoir d'achat gagné */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">{"Pouvoir d'achat gagné"}</div>
                {(() => {
                  const ppi5 = proj[5];
                  const monthly = ppi5 ? ppi5.ppiPerCapitaMonthly : 0;
                  const direct5 = ppi5 ? Math.round((ppi5.ppiDirect * 1e9) / 68_000_000 / 12) : 0;
                  const empl5 = ppi5 ? Math.round((ppi5.ppiEmployment * 1e9) / 68_000_000 / 12) : 0;
                  const growth5 = ppi5 ? Math.round((ppi5.ppiGrowth * 1e9) / 68_000_000 / 12) : 0;
                  return (
                    <>
                      <div className="text-3xl font-semibold" style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        color: monthly > 0 ? "#059669" : monthly < 0 ? "#ef4444" : "#64748b",
                      }}>
                        {monthly > 0 ? "+" : ""}{monthly} {"€/mois"}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {"par habitant, à 5 ans"}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-2 space-y-0.5">
                        <div>{"Impôt direct : "}{direct5 > 0 ? "+" : ""}{direct5} {"€/mois"}</div>
                        <div>{"Emploi : "}{empl5 > 0 ? "+" : ""}{empl5} {"€/mois"}</div>
                        <div>{"Croissance : "}{growth5 > 0 ? "+" : ""}{growth5} {"€/mois"}</div>
                      </div>
                      <div className="text-[9px] text-slate-400 mt-2 italic">
                        {"Moyenne par habitant — les gains varient selon le revenu"}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Recettes cumulées perdues */}
            {transitionCost.cumulLoss < 0 && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-red-500 text-lg">{"📉"}</span>
                  <div>
                    <div className="font-semibold text-red-800">
                      {"Recettes perdues pendant la transition : "}{Math.abs(Math.round(transitionCost.cumulLoss))}{" Md€ cumulés"}
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      {"C'est le \"ticket d'entrée\" de la réforme. "}
                      {transitionCost.yearsToBreakeven
                        ? `Après ${transitionCost.yearsToBreakeven} ans, les recettes dépassent le statu quo et le bilan s'améliore chaque année.`
                        : "Avec ces hypothèses, les recettes ne rattrapent pas le statu quo sur la période simulée."}
                    </div>
                    <div className="text-[10px] text-red-500/80 mt-2 bg-red-50 px-2 py-1 rounded border border-red-100">
                      {"Pour comparaison : niches fiscales = 83 Md€/an · charge de la dette = 55 Md€/an · retraites = 350 Md€/an · dépenses de fonctionnement = ~100 Md€/an"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ACTE 4 — PROJECTION 20 ANS */}
          <section className="pb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Le temps joue pour vous</h2>
            <p className="text-sm text-slate-500 mb-6">
              {"L'autofinancement monte chaque année. La bande montre l'incertitude pessimiste / optimiste. Les lignes pointillées montrent les modèles supply-side alternatifs."}
            </p>

            {/* Fan chart — coût net + trajectoires supply-side */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-5">
              <div className="text-sm font-semibold text-slate-800 mb-0.5">{"Coût réel net par an"}</div>
              <div className="text-[11px] text-slate-400 mb-4">
                {"Recettes réforme − statu quo. Ligne 0 = autofinancé 100%. Pointillés = modèles supply-side alternatifs."}
              </div>
              <ResponsiveContainer width="100%" height={380}>
                <ComposedChart data={coutNetData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="y" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#e2e8f0" }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#e2e8f0" }}
                    label={{ value: "Md€/an", angle: -90, position: "insideLeft", style: { fill: "#94a3b8", fontSize: 10 } }} />
                  <Tooltip contentStyle={{ backgroundColor: TT.bg, border: TT.border, borderRadius: TT.radius, color: TT.color, fontSize: TT.fontSize }}
                    formatter={(v, name) => {
                      const labels: Record<string, string> = {
                        central: trajectoryMode ? `Central (${trajectoryType === 'progressive' ? 'progressif' : 'choc+rollback'})` : "Central",
                        pessimiste: "Pessimiste",
                        optimiste: "Optimiste",
                        ss_level: "Effet de niveau (Solow)",
                        ss_permanent: "Effet permanent (Romer)",
                        ss_hybrid: "Hybride",
                        fixe: "Coupe fixe (comparaison)",
                      };
                      return [`${Number(v).toFixed(1)} Md€/an`, labels[String(name)] || String(name)];
                    }} />
                  <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5}
                    label={{ value: "Autofinancé 100%", position: "right", fill: "#94a3b8", fontSize: 9 }} />
                  {crossoverYear && <ReferenceLine x={crossoverYear} stroke="#10b981" strokeDasharray="4 3"
                    label={{ value: "Crossover", position: "top", fill: "#10b981", fontSize: 9 }} />}
                  {/* Marqueurs mandats présidentiels */}
                  <ReferenceLine x={2029} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="2 4"
                    label={{ value: "Mandat 1", position: "insideTopLeft", fill: "#94a3b8", fontSize: 8 }} />
                  <ReferenceLine x={2034} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="2 4"
                    label={{ value: "Mandat 2", position: "insideTopLeft", fill: "#94a3b8", fontSize: 8 }} />
                  <ReferenceLine x={2039} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="2 4"
                    label={{ value: "Mandat 3", position: "insideTopLeft", fill: "#94a3b8", fontSize: 8 }} />
                  <Line type="monotone" dataKey="pessimiste" stroke="#fca5a5" strokeWidth={1} strokeDasharray="4 3" dot={false} name="pessimiste" />
                  <Line type="monotone" dataKey="optimiste" stroke="#6ee7b7" strokeWidth={1} strokeDasharray="4 3" dot={false} name="optimiste" />
                  {ssModel !== 'level' && (
                    <Line type="monotone" dataKey="ss_level" stroke="#94a3b8" strokeWidth={1} strokeDasharray="6 4" dot={false} name="ss_level" opacity={0.5} />
                  )}
                  {ssModel !== 'permanent' && (
                    <Line type="monotone" dataKey="ss_permanent" stroke="#94a3b8" strokeWidth={1} strokeDasharray="2 3" dot={false} name="ss_permanent" opacity={0.5} />
                  )}
                  {ssModel !== 'hybrid' && (
                    <Line type="monotone" dataKey="ss_hybrid" stroke="#94a3b8" strokeWidth={1} strokeDasharray="8 2" dot={false} name="ss_hybrid" opacity={0.5} />
                  )}
                  <Line type="monotone" dataKey="central" stroke="#2563eb" strokeWidth={2.5} dot={false} name="central" />
                  {trajectoryMode && (
                    <Line type="monotone" dataKey="fixe" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 3" dot={false} name="fixe" />
                  )}
                  <Legend wrapperStyle={{ fontSize: "10px" }}
                    formatter={(v) => {
                      const m: Record<string, string> = {
                        central: trajectoryMode ? "Trajectoire choisie" : "Central (modèle choisi)",
                        pessimiste: "Pessimiste",
                        optimiste: "Optimiste",
                        ss_level: "Alt: Niveau (Solow)",
                        ss_permanent: "Alt: Permanent (Romer)",
                        ss_hybrid: "Alt: Hybride",
                        fixe: "Coupe fixe (comparaison)",
                      };
                      return m[String(v)] || v;
                    }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Recettes SQ vs réforme */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-6">
              <div className="text-sm font-semibold text-slate-800 mb-0.5">{"Recettes de l'État : statu quo vs réforme"}</div>
              <div className="text-[11px] text-slate-400 mb-4">{"Le gap se réduit au fil du temps."}</div>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={recettesData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="y" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#e2e8f0" }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} domain={["dataMin - 20", "dataMax + 10"]}
                    axisLine={{ stroke: "#e2e8f0" }}
                    label={{ value: "Md€", angle: -90, position: "insideLeft", style: { fill: "#94a3b8", fontSize: 10 } }} />
                  <Tooltip contentStyle={{ backgroundColor: TT.bg, border: TT.border, borderRadius: TT.radius, color: TT.color, fontSize: TT.fontSize }}
                    formatter={(v, name) => {
                      const labels: Record<string, string> = { sq: "Sans réforme", rf: "Avec réforme (central)", pessimiste: "Pessimiste", optimiste: "Optimiste" };
                      return [`${Number(v).toFixed(1)} Md€`, labels[String(name)] || String(name)];
                    }} />
                  {crossoverYear && <ReferenceLine x={crossoverYear} stroke="#10b981" strokeDasharray="3 3" />}
                  <Line type="monotone" dataKey="pessimiste" stroke="#fca5a5" strokeWidth={1} strokeDasharray="4 3" dot={false} name="pessimiste" />
                  <Line type="monotone" dataKey="optimiste" stroke="#6ee7b7" strokeWidth={1} strokeDasharray="4 3" dot={false} name="optimiste" />
                  <Line type="monotone" dataKey="sq" stroke="#94a3b8" strokeWidth={2} strokeDasharray="6 4" dot={false} name="sq" />
                  <Line type="monotone" dataKey="rf" stroke="#059669" strokeWidth={2.5} dot={false} name="rf" />
                  <Legend wrapperStyle={{ fontSize: "11px" }}
                    formatter={(v) => ({ sq: "Sans réforme", rf: "Avec réforme", pessimiste: "Pessimiste", optimiste: "Optimiste" }[String(v)] || v)} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Pouvoir d'achat par foyer + dette de transition */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              {/* Graphe pouvoir d'achat €/mois par habitant */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="text-sm font-semibold text-slate-800 mb-0.5">{"Pouvoir d'achat gagné par habitant"}</div>
                <div className="text-[11px] text-slate-400 mb-4">{"€/mois par habitant — moyenne (les gains varient selon le revenu)"}</div>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={ppiChartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="y" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#e2e8f0" }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#e2e8f0" }}
                      label={{ value: "€/mois", angle: -90, position: "insideLeft", style: { fill: "#94a3b8", fontSize: 10 } }} />
                    <Tooltip contentStyle={{ backgroundColor: TT.bg, border: TT.border, borderRadius: TT.radius, color: TT.color, fontSize: TT.fontSize }}
                      formatter={(v) => [`${Number(v) > 0 ? "+" : ""}${Number(v)} €/mois`, "Par foyer"]} />
                    <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
                    <Line type="monotone" dataKey="ppiMonthly" stroke="#059669" strokeWidth={2.5} dot={false} name="ppiMonthly" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Graphe dette supplémentaire vs statu quo */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="text-sm font-semibold text-slate-800 mb-0.5">{"Dette supplémentaire vs statu quo"}</div>
                <div className="text-[11px] text-slate-400 mb-4">{"Md€ — cumul des déficits additionnels (réforme vs statu quo)"}</div>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={ppiChartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="y" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#e2e8f0" }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#e2e8f0" }}
                      label={{ value: "Md€", angle: -90, position: "insideLeft", style: { fill: "#94a3b8", fontSize: 10 } }} />
                    <Tooltip contentStyle={{ backgroundColor: TT.bg, border: TT.border, borderRadius: TT.radius, color: TT.color, fontSize: TT.fontSize }}
                      formatter={(v) => [`${Number(v) > 0 ? "+" : ""}${Number(v)} Md€`, "Dette supplémentaire"]} />
                    <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
                    {crossoverYear && <ReferenceLine x={crossoverYear} stroke="#10b981" strokeDasharray="4 3"
                      label={{ value: "Crossover", position: "top", fill: "#10b981", fontSize: 9 }} />}
                    <Line type="monotone" dataKey="debtDelta" stroke="#ef4444" strokeWidth={2.5} dot={false} name="debtDelta" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* KPI année 20 */}
            <div className="flex flex-wrap items-stretch bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {[
                { value: `+${last.deltaGDP.toFixed(0)} Md€/an`, label: "PIB additionnel (an 20)" },
                { value: `+${fmt(last.cumulativeJobsCreated)}`, label: "Emplois (stock an 20)" },
                { value: `~${Math.round(lastSelfFin)}%`, label: "Autofinancé (an 20)" },
                { value: `${last.revenueDiff > 0 ? "+" : ""}${last.revenueDiff.toFixed(1)} Md€/an`, label: last.revenueDiff >= 0 ? "Excédent net (an 20)" : "Coût net résiduel (an 20)" },
                { value: `${last.ppiPerCapitaMonthly > 0 ? "+" : ""}${last.ppiPerCapitaMonthly} €/mois`, label: "Pouvoir d'achat / habitant (an 20)" },
              ].map((s, i) => (
                <div key={i} className="flex-1 min-w-[130px] py-5 px-3 text-center border-r border-slate-100 last:border-r-0">
                  <div className="text-lg font-semibold text-slate-900" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{s.label}</div>
                  <div className="mx-auto mt-2 h-[3px] w-4 rounded-full bg-amber-400" />
                </div>
              ))}
            </div>
            <div className="text-center text-[10px] text-slate-400 mt-2">
              {"Barre ambre = extrapolation (incertitude croissante au-delà de 5 ans)"}
            </div>
          </section>

          {/* ACTE 5 — L'HISTOIRE LE CONFIRME */}
          <section className="pb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-5">{"L'histoire française le confirme"}</h2>

            <div className="relative px-4 mb-8">
              <div className="absolute top-4 left-8 right-8 h-px bg-slate-200" />
              <div className="flex justify-between relative">
                {[
                  { year: "1982", label: "IGF créé", sub: "Début exode", type: "hausse" as const },
                  { year: "1988", label: "ISF recréé", sub: "19k départs", type: "hausse" as const },
                  { year: "2012", label: "Taxe 75%", sub: "260M vs 500M", type: "hausse" as const },
                  { year: "2013", label: "PFL aboli", sub: "Recettes en baisse", type: "hausse" as const },
                  { year: "2017", label: "PFU + IFI", sub: "Recettes en hausse", type: "baisse" as const },
                ].map((e, i) => (
                  <div key={i} className="flex flex-col items-center text-center" style={{ width: "18%" }}>
                    <div className={`w-3 h-3 rounded-full border-2 z-10 ${e.type === "hausse" ? "bg-red-500 border-red-300" : "bg-emerald-500 border-emerald-300"}`} />
                    <div className="text-xs font-bold text-slate-800 mt-2">{e.year}</div>
                    <div className="text-[11px] font-medium mt-0.5" style={{ color: e.type === "hausse" ? "#ef4444" : "#10b981" }}>{e.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{e.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { year: "2012", title: "Taxe à 75%", type: "hausse" as const, result: "Objectif 500 M€/an. Résultat : ~260 M€, exode, abandon en 2015." },
                { year: "2013", title: "Fin du PFL", type: "hausse" as const, result: "Dividendes au barème → distributions chutent 41% → recettes en BAISSE." },
                { year: "2017", title: "Flat tax 30% + IFI", type: "baisse" as const, result: "Taux réduit mais recettes capital en HAUSSE : dividendes 14.3 → 23.2 Md€." },
              ].map((e, i) => (
                <div key={i} className={`bg-white rounded-xl p-4 border shadow-sm ${e.type === "hausse" ? "border-l-4 border-l-red-400 border-t-slate-200 border-r-slate-200 border-b-slate-200" : "border-l-4 border-l-emerald-400 border-t-slate-200 border-r-slate-200 border-b-slate-200"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold text-slate-800">{e.year}</span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${e.type === "hausse" ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"}`}>
                      {e.type === "hausse" ? "Hausse" : "Baisse"}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-800 mb-1">{e.title}</div>
                  <p className="text-xs text-slate-500">{e.result}</p>
                </div>
              ))}
            </div>
          </section>

          {/* TRANSPARENCE MÉTHODOLOGIQUE */}
          <section className="pb-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500">
              <div className="flex items-center gap-2 mb-2">
                <span>{"⚠️"}</span>
                <span className="font-semibold text-slate-700">{"Transparence méthodologique"}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  {"Profil d'hypothèses : "}
                  <span className="font-semibold" style={{ color: profileColor }}>{profile}</span>
                </div>
                <div>
                  {optimistic} {"paramètre"}{optimistic > 1 ? "s" : ""} sur {total} {"favorise"}{optimistic > 1 ? "nt" : ""} {"l'autofinancement"}
                </div>
                <div>
                  {"Capital : τ* = "}{Math.round(capitalOptimal.optimalRate * 100)}%
                  ({modelSettings.capitalElasticityModel === 'direct' ? 'avec cross' : modelSettings.capitalElasticityModel === 'noCross' ? 'sans cross' : 'avec cotis.'})
                  {" | Supply-side : "}{modelSettings.supplySideModel === 'level' ? 'niveau' : modelSettings.supplySideModel === 'permanent' ? 'permanent' : 'hybride'}
                </div>
              </div>
              <div className="text-slate-400 mt-2">
                {"L'incertitude augmente significativement au-delà de 5 ans. Coefficients supply-side extrapolés du ranking qualitatif OCDE (2010)."}
              </div>
            </div>
          </section>
        </>
      )}

      {/* FOOTER */}
      <section className="pb-12">
        <details className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <summary className="px-5 py-3 text-sm text-slate-500 cursor-pointer hover:text-slate-700">
            {"Sources et méthodologie"}
          </summary>
          <div className="px-5 pb-4 space-y-3">
            <p className="text-xs text-slate-500">
              {"Modèle calibré sur 5 épisodes fiscaux français (1982-2024). Canal supply-side : interprétation des résultats OCDE (2010) et Arnold et al. (2008). Coefficients extrapolés du ranking qualitatif. Élasticités : Lefebvre, Lehmann & Sicsic (2025, Scand. J. Econ.) pour le capital (ε=0.50), Saez, Slemrod & Giertz (2012, JEL) pour le travail (ETI=0.35), Crépon & Desplatz (2001) pour les cotisations (ε=0.40). Données macro : INSEE 2024, OCDE Revenue Statistics 2025. Taux PO/PIB : 42.8% (INSEE)."}
            </p>
            <div className="text-[10px] text-slate-400 space-y-0.5">
              {sources.map((s, i) => (
                <p key={i}>{s.authors} ({s.year}). <em>{s.title}</em>{s.journal ? `. ${s.journal}` : ""}.</p>
              ))}
            </div>
            <div className="flex gap-5 text-[10px] pt-2 border-t border-slate-100 text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-8 h-[3px] rounded-full bg-emerald-500" /> Solide</span>
              <span className="flex items-center gap-1.5"><span className="w-5 h-[3px] rounded-full bg-blue-500" /> {"Calibré"}</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-[3px] rounded-full bg-amber-400" /> Extrapolation</span>
            </div>
          </div>
        </details>
      </section>
    </div>
  );
}
