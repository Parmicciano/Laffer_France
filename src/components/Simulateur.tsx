"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { computeCombinedImpact, computeTenYearProjection, type ScenarioInput } from "@/utils/calculations";

interface SimulateurProps {
  scenario: ScenarioInput;
  onScenarioChange: (s: ScenarioInput) => void;
}

const presets = [
  {
    id: "moderate",
    label: "Réforme modérée",
    desc: "Baisse ciblée, socialement acceptable",
    scenario: { travail: 5, capital: 15, cotisationsPatronales: 10 },
    highlight: false,
  },
  {
    id: "ambitieuse",
    label: "Réforme ambitieuse",
    desc: "Alignement sur les standards européens",
    scenario: { travail: 10, capital: 25, cotisationsPatronales: 15 },
    highlight: true,
  },
  {
    id: "capital",
    label: "Capital seul",
    desc: "Ne baisser que l'impot sur le capital",
    scenario: { travail: 0, capital: 20, cotisationsPatronales: 0 },
    highlight: false,
  },
  {
    id: "cotis",
    label: "Cotisations seules",
    desc: "Ne baisser que les charges patronales",
    scenario: { travail: 0, capital: 0, cotisationsPatronales: 15 },
    highlight: false,
  },
];

export default function Simulateur({ scenario, onScenarioChange }: SimulateurProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activePreset, setActivePreset] = useState<string>("moderate");

  const impact = useMemo(() => computeCombinedImpact(scenario), [scenario]);

  const hasAnyChange = scenario.travail > 0 || scenario.capital > 0 || scenario.cotisationsPatronales > 0;

  const totalRecovery = impact.totalDynamicRecovery + impact.totalCrossEffect + impact.totalEmploymentGain;

  // Waterfall data
  const waterfallData = useMemo(() => {
    if (!hasAnyChange) return [];
    const items = [];
    if (scenario.travail > 0) {
      const d = impact.details.travail;
      items.push({ name: "Travail", value: -d.netLoss, perte: -d.grossLoss, recup: d.dynamicRecovery });
    }
    if (scenario.capital > 0) {
      const d = impact.details.capital;
      items.push({ name: "Capital", value: -d.netLoss, perte: -d.grossLoss, recup: d.dynamicRecovery + d.crossEffect });
    }
    if (scenario.cotisationsPatronales > 0) {
      const d = impact.details.cotisationsPatronales;
      items.push({ name: "Cotisations", value: -d.netLoss, perte: -d.grossLoss, recup: d.dynamicRecovery + d.employmentGain });
    }
    return items;
  }, [impact, scenario, hasAnyChange]);

  function selectPreset(id: string) {
    const p = presets.find((p) => p.id === id);
    if (p) {
      setActivePreset(id);
      onScenarioChange(p.scenario);
    }
  }

  return (
    <section id="simulateur" className="py-16 border-t border-slate-100">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-3">
        Que se passerait-il si on baissait les impots ?
      </h2>
      <p className="text-slate-500 text-center mb-10 max-w-xl mx-auto">
        Choisissez un scénario. Le simulateur calcule la perte brute, puis combien on
        récupère automatiquement grâce à la croissance et aux emplois créés.
      </p>

      {/* Preset cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto mb-8">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => selectPreset(p.id)}
            className={`rounded-xl p-4 text-left transition-all border-2 ${
              activePreset === p.id
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
            }`}
          >
            <div className={`text-sm font-bold ${activePreset === p.id ? "text-blue-700" : "text-slate-700"}`}>
              {p.label}
            </div>
            <div className="text-xs text-slate-400 mt-1">{p.desc}</div>
            <div className="text-[10px] text-slate-400 mt-2 space-y-0.5">
              {p.scenario.travail > 0 && <div>Travail -{p.scenario.travail}%</div>}
              {p.scenario.capital > 0 && <div>Capital -{p.scenario.capital}%</div>}
              {p.scenario.cotisationsPatronales > 0 && <div>Cotis. -{p.scenario.cotisationsPatronales}%</div>}
            </div>
          </button>
        ))}
      </div>

      {/* Advanced sliders (collapsible) */}
      <div className="max-w-3xl mx-auto mb-8">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
        >
          {showAdvanced ? "Masquer" : "Personnaliser"} les curseurs
          <svg className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Travail (IR + CSG)", key: "travail" as const, max: 20, color: "#d97706" },
              { label: "Capital (IS + PFU)", key: "capital" as const, max: 30, color: "#dc2626" },
              { label: "Cotisations patronales", key: "cotisationsPatronales" as const, max: 20, color: "#2563eb" },
            ].map((s) => (
              <div key={s.key} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">{s.label}</span>
                  <span className="text-sm font-bold" style={{ color: s.color }}>-{scenario[s.key]}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={s.max}
                  value={scenario[s.key]}
                  onChange={(e) => {
                    setActivePreset("");
                    onScenarioChange({ ...scenario, [s.key]: Number(e.target.value) });
                  }}
                  className="w-full"
                  style={{
                    background: `linear-gradient(to right, ${s.color} 0%, ${s.color} ${(scenario[s.key] / s.max) * 100}%, #e2e8f0 ${(scenario[s.key] / s.max) * 100}%, #e2e8f0 100%)`,
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {hasAnyChange && (
        <div className="max-w-3xl mx-auto">
          {/* Big summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-red-50 rounded-xl p-5 text-center border border-red-100">
              <div className="text-xs text-red-400 font-medium uppercase tracking-wider mb-1">
                On perd
              </div>
              <div className="text-3xl font-black text-red-600">
                -{impact.totalGrossLoss.toFixed(1)}
              </div>
              <div className="text-xs text-red-400 mt-1">milliards €</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-5 text-center border border-emerald-100">
              <div className="text-xs text-emerald-500 font-medium uppercase tracking-wider mb-1">
                On récupère
              </div>
              <div className="text-3xl font-black text-emerald-600">
                +{totalRecovery.toFixed(1)}
              </div>
              <div className="text-xs text-emerald-400 mt-1">milliards € (dynamique)</div>
            </div>
            <div className={`rounded-xl p-5 text-center border ${
              impact.totalNetLoss <= 0
                ? "bg-emerald-50 border-emerald-100"
                : "bg-blue-50 border-blue-100"
            }`}>
              <div className={`text-xs font-medium uppercase tracking-wider mb-1 ${
                impact.totalNetLoss <= 0 ? "text-emerald-500" : "text-blue-400"
              }`}>
                Cout net
              </div>
              <div className={`text-3xl font-black ${
                impact.totalNetLoss <= 0 ? "text-emerald-600" : "text-blue-600"
              }`}>
                {impact.totalNetLoss > 0 ? "-" : "+"}{Math.abs(impact.totalNetLoss).toFixed(1)}
              </div>
              <div className={`text-xs mt-1 ${impact.totalNetLoss <= 0 ? "text-emerald-400" : "text-blue-400"}`}>
                milliards €
              </div>
            </div>
          </div>

          {/* Self-financing rate */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200 text-center">
            <span className="text-slate-500 text-sm">
              La baisse s&apos;autofinance à{" "}
            </span>
            <span className={`text-lg font-black ${
              impact.totalSelfFinancing >= 70 ? "text-emerald-600" : impact.totalSelfFinancing >= 50 ? "text-amber-600" : "text-red-600"
            }`}>
              {impact.totalSelfFinancing.toFixed(0)}%
            </span>
            <span className="text-slate-500 text-sm">
              {" "}— c&apos;est-à-dire que pour 1€ de baisse d&apos;impot, on récupère{" "}
              {(impact.totalSelfFinancing / 100).toFixed(2)}€ de recettes supplémentaires.
            </span>
          </div>

          {/* Waterfall chart */}
          {waterfallData.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">
                Détail par type d&apos;impot : perte brute vs récupération
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={waterfallData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "#e2e8f0" }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#e2e8f0" }} tickFormatter={(v: number) => `${v} Mds`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(value) => [`${Number(value).toFixed(1)} Mds€`]}
                  />
                  <ReferenceLine y={0} stroke="#cbd5e1" />
                  <Bar dataKey="perte" name="Perte brute" radius={[4, 4, 0, 0]}>
                    {waterfallData.map((_, idx) => (
                      <Cell key={idx} fill="#fca5a5" />
                    ))}
                  </Bar>
                  <Bar dataKey="recup" name="Récupération" radius={[4, 4, 0, 0]}>
                    {waterfallData.map((_, idx) => (
                      <Cell key={idx} fill="#6ee7b7" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Emplois créés */}
          {impact.totalNewJobs > 0 && (
            <p className="text-center text-sm text-slate-500 mt-4">
              Cette réforme créerait environ{" "}
              <span className="font-bold text-blue-600">
                {impact.totalNewJobs.toLocaleString("fr-FR")} emplois
              </span>{" "}
              dès la première année (effet cotisations patronales).
            </p>
          )}

          {/* Production de PIB, développement technologique, croissance — sur 10 ans */}
          <TenYearImpact scenario={scenario} />
        </div>
      )}

      {/* Grille de simulations — inspirée Claude Med */}
      <ScenarioGrid />
    </section>
  );
}

// ============================================================
// Impact 10 ans — PIB, technologie, croissance
// ============================================================

function TenYearImpact({ scenario }: { scenario: ScenarioInput }) {
  const tenYear = useMemo(() => computeTenYearProjection(scenario), [scenario]);
  const projections = tenYear.central;
  const last = projections[projections.length - 1];
  const pibDelta = last.reformPib - last.statusQuoPib;
  const pibDeltaPct = (pibDelta / last.statusQuoPib) * 100;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold text-slate-900 mb-2">
        Effet sur 10 ans : PIB et emploi
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        Moins d&apos;impots → plus de PIB → plus d&apos;emplois → assiette plus large. Calibré sur les épisodes français réels.
      </p>

      {/* 3 grosses cartes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="bg-purple-50 rounded-xl p-5 border border-purple-100">
          <div className="text-3xl font-black text-purple-600">+{pibDelta.toFixed(0)} Mds€</div>
          <div className="text-xs text-purple-600 font-bold mt-1">de PIB produit en plus à 10 ans</div>
          <div className="text-[10px] text-purple-400 mt-1">soit +{pibDeltaPct.toFixed(1)}% vs sans réforme</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
          <div className="text-3xl font-black text-amber-600">+{last.cumulativeInvestment.toFixed(0)} Mds€</div>
          <div className="text-xs text-amber-600 font-bold mt-1">d&apos;investissement cumulé</div>
          <div className="text-[10px] text-amber-400 mt-1">capital, R&amp;D, équipement</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
          <div className="text-3xl font-black text-blue-600">+{last.cumulativeJobsCreated.toLocaleString("fr-FR")}</div>
          <div className="text-xs text-blue-600 font-bold mt-1">emplois (loi d&apos;Okun)</div>
          <div className="text-[10px] text-blue-400 mt-1">dérivés du ΔPIB via coefficient 0.4</div>
        </div>
      </div>

      {/* 2ème ligne : entreprises + bilan */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-emerald-50 rounded-lg p-4 text-center border border-emerald-100">
          <div className="text-xl font-black text-emerald-600">+{last.cumulativeBusinessesCreated.toLocaleString("fr-FR")}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">entreprises créées [ordre de grandeur]</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 text-center border border-slate-200">
          <div className={`text-xl font-black ${last.cumulativeRevenueDiff >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {last.cumulativeRevenueDiff >= 0 ? "+" : ""}{last.cumulativeRevenueDiff.toFixed(0)} Mds€
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">bilan recettes cumulé 10 ans</div>
        </div>
      </div>

      {/* Graphique : ΔPIB par type d'impôt */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 mb-6">
        <h4 className="text-sm font-bold text-slate-700 mb-1">
          PIB additionnel par type de baisse fiscale
        </h4>
        <p className="text-[11px] text-slate-400 mb-3">
          Chaque barre montre combien de PIB supplémentaire est généré par chaque type de coupe
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={projections.slice(1).map((p) => ({
              year: p.year,
              Travail: p.deltaGDPTravail,
              Capital: p.deltaGDPCapital,
              Cotisations: p.deltaGDPCotisations,
            }))}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={{ stroke: "#e2e8f0" }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={{ stroke: "#e2e8f0" }}
              label={{ value: "ΔPIB (Md€)", angle: -90, position: "insideLeft", style: { fill: "#94a3b8", fontSize: 9 } }} />
            <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "11px" }}
              formatter={(value) => [`${Number(value).toFixed(1)} Md€`]} />
            <Bar dataKey="Travail" stackId="a" fill="#f59e0b" radius={[0,0,0,0]} />
            <Bar dataKey="Capital" stackId="a" fill="#ef4444" radius={[0,0,0,0]} />
            <Bar dataKey="Cotisations" stackId="a" fill="#3b82f6" radius={[2,2,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Niveau de confiance */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6">
        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Fiabilité des données</h4>
        <div className="space-y-2 text-xs">
          <div className="flex gap-2">
            <span className="shrink-0 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded text-[10px]">SOLIDE</span>
            <span className="text-slate-600">Perte brute mécanique, barèmes fiscaux (IPP, Urssaf, economie.gouv.fr). Dividendes 14.3→23.2 Mds€ (France Stratégie 2021). ε capital = 0.77 (Lefebvre et al. 2023).</span>
          </div>
          <div className="flex gap-2">
            <span className="shrink-0 px-1.5 py-0.5 bg-amber-100 text-amber-700 font-bold rounded text-[10px]">CALIBRE</span>
            <span className="text-slate-600">Autofinancement calibré sur épisodes français réels (PFU 2017, CICE, ISF). Pas des moyennes EU-14 théoriques.</span>
          </div>
          <div className="flex gap-2">
            <span className="shrink-0 px-1.5 py-0.5 bg-red-100 text-red-700 font-bold rounded text-[10px]">EXTRAPOLATION</span>
            <span className="text-slate-600">Projections &gt;3 ans = extrapolation avec incertitude croissante. Fan chart pessimiste/optimiste sur les graphiques.</span>
          </div>
        </div>
      </div>

      {/* Tableau année par année */}
      <details className="bg-white rounded-xl border border-slate-200">
        <summary className="px-5 py-3 cursor-pointer text-sm font-semibold text-slate-600 hover:text-slate-900">
          Détail année par année
        </summary>
        <div className="px-5 pb-4 overflow-x-auto">
          <table className="w-full text-xs min-w-[500px]">
            <thead>
              <tr className="text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-100">
                <th className="py-2 px-1 text-left">Année</th>
                <th className="py-2 px-1 text-right">ΔPIB</th>
                <th className="py-2 px-1 text-right">Emplois</th>
                <th className="py-2 px-1 text-right">Invest. cum.</th>
                <th className="py-2 px-1 text-right">Rec. delta</th>
                <th className="py-2 px-1 text-right">Confiance</th>
              </tr>
            </thead>
            <tbody>
              {projections.slice(1).map((p) => (
                <tr key={p.year} className="border-t border-slate-50 hover:bg-slate-50">
                  <td className="py-1.5 px-1 font-medium text-slate-700">{p.year}</td>
                  <td className="py-1.5 px-1 text-right text-purple-600 font-medium">+{p.deltaGDP.toFixed(1)}</td>
                  <td className="py-1.5 px-1 text-right text-blue-600">{p.cumulativeJobsCreated.toLocaleString("fr-FR")}</td>
                  <td className="py-1.5 px-1 text-right text-amber-600">{p.cumulativeInvestment.toFixed(0)}</td>
                  <td className={`py-1.5 px-1 text-right font-medium ${p.revenueDiff >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {p.revenueDiff >= 0 ? "+" : ""}{p.revenueDiff.toFixed(1)}
                  </td>
                  <td className="py-1.5 px-1 text-right">
                    <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${
                      p.confidenceLabel === 'SOLIDE' ? 'bg-emerald-100 text-emerald-600' :
                      p.confidenceLabel === 'CALIBRE' ? 'bg-amber-100 text-amber-600' :
                      'bg-red-100 text-red-600'
                    }`}>{p.confidenceLabel}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

// ============================================================
// Grille multi-scénarios (approche Claude Med)
// ============================================================

function ScenarioGrid() {
  const scenarios = useMemo(() => {
    const grid: {
      label: string;
      travail: number;
      capital: number;
      cotis: number;
      grossLoss: number;
      recovery: number;
      netLoss: number;
      selfFinancing: number;
      jobs: number;
    }[] = [];

    const configs = [
      { label: "Capital -10%", travail: 0, capital: 10, cotis: 0 },
      { label: "Capital -20%", travail: 0, capital: 20, cotis: 0 },
      { label: "Capital -30%", travail: 0, capital: 30, cotis: 0 },
      { label: "Cotis. -10%", travail: 0, capital: 0, cotis: 10 },
      { label: "Cotis. -15%", travail: 0, capital: 0, cotis: 15 },
      { label: "Cotis. -20%", travail: 0, capital: 0, cotis: 20 },
      { label: "Travail -5%", travail: 5, capital: 0, cotis: 0 },
      { label: "Travail -10%", travail: 10, capital: 0, cotis: 0 },
      { label: "Modérée", travail: 5, capital: 15, cotis: 10 },
      { label: "Ambitieuse", travail: 10, capital: 25, cotis: 15 },
      { label: "Max capital+cotis", travail: 0, capital: 30, cotis: 20 },
      { label: "Tout à -15%", travail: 15, capital: 15, cotis: 15 },
    ];

    for (const c of configs) {
      const imp = computeCombinedImpact({
        travail: c.travail,
        capital: c.capital,
        cotisationsPatronales: c.cotis,
      });
      grid.push({
        label: c.label,
        travail: c.travail,
        capital: c.capital,
        cotis: c.cotis,
        grossLoss: imp.totalGrossLoss,
        recovery: imp.totalDynamicRecovery + imp.totalCrossEffect + imp.totalEmploymentGain,
        netLoss: imp.totalNetLoss,
        selfFinancing: imp.totalSelfFinancing,
        jobs: imp.totalNewJobs,
      });
    }

    return grid;
  }, []);

  return (
    <div className="max-w-3xl mx-auto mt-12">
      <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
        Grille de simulations — 12 scénarios comparés
      </h3>
      <p className="text-sm text-slate-500 text-center mb-6">
        Chaque ligne est une simulation indépendante. Triées par autofinancement.
      </p>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
              <th className="text-left py-3 px-3 font-semibold">Scénario</th>
              <th className="text-right py-3 px-3 font-semibold">Perte brute</th>
              <th className="text-right py-3 px-3 font-semibold">Récupéré</th>
              <th className="text-right py-3 px-3 font-semibold">Cout net</th>
              <th className="text-right py-3 px-3 font-semibold">Autofinanc.</th>
              <th className="text-right py-3 px-3 font-semibold">Emplois</th>
            </tr>
          </thead>
          <tbody>
            {[...scenarios]
              .sort((a, b) => b.selfFinancing - a.selfFinancing)
              .map((s, idx) => (
                <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-medium text-slate-800">{s.label}</td>
                  <td className="py-2.5 px-3 text-right text-red-500 font-medium">
                    -{s.grossLoss.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-600 font-medium">
                    +{s.recovery.toFixed(1)}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-bold ${
                    s.netLoss <= 0 ? "text-emerald-600" : "text-blue-600"
                  }`}>
                    {s.netLoss > 0 ? "-" : "+"}{Math.abs(s.netLoss).toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                      s.selfFinancing >= 80
                        ? "bg-emerald-100 text-emerald-700"
                        : s.selfFinancing >= 60
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {s.selfFinancing.toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-blue-500 font-medium">
                    {s.jobs > 0 ? `+${s.jobs.toLocaleString("fr-FR")}` : "—"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400 text-center mt-3">
        Valeurs en milliards €. Autofinancement = part de la perte récupérée par la dynamique économique (emplois, croissance, retour de capitaux).
        Les scénarios sur le capital ont l&apos;autofinancement le plus élevé (79%) car la France est au-delà du seuil de Laffer.
      </p>
    </div>
  );
}
