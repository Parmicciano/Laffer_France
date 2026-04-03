"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  computeTenYearProjection,
  validateAgainstHistory,
  type ScenarioInput,
  type HistoricalValidation,
  type YearProjection,
  type TenYearResult,
} from "@/utils/calculations";

// --- Confidence badge helper ---
function ConfidenceBadge({ label }: { label: 'SOLIDE' | 'CALIBRE' | 'EXTRAPOLATION' }) {
  const colors: Record<string, string> = {
    SOLIDE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    CALIBRE: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    EXTRAPOLATION: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return (
    <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border ${colors[label]}`}>
      {label}
    </span>
  );
}

export default function TenYearProjection({ scenario }: { scenario: ScenarioInput }) {
  const [validationOpen, setValidationOpen] = useState(false);

  const hasAnyChange =
    scenario.travail > 0 ||
    scenario.capital > 0 ||
    scenario.cotisationsPatronales > 0;

  const result: TenYearResult = useMemo(
    () => computeTenYearProjection(scenario),
    [scenario]
  );

  const { central, pessimiste, optimiste, validations } = result;

  // --- Crossover logic across scenarios ---
  const crossoverCentral = useMemo(() => {
    for (let i = 1; i < central.length; i++) {
      if (central[i].reformRecettes >= central[i].statusQuoRecettes) {
        return central[i].year;
      }
    }
    return null;
  }, [central]);

  const crossoverOptimiste = useMemo(() => {
    for (let i = 1; i < optimiste.length; i++) {
      if (optimiste[i].reformRecettes >= optimiste[i].statusQuoRecettes) {
        return optimiste[i].year;
      }
    }
    return null;
  }, [optimiste]);

  const crossoverPessimiste = useMemo(() => {
    for (let i = 1; i < pessimiste.length; i++) {
      if (pessimiste[i].reformRecettes >= pessimiste[i].statusQuoRecettes) {
        return pessimiste[i].year;
      }
    }
    return null;
  }, [pessimiste]);

  const cumulativeDelta = useMemo(() => {
    return central.reduce((acc, p) => acc + p.revenueDiff, 0);
  }, [central]);

  const cumulativeDeltaPessimiste = useMemo(() => {
    return pessimiste.reduce((acc, p) => acc + p.revenueDiff, 0);
  }, [pessimiste]);

  const cumulativeDeltaOptimiste = useMemo(() => {
    return optimiste.reduce((acc, p) => acc + p.revenueDiff, 0);
  }, [optimiste]);

  const lastCentral = central[central.length - 1];
  const lastPessimiste = pessimiste[pessimiste.length - 1];
  const lastOptimiste = optimiste[optimiste.length - 1];

  if (!hasAnyChange) {
    return (
      <div className="bg-[#141414] border border-[#222] rounded-xl p-12 text-center">
        <p className="text-neutral-500 text-lg">
          Configurez un scenario dans l&apos;onglet Simulateur
        </p>
        <p className="text-neutral-600 text-sm mt-2">
          La projection modelise les effets dynamiques downstream du PIB :
          emplois, investissement, entreprises.
        </p>
      </div>
    );
  }

  // --- Fan chart data builders ---
  function buildFanData(
    field: (p: YearProjection) => number,
    sqField: (p: YearProjection) => number
  ) {
    return central.map((c, i) => {
      const lo = field(pessimiste[i]);
      const hi = field(optimiste[i]);
      return {
        year: c.year,
        low: Math.round(lo * 10) / 10,
        bandWidth: Math.round((hi - lo) * 10) / 10,
        central: Math.round(field(c) * 10) / 10,
        sq: Math.round(sqField(c) * 10) / 10,
      };
    });
  }

  const recettesFanData = buildFanData(
    (p) => p.reformRecettes,
    (p) => p.statusQuoRecettes
  );

  const pibFanData = buildFanData(
    (p) => p.reformPib,
    (p) => p.statusQuoPib
  );

  const detteFanData = buildFanData(
    (p) => p.reformDette,
    (p) => p.statusQuoDette
  );

  // Growth decomposition data (stacked bars by tax type, in Md EUR)
  const growthDecompData = central.slice(1).map((p) => ({
    year: p.year,
    Travail: p.deltaGDPTravail,
    Capital: p.deltaGDPCapital,
    Cotisations: p.deltaGDPCotisations,
  }));

  const pibDelta = lastCentral.reformPib - lastCentral.statusQuoPib;
  const pibDeltaPessimiste = lastPessimiste.reformPib - lastPessimiste.statusQuoPib;
  const pibDeltaOptimiste = lastOptimiste.reformPib - lastOptimiste.statusQuoPib;
  const detteDelta = lastCentral.reformDette - lastCentral.statusQuoDette;
  const detteDeltaPessimiste = lastPessimiste.reformDette - lastPessimiste.statusQuoDette;
  const detteDeltaOptimiste = lastOptimiste.reformDette - lastOptimiste.statusQuoDette;

  // --- Crossover display helper ---
  function renderCrossoverText() {
    if (crossoverCentral) {
      return (
        <>
          <div className="text-xl font-bold text-emerald-400">
            Annee {crossoverCentral - 2024}
          </div>
          <div className="text-xs text-neutral-600 mt-0.5">recettes reforme &gt; statu quo</div>
        </>
      );
    }
    if (crossoverOptimiste) {
      return (
        <>
          <div className="text-xl font-bold text-amber-400">
            Annee ~{crossoverOptimiste - 2024}
          </div>
          <div className="text-xs text-neutral-600 mt-0.5">
            Croisement possible en annee {crossoverOptimiste - 2024} (scenario optimiste)
          </div>
        </>
      );
    }
    // No crossover in any scenario
    const lastYearDiff = lastCentral.revenueDiff;
    const grossCut = lastCentral.statusQuoRecettes - lastCentral.reformRecettes + lastCentral.revenueDiff;
    return (
      <>
        <div className="text-xl font-bold text-red-400">
          {lastYearDiff.toFixed(1)} Md&euro;/an
        </div>
        <div className="text-xs text-neutral-600 mt-0.5">
          Pas de croisement en 10 ans
        </div>
      </>
    );
  }

  // Fan chart crossover subtitle for recettes
  function recettesCrossoverSubtitle() {
    if (!crossoverCentral && crossoverOptimiste && crossoverPessimiste) {
      return `Croisement possible entre annee ${Math.min(crossoverOptimiste, crossoverPessimiste) - 2024} et ${Math.max(crossoverOptimiste, crossoverPessimiste) - 2024} selon le scenario`;
    }
    if (!crossoverCentral && crossoverOptimiste) {
      return `Croisement possible en annee ${crossoverOptimiste - 2024} (scenario optimiste)`;
    }
    return null;
  }

  // Shared tooltip style
  const tooltipStyle = {
    backgroundColor: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "12px",
  };

  return (
    <div className="space-y-6">
      {/* Snowball explanation — 4 steps */}
      <div className="bg-gradient-to-r from-blue-500/5 to-transparent border border-blue-500/20 rounded-xl p-5">
        <h3 className="text-blue-400 font-semibold text-sm mb-3">
          L&apos;effet boule de neige — pourquoi les effets se composent
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#1a1a1a]">
            <div className="text-amber-400 font-bold mb-1">1. Moins d&apos;impot</div>
            <div className="text-neutral-400">Le taux baisse, le rendement apres impot monte</div>
          </div>
          <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#1a1a1a] relative">
            <div className="text-emerald-400 font-bold mb-1">2. PIB en hausse</div>
            <div className="text-neutral-400">Investissement, emploi, entreprises — tout est downstream du PIB</div>
            <div className="absolute -left-2 top-1/2 text-neutral-600 hidden md:block">&rarr;</div>
          </div>
          <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#1a1a1a] relative">
            <div className="text-blue-400 font-bold mb-1">3. Assiette plus large</div>
            <div className="text-neutral-400">L&apos;assiette fiscale grossit chaque annee avec le PIB</div>
            <div className="absolute -left-2 top-1/2 text-neutral-600 hidden md:block">&rarr;</div>
          </div>
          <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#1a1a1a] relative">
            <div className="text-purple-400 font-bold mb-1">4. Recettes qui remontent</div>
            <div className="text-neutral-400">Taux plus bas &times; base plus large = recettes qui remontent</div>
            <div className="absolute -left-2 top-1/2 text-neutral-600 hidden md:block">&rarr;</div>
          </div>
        </div>
        <p className="text-neutral-500 text-xs mt-3">
          Et ca recommence : plus de recettes &rarr; moins de dette &rarr; moins de charge d&apos;interet &rarr; plus de marge de manoeuvre.
          Chaque annee, les gains se composent sur une base plus large.
        </p>
      </div>

      {/* Key metrics — 5 cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Entreprises */}
        <div className="bg-[#141414] border border-[#222] rounded-lg p-4">
          <div className="text-[10px] text-neutral-500 mb-1 uppercase tracking-wider">
            Entreprises creees
          </div>
          <div className="text-xl font-bold text-emerald-400">
            +{lastCentral.cumulativeBusinessesCreated.toLocaleString("fr-FR")}
          </div>
          <div className="text-xs text-neutral-600 mt-0.5">cumule 10 ans [ordre de grandeur]</div>
          <div className="mt-1"><ConfidenceBadge label={lastCentral.confidenceLabel} /></div>
        </div>
        {/* Emplois */}
        <div className="bg-[#141414] border border-[#222] rounded-lg p-4">
          <div className="text-[10px] text-neutral-500 mb-1 uppercase tracking-wider">
            Emplois crees
          </div>
          <div className="text-xl font-bold text-blue-400">
            +{lastCentral.cumulativeJobsCreated.toLocaleString("fr-FR")}
          </div>
          <div className="text-xs text-neutral-600 mt-0.5">directs + indirects</div>
          <div className="mt-1"><ConfidenceBadge label={lastCentral.confidenceLabel} /></div>
        </div>
        {/* PIB additionnel */}
        <div className="bg-[#141414] border border-[#222] rounded-lg p-4">
          <div className="text-[10px] text-neutral-500 mb-1 uppercase tracking-wider">
            PIB additionnel
          </div>
          <div className={`text-xl font-bold ${pibDelta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {pibDelta >= 0 ? "+" : ""}{pibDelta.toFixed(0)} Md&euro;
          </div>
          <div className="text-xs text-neutral-600 mt-0.5">vs statu quo a 10 ans</div>
          <div className="mt-1"><ConfidenceBadge label={lastCentral.confidenceLabel} /></div>
        </div>
        {/* Crossover / ecart */}
        <div className="bg-[#141414] border border-[#222] rounded-lg p-4">
          <div className="text-[10px] text-neutral-500 mb-1 uppercase tracking-wider">
            {crossoverCentral ? "Point de croisement" : crossoverOptimiste ? "Croisement possible" : "Ecart recettes"}
          </div>
          {renderCrossoverText()}
          <div className="mt-1"><ConfidenceBadge label={lastCentral.confidenceLabel} /></div>
        </div>
        {/* Bilan cumule */}
        <div className="bg-[#141414] border border-[#222] rounded-lg p-4">
          <div className="text-[10px] text-neutral-500 mb-1 uppercase tracking-wider">
            Bilan cumule 10 ans
          </div>
          <div className={`text-xl font-bold ${cumulativeDelta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {cumulativeDelta >= 0 ? "+" : ""}{cumulativeDelta.toFixed(0)} Md&euro;
          </div>
          <div className="text-xs text-neutral-600 mt-0.5">somme des deltas recettes</div>
          <div className="mt-1"><ConfidenceBadge label={lastCentral.confidenceLabel} /></div>
        </div>
      </div>

      {/* Growth decomposition — 3 stacked bars by tax type */}
      <div className="bg-[#141414] border border-[#222] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-1">
          PIB additionnel par type de baisse fiscale
        </h3>
        <p className="text-sm text-neutral-500 mb-4">
          Chaque type de baisse contribue au PIB additionnel — les effets se cumulent et se composent annee apres annee
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={growthDecompData}
            margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
            <XAxis
              dataKey="year"
              tick={{ fill: "#888", fontSize: 11 }}
              axisLine={{ stroke: "#333" }}
            />
            <YAxis
              tick={{ fill: "#888", fontSize: 11 }}
              axisLine={{ stroke: "#333" }}
              tickFormatter={(v: number) => `${v}`}
              label={{
                value: "Md\u20AC",
                angle: -90,
                position: "insideLeft",
                style: { fill: "#666", fontSize: 10 },
              }}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => [`${Number(value).toFixed(1)} Md\u20AC`]}
            />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            <Bar dataKey="Travail" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Capital" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Cotisations" stackId="a" fill="#10b981" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-neutral-600 mt-2">
          La croissance endogene compose les gains : le PIB additionnel d&apos;annee N augmente la base d&apos;annee N+1.
        </p>
      </div>

      {/* Recettes chart — FAN CHART */}
      <div className="bg-[#141414] border border-[#222] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-1">
          Recettes publiques — Statu quo vs Reforme
        </h3>
        <p className="text-sm text-neutral-500 mb-1">
          L&apos;incertitude s&apos;elargit avec le temps — la bande montre le scenario pessimiste a optimiste
        </p>
        {recettesCrossoverSubtitle() && (
          <p className="text-sm text-amber-400/80 mb-3 italic">
            {recettesCrossoverSubtitle()}
          </p>
        )}
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart
            data={recettesFanData}
            margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
            <XAxis dataKey="year" tick={{ fill: "#888", fontSize: 11 }} axisLine={{ stroke: "#333" }} />
            <YAxis
              tick={{ fill: "#888", fontSize: 11 }}
              axisLine={{ stroke: "#333" }}
              domain={["auto", "auto"]}
              label={{ value: "Md\u20AC", angle: -90, position: "insideLeft", style: { fill: "#666", fontSize: 11 } }}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name) => {
                if (name === "low" || name === "bandWidth") return [null, null];
                const label = name === "central" ? "Reforme (central)" : name === "sq" ? "Statu quo" : name;
                return [`${Number(value).toFixed(1)} Md\u20AC`, label];
              }}
            />
            {crossoverCentral && (
              <ReferenceLine
                x={crossoverCentral}
                stroke="#10b981"
                strokeDasharray="3 3"
                label={{ value: "Croisement", fill: "#10b981", fontSize: 10, position: "top" }}
              />
            )}
            <Area type="monotone" dataKey="low" stackId="band" stroke="none" fill="transparent" />
            <Area type="monotone" dataKey="bandWidth" stackId="band" stroke="none" fill="#10b981" fillOpacity={0.15} />
            <Area type="monotone" dataKey="central" stroke="#10b981" strokeWidth={2} fill="none" />
            <Area type="monotone" dataKey="sq" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" fill="none" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-[11px] text-neutral-500">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-red-500 inline-block" style={{ borderTop: "2px dashed #ef4444" }} /> Statu quo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-emerald-500 inline-block" /> Reforme (central)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-2 bg-emerald-500/20 inline-block rounded" /> Bande pessimiste-optimiste
          </span>
        </div>
      </div>

      {/* PIB chart — FAN CHART */}
      <div className="bg-[#141414] border border-[#222] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-1">
          PIB — L&apos;effet compose en action
        </h3>
        <p className="text-sm text-neutral-500 mb-4">
          L&apos;incertitude s&apos;elargit avec le temps — la bande montre le scenario pessimiste a optimiste
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={pibFanData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
            <XAxis dataKey="year" tick={{ fill: "#888", fontSize: 11 }} axisLine={{ stroke: "#333" }} />
            <YAxis
              tick={{ fill: "#888", fontSize: 11 }}
              axisLine={{ stroke: "#333" }}
              domain={["auto", "auto"]}
              label={{ value: "Md\u20AC", angle: -90, position: "insideLeft", style: { fill: "#666", fontSize: 11 } }}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name) => {
                if (name === "low" || name === "bandWidth") return [null, null];
                const label = name === "central" ? "Reforme (central)" : name === "sq" ? "Statu quo" : name;
                return [`${Number(value).toFixed(1)} Md\u20AC`, label];
              }}
            />
            <Area type="monotone" dataKey="low" stackId="band" stroke="none" fill="transparent" />
            <Area type="monotone" dataKey="bandWidth" stackId="band" stroke="none" fill="#3b82f6" fillOpacity={0.15} />
            <Area type="monotone" dataKey="central" stroke="#3b82f6" strokeWidth={2} fill="none" />
            <Area type="monotone" dataKey="sq" stroke="#666" strokeWidth={2} strokeDasharray="5 5" fill="none" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-[11px] text-neutral-500">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 inline-block" style={{ borderTop: "2px dashed #666" }} /> Statu quo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-blue-500 inline-block" /> Reforme (central)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-2 bg-blue-500/20 inline-block rounded" /> Bande pessimiste-optimiste
          </span>
        </div>
      </div>

      {/* Dette chart — FAN CHART */}
      <div className="bg-[#141414] border border-[#222] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-1">
          Trajectoire de la dette publique
        </h3>
        <p className="text-sm text-neutral-500 mb-4">
          L&apos;incertitude s&apos;elargit avec le temps — la bande montre le scenario pessimiste a optimiste
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={detteFanData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
            <XAxis dataKey="year" tick={{ fill: "#888", fontSize: 11 }} axisLine={{ stroke: "#333" }} />
            <YAxis
              tick={{ fill: "#888", fontSize: 11 }}
              axisLine={{ stroke: "#333" }}
              domain={["auto", "auto"]}
              label={{ value: "Md\u20AC", angle: -90, position: "insideLeft", style: { fill: "#666", fontSize: 11 } }}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name) => {
                if (name === "low" || name === "bandWidth") return [null, null];
                const label = name === "central" ? "Reforme (central)" : name === "sq" ? "Statu quo" : name;
                return [`${Number(value).toLocaleString("fr-FR")} Md\u20AC`, label];
              }}
            />
            <Area type="monotone" dataKey="low" stackId="band" stroke="none" fill="transparent" />
            <Area type="monotone" dataKey="bandWidth" stackId="band" stroke="none" fill="#10b981" fillOpacity={0.15} />
            <Area type="monotone" dataKey="central" stroke="#10b981" strokeWidth={2} fill="none" />
            <Area type="monotone" dataKey="sq" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" fill="none" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-[11px] text-neutral-500">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 inline-block" style={{ borderTop: "2px dashed #ef4444" }} /> Statu quo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-emerald-500 inline-block" /> Reforme (central)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-2 bg-emerald-500/20 inline-block rounded" /> Bande pessimiste-optimiste
          </span>
        </div>
      </div>

      {/* Year-by-year table */}
      <div className="bg-[#141414] border border-[#222] rounded-xl p-6 overflow-x-auto">
        <h3 className="text-lg font-semibold text-white mb-4">
          Detail annee par annee
        </h3>
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="text-neutral-500 border-b border-[#222] text-[11px]">
              <th className="text-left py-2 px-2">Annee</th>
              <th className="text-right py-2 px-2">Rec. SQ</th>
              <th className="text-right py-2 px-2">Rec. Ref.</th>
              <th className="text-right py-2 px-2">Delta</th>
              <th className="text-right py-2 px-2">&Delta;PIB</th>
              <th className="text-right py-2 px-2">Emplois</th>
              <th className="text-right py-2 px-2">Invest. cum.</th>
              <th className="text-center py-2 px-2">Confiance</th>
            </tr>
          </thead>
          <tbody>
            {central.slice(1).map((p) => {
              return (
                <tr key={p.year} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a]">
                  <td className="py-2 px-2 text-white font-medium">{p.year}</td>
                  <td className="py-2 px-2 text-right text-neutral-400">{p.statusQuoRecettes.toFixed(1)}</td>
                  <td className="py-2 px-2 text-right text-neutral-300">{p.reformRecettes.toFixed(1)}</td>
                  <td className={`py-2 px-2 text-right font-medium ${p.revenueDiff >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {p.revenueDiff >= 0 ? "+" : ""}{p.revenueDiff.toFixed(1)}
                  </td>
                  <td className={`py-2 px-2 text-right ${p.deltaGDP >= 0 ? "text-blue-400" : "text-red-400"}`}>
                    {p.deltaGDP >= 0 ? "+" : ""}{p.deltaGDP.toFixed(1)} Md&euro;
                  </td>
                  <td className="py-2 px-2 text-right text-blue-400">
                    {p.cumulativeJobsCreated.toLocaleString("fr-FR")}
                  </td>
                  <td className="py-2 px-2 text-right text-neutral-400">
                    {p.cumulativeInvestment.toFixed(1)} Md&euro;
                  </td>
                  <td className="py-2 px-2 text-center">
                    <ConfidenceBadge label={p.confidenceLabel} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Historical validation section (collapsible) */}
      <div className="bg-[#141414] border border-[#222] rounded-xl">
        <button
          onClick={() => setValidationOpen(!validationOpen)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-[#1a1a1a] rounded-xl transition-colors"
        >
          <div>
            <h3 className="text-lg font-semibold text-white">
              Validation historique
            </h3>
            <p className="text-sm text-neutral-500 mt-0.5">
              Le modele doit reproduire les episodes francais reels — {validations.filter(v => v.pass).length}/{validations.length} passes
            </p>
          </div>
          <span className="text-neutral-500 text-xl">
            {validationOpen ? "\u25B2" : "\u25BC"}
          </span>
        </button>
        {validationOpen && (
          <div className="px-5 pb-5 space-y-3">
            {validations.map((v, idx) => (
              <div
                key={idx}
                className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-semibold text-sm">{v.episode}</span>
                    <span className="text-neutral-600 text-xs">{v.year}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs">
                    <div>
                      <span className="text-neutral-500">Predit : </span>
                      <span className="text-neutral-300">{v.predicted}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Observe : </span>
                      <span className="text-neutral-300">{v.observed}</span>
                    </div>
                  </div>
                </div>
                <div>
                  {v.pass ? (
                    <span className="inline-block text-[10px] font-bold px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      PASS
                    </span>
                  ) : (
                    <span className="inline-block text-[10px] font-bold px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                      FAIL
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom summary — 3 cards with confidence range */}
      <div className="bg-gradient-to-r from-emerald-500/5 to-transparent border border-emerald-500/20 rounded-xl p-5">
        <h4 className="text-emerald-400 font-semibold text-sm mb-2">
          Bilan a 10 ans
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-neutral-500 text-xs mb-1">PIB additionnel</div>
            <div className="text-white font-bold text-lg">
              +{pibDelta.toFixed(0)} Md&euro;
            </div>
            <div className="text-neutral-600 text-xs">
              [{pibDeltaPessimiste.toFixed(0)} — {pibDeltaOptimiste.toFixed(0)}] Md&euro;
            </div>
            <div className="text-neutral-600 text-xs">
              soit +{((pibDelta / lastCentral.statusQuoPib) * 100).toFixed(1)}% vs statu quo
            </div>
          </div>
          <div>
            <div className="text-neutral-500 text-xs mb-1">Bilan recettes cumule</div>
            <div className={`font-bold text-lg ${cumulativeDelta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {cumulativeDelta >= 0 ? "+" : ""}{cumulativeDelta.toFixed(0)} Md&euro;
            </div>
            <div className="text-neutral-600 text-xs">
              [{cumulativeDeltaPessimiste.toFixed(0)} — {cumulativeDeltaOptimiste.toFixed(0)}] Md&euro;
            </div>
            <div className="text-neutral-600 text-xs">
              somme sur 10 ans (reforme - statu quo)
            </div>
          </div>
          <div>
            <div className="text-neutral-500 text-xs mb-1">Dette evitee</div>
            <div className={`font-bold text-lg ${detteDelta <= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {detteDelta <= 0 ? "" : "+"}{detteDelta.toFixed(0)} Md&euro;
            </div>
            <div className="text-neutral-600 text-xs">
              [{detteDeltaPessimiste.toFixed(0)} — {detteDeltaOptimiste.toFixed(0)}] Md&euro;
            </div>
            <div className="text-neutral-600 text-xs">
              ecart de dette a 10 ans
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
