"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Line,
  ComposedChart,
} from "recharts";
import {
  computeTenYearProjection,
  type ScenarioInput,
} from "@/utils/calculations";

interface BouleDeNeigeProps {
  scenario: ScenarioInput;
}

export default function BouleDeNeige({ scenario }: BouleDeNeigeProps) {
  const hasAnyChange = scenario.travail > 0 || scenario.capital > 0 || scenario.cotisationsPatronales > 0;

  const result = useMemo(() => computeTenYearProjection(scenario), [scenario]);
  const { central, pessimiste, optimiste } = result;

  const crossoverYearCentral = useMemo(() => {
    for (let i = 1; i < central.length; i++) {
      if (central[i].reformRecettes >= central[i].statusQuoRecettes) {
        return central[i].year;
      }
    }
    return null;
  }, [central]);

  const crossoverYearOptimiste = useMemo(() => {
    for (let i = 1; i < optimiste.length; i++) {
      if (optimiste[i].reformRecettes >= optimiste[i].statusQuoRecettes) {
        return optimiste[i].year;
      }
    }
    return null;
  }, [optimiste]);

  const cumulativeDelta = useMemo(() => {
    return central.reduce((acc, p) => acc + (p.reformRecettes - p.statusQuoRecettes), 0);
  }, [central]);

  const lastCentral = central[central.length - 1];
  const lastPessimiste = pessimiste[pessimiste.length - 1];
  const lastOptimiste = optimiste[optimiste.length - 1];
  const pibDelta = lastCentral.reformPib - lastCentral.statusQuoPib;
  const pibDeltaPessimiste = lastPessimiste.reformPib - lastPessimiste.statusQuoPib;
  const pibDeltaOptimiste = lastOptimiste.reformPib - lastOptimiste.statusQuoPib;

  // Autofinancement = recettes récupérées / coût brut initial
  const coutBrut = useMemo(() => {
    if (central.length < 2) return 0;
    return central[1].statusQuoRecettes - central[1].reformRecettes;
  }, [central]);

  const autofinancement = useMemo(() => {
    if (!lastCentral || coutBrut <= 0) return 0;
    const recettesRecuperees = lastCentral.reformRecettes - central[1]?.reformRecettes || 0;
    const recettesSQ = lastCentral.statusQuoRecettes - central[1]?.statusQuoRecettes || 0;
    const gainDynamique = recettesRecuperees - recettesSQ;
    return Math.min(100, Math.max(0, (gainDynamique / coutBrut) * 100));
  }, [central, lastCentral, coutBrut]);

  const lastYearRevenueDiff = lastCentral.reformRecettes - lastCentral.statusQuoRecettes;

  if (!hasAnyChange) {
    return (
      <section id="projection" className="py-16 border-t border-slate-100">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-3">
          L&apos;effet boule de neige sur 10 ans
        </h2>
        <p className="text-slate-400 text-center">
          Choisissez d&apos;abord un scénario ci-dessus pour voir la projection.
        </p>
      </section>
    );
  }

  const recettesData = central.map((p, i) => ({
    year: p.year,
    "Sans réforme": Math.round(p.statusQuoRecettes * 10) / 10,
    low: Math.round(pessimiste[i].reformRecettes * 10) / 10,
    bandWidth: Math.round((optimiste[i].reformRecettes - pessimiste[i].reformRecettes) * 10) / 10,
    "Avec réforme": Math.round(p.reformRecettes * 10) / 10,
  }));

  const pibData = central.map((p, i) => ({
    year: p.year,
    "Sans réforme": Math.round(p.statusQuoPib * 10) / 10,
    low: Math.round(pessimiste[i].reformPib * 10) / 10,
    bandWidth: Math.round((optimiste[i].reformPib - pessimiste[i].reformPib) * 10) / 10,
    "Avec réforme": Math.round(p.reformPib * 10) / 10,
  }));

  const jobs = lastCentral.cumulativeJobsCreated;

  return (
    <section id="projection" className="py-16 border-t border-slate-100">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-3">
        L&apos;effet boule de neige sur 10 ans
      </h2>
      <p className="text-slate-500 text-center mb-10 max-w-2xl mx-auto">
        La baisse d&apos;impots ne s&apos;arrête pas à l&apos;année 1. Elle déclenche un cercle
        vertueux qui se renforce chaque année.
      </p>

      {/* Cascade visual — 4 steps */}
      <div className="max-w-3xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row items-stretch gap-0 relative">
          {[
            { icon: "1", title: "Moins d'impôt", desc: "Le taux baisse", color: "bg-amber-100 text-amber-800 border-amber-200" },
            { icon: "2", title: "PIB en hausse", desc: `+${lastCentral.deltaGDP.toFixed(0)} Md€`, color: "bg-purple-100 text-purple-800 border-purple-200" },
            { icon: "3", title: "Emplois créés", desc: `+${jobs.toLocaleString("fr-FR")}`, color: "bg-blue-100 text-blue-800 border-blue-200" },
            { icon: "4", title: "Recettes remontent", desc: "Même avec des taux réduits", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
          ].map((step, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className={`rounded-xl p-3 border text-center flex-1 ${step.color}`}>
                <div className="text-xs font-black opacity-50">{step.icon}</div>
                <div className="text-sm font-bold">{step.title}</div>
                <div className="text-xs opacity-70 mt-0.5">{step.desc}</div>
              </div>
              {i < 3 && (
                <div className="text-slate-300 text-xl font-bold px-1 hidden md:block">→</div>
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-400 mt-3">
          Et ça boucle : plus de recettes → moins de dette → moins d&apos;intérêts à payer → encore plus de marge
        </p>
      </div>

      {/* Key results — 5 cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl mx-auto mb-6">
        <div className="bg-purple-50 rounded-xl p-5 text-center border border-purple-100">
          <div className="text-3xl font-black text-purple-600">
            +{pibDelta.toFixed(0)} Md€
          </div>
          <div className="text-xs text-purple-600 font-bold mt-1">PIB additionnel</div>
          <div className="text-[10px] text-purple-400 mt-1">
            [{pibDeltaPessimiste.toFixed(0)} — {pibDeltaOptimiste.toFixed(0)}] Md€
          </div>
        </div>
        <div className="bg-amber-50 rounded-xl p-5 text-center border border-amber-100">
          <div className="text-3xl font-black text-amber-600">
            +{lastCentral.cumulativeInvestment.toFixed(0)} Md€
          </div>
          <div className="text-xs text-amber-600 font-bold mt-1">investissement cumulé</div>
          <div className="text-[10px] text-amber-400 mt-1">
            capital, R&D, équipement, technologie
          </div>
        </div>
        <div className="bg-blue-50 rounded-xl p-5 text-center border border-blue-100">
          <div className="text-2xl font-black text-blue-600">
            +{lastCentral.cumulativeJobsCreated.toLocaleString("fr-FR")}
          </div>
          <div className="text-xs text-blue-600 font-bold mt-1">emplois créés</div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-5 text-center border border-emerald-100">
          <div className="text-2xl font-black text-emerald-600">
            +{lastCentral.cumulativeBusinessesCreated.toLocaleString("fr-FR")}
          </div>
          <div className="text-xs text-emerald-600 font-bold mt-1">entreprises créées</div>
          <div className="text-[10px] text-emerald-400 mt-1">[ordre de grandeur]</div>
        </div>
        <div className={`rounded-xl p-5 text-center border ${
          cumulativeDelta >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"
        }`}>
          <div className={`text-2xl font-black ${cumulativeDelta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {cumulativeDelta >= 0 ? "+" : ""}{cumulativeDelta.toFixed(0)} Md€
          </div>
          <div className={`text-xs font-bold mt-1 ${cumulativeDelta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            bilan recettes cumulé 10 ans
          </div>
        </div>
      </div>

      {/* Tech table — simplified columns */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="text-sm font-bold text-slate-700 mb-1">
            Projection année par année
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Détail des effets dynamiques induits par la baisse fiscale
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[550px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                  <th className="py-2 px-2 text-left">Année</th>
                  <th className="py-2 px-2 text-right">ΔPIB</th>
                  <th className="py-2 px-2 text-right">Invest. ann.</th>
                  <th className="py-2 px-2 text-right">Emplois</th>
                  <th className="py-2 px-2 text-right">Rec. delta</th>
                  <th className="py-2 px-2 text-right">Confiance</th>
                </tr>
              </thead>
              <tbody>
                {central.slice(1).map((p) => {
                  const recDelta = p.reformRecettes - p.statusQuoRecettes;
                  const confidenceColor =
                    p.confidenceLabel === "SOLIDE"
                      ? "text-emerald-600 bg-emerald-50"
                      : p.confidenceLabel === "CALIBRE"
                      ? "text-amber-600 bg-amber-50"
                      : "text-red-500 bg-red-50";
                  return (
                    <tr key={p.year} className="border-t border-slate-100">
                      <td className="py-1.5 px-2 font-medium text-slate-700">{p.year}</td>
                      <td className="py-1.5 px-2 text-right text-purple-700 font-bold">+{p.deltaGDP.toFixed(0)} Md€</td>
                      <td className="py-1.5 px-2 text-right text-amber-600">{p.yearInvestment.toFixed(1)} Md€</td>
                      <td className="py-1.5 px-2 text-right text-blue-600">{p.cumulativeJobsCreated.toLocaleString("fr-FR")}</td>
                      <td className={`py-1.5 px-2 text-right font-medium ${recDelta >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {recDelta >= 0 ? "+" : ""}{recDelta.toFixed(1)} Md€
                      </td>
                      <td className="py-1.5 px-2 text-right">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${confidenceColor}`}>
                          {p.confidenceLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 space-y-1">
            <p><strong className="text-emerald-600">SOLIDE</strong> = calibré sur des épisodes français observés (CICE, IS 2017-2022).</p>
            <p><strong className="text-amber-600">CALIBRÉ</strong> = estimé à partir de données françaises et européennes comparables.</p>
            <p><strong className="text-red-500">EXTRAPOLATION</strong> = projection au-delà de la fenêtre historique, incertitude plus élevée.</p>
            <p className="text-slate-400 italic">Calibration fondée sur les épisodes fiscaux français (CICE, baisses IS 2017-2022, réformes cotisations) et comparaisons européennes.</p>
          </div>
        </div>
      </div>

      {/* Crossover callout — honest display */}
      {crossoverYearCentral ? (
        <div className="max-w-3xl mx-auto mb-8 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <span className="text-emerald-800 font-bold">
            Dès {crossoverYearCentral} (année {crossoverYearCentral - 2024}),
          </span>{" "}
          <span className="text-emerald-700">
            les recettes avec réforme dépassent celles sans réforme.
            La baisse d&apos;impôt se rembourse elle-même.
          </span>
        </div>
      ) : crossoverYearOptimiste ? (
        <div className="max-w-3xl mx-auto mb-8 bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <span className="text-amber-800 font-bold">
            Croisement possible en {crossoverYearOptimiste} (scénario optimiste).
          </span>{" "}
          <span className="text-amber-700">
            Scénario central : coût net {Math.abs(lastYearRevenueDiff).toFixed(1)} Md€/an
          </span>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto mb-8 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
          <span className="text-slate-800 font-bold">
            Le coût net n&apos;est que de {Math.abs(lastYearRevenueDiff).toFixed(1)} Md€/an
          </span>{" "}
          <span className="text-slate-600">
            (vs {coutBrut.toFixed(1)} Md€ de coupe brute). Autofinancement : {autofinancement.toFixed(0)}%
          </span>
        </div>
      )}

      {/* Recettes chart — fan chart with confidence band */}
      <div className="max-w-3xl mx-auto mb-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="text-sm font-bold text-slate-700 mb-1">
            Recettes de l&apos;État sur 10 ans
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Taux réduit, mais assiette plus large — Bande = scénario pessimiste à optimiste
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={recettesData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="lgSQ" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#e2e8f0" }} />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={{ stroke: "#e2e8f0" }}
                domain={["auto", "auto"]}
                label={{ value: "Md€", angle: -90, position: "insideLeft", style: { fill: "#94a3b8", fontSize: 11 } }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                formatter={(value, name) => {
                  if (name === "low" || name === "bandWidth") return [null, null];
                  return [`${Number(value).toFixed(1)} Md€`, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              {crossoverYearCentral && (
                <ReferenceLine x={crossoverYearCentral} stroke="#059669" strokeDasharray="3 3"
                  label={{ value: "Croisement", fill: "#059669", fontSize: 10, position: "top" }} />
              )}
              {/* Confidence band: stacked low (invisible) + bandWidth (visible) */}
              <Area type="monotone" dataKey="low" stackId="band" stroke="none" fill="transparent" />
              <Area type="monotone" dataKey="bandWidth" stackId="band" stroke="none" fill="rgba(5,150,105,0.12)" />
              {/* Sans réforme */}
              <Line type="monotone" dataKey="Sans réforme" stroke="#f87171" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              {/* Avec réforme — central */}
              <Line type="monotone" dataKey="Avec réforme" stroke="#059669" strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* PIB chart — fan chart with confidence band */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="text-sm font-bold text-slate-700 mb-1">
            PIB — la croissance compose année après année
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Même un petit boost de croissance, appliqué chaque année, creuse l&apos;écart — Bande = pessimiste à optimiste
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={pibData} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="lgPibSQ" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#e2e8f0" }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#e2e8f0" }} domain={["auto", "auto"]}
                label={{ value: "Md€", angle: -90, position: "insideLeft", style: { fill: "#94a3b8", fontSize: 11 } }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                formatter={(value, name) => {
                  if (name === "low" || name === "bandWidth") return [null, null];
                  return [`${Number(value).toFixed(1)} Md€`, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              {/* Confidence band */}
              <Area type="monotone" dataKey="low" stackId="pibBand" stroke="none" fill="transparent" />
              <Area type="monotone" dataKey="bandWidth" stackId="pibBand" stroke="none" fill="rgba(37,99,235,0.12)" />
              {/* Lines */}
              <Line type="monotone" dataKey="Sans réforme" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="Avec réforme" stroke="#2563eb" strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
