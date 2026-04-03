"use client";

import { taxTypes, concreteExamples, type TaxTypeKey } from "@/data/economicData";

const gaugeConfig: {
  key: TaxTypeKey;
  label: string;
  description: string;
  recettes: string;
}[] = [
  {
    key: "capital",
    label: "Impot sur le capital",
    description: "100€ de bénéfice → IS 25% → reste 75€ → PFU 30% → reste 52.50€ = taux combiné 47.5%",
    recettes: "120 milliards €/an",
  },
  {
    key: "travail",
    label: "Impot sur le travail qualifié",
    description: "Médecin 150k : cotis. 31.5% + IR 41% sur le net = taux marginal 57-65% selon revenu. Moyenne : 63%",
    recettes: "650 milliards €/an",
  },
  {
    key: "cotisationsPatronales",
    label: "Cotisations patronales",
    description: "47% du brut au-dessus de 1.6 SMIC, après fin de l'allègement Fillon",
    recettes: "280 milliards €/an",
  },
  {
    key: "tva",
    label: "TVA / Consommation",
    description: "Taux standard 20% — pas de pic de Laffer dans les modèles standards (Trabandt & Uhlig 2011)",
    recettes: "200 milliards €/an",
  },
];

function GaugeBar({ taxKey }: { taxKey: TaxTypeKey }) {
  const params = taxTypes[taxKey];
  const ratio = (params.currentEffectiveRate / params.optimalRate) * 100;

  let statusColor = "bg-emerald-500";
  let statusText = "Marge de manoeuvre";
  let statusTextColor = "text-emerald-700";
  let statusBg = "bg-emerald-50";
  let ringColor = "ring-emerald-200";

  if (ratio >= 95) {
    statusColor = "bg-red-500";
    statusText = ratio >= 100 ? "DÉPASSÉ — baisser pour gagner plus" : "Au maximum";
    statusTextColor = "text-red-700";
    statusBg = "bg-red-50";
    ringColor = "ring-red-200";
  } else if (ratio >= 70) {
    statusColor = "bg-amber-500";
    statusText = "Proche du maximum";
    statusTextColor = "text-amber-700";
    statusBg = "bg-amber-50";
    ringColor = "ring-amber-200";
  }

  const config = gaugeConfig.find((g) => g.key === taxKey)!;

  // Gauge rendering: the bar shows 0% to 120% of optimal
  const markerPos = Math.min((ratio / 120) * 100, 100);
  const peakPos = (100 / 120) * 100; // 100% of optimal on a 120% scale = 83.3%

  return (
    <div className={`rounded-xl p-5 border ${statusBg} ring-1 ${ringColor}`}>
      <div className="flex justify-between items-start mb-1">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">{config.label}</h4>
          <p className="text-[11px] text-slate-500">{config.description}</p>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusBg} ${statusTextColor} shrink-0`}>
          {Math.round(params.currentEffectiveRate * 100)}% → seuil {Math.round(params.optimalRate * 100)}%
        </span>
      </div>

      {/* Gauge bar */}
      <div className="mt-3 relative">
        <div className="h-6 bg-white rounded-full overflow-hidden border border-slate-200 relative">
          {/* Zones */}
          <div className="absolute inset-y-0 left-0 bg-emerald-100" style={{ width: `${peakPos * 0.7}%` }} />
          <div className="absolute inset-y-0 bg-amber-100" style={{ left: `${peakPos * 0.7}%`, width: `${peakPos * 0.3}%` }} />
          <div className="absolute inset-y-0 bg-red-100" style={{ left: `${peakPos}%`, right: 0 }} />

          {/* Fill */}
          <div
            className={`absolute inset-y-0 left-0 ${statusColor} rounded-full transition-all duration-500`}
            style={{ width: `${markerPos}%`, opacity: 0.75 }}
          />

          {/* Peak line */}
          <div className="absolute inset-y-0 w-0.5 bg-slate-500 z-10" style={{ left: `${peakPos}%` }} />
          <div
            className="absolute -top-5 text-[9px] text-slate-500 font-semibold z-10 -translate-x-1/2"
            style={{ left: `${peakPos}%` }}
          >
            Seuil
          </div>
        </div>

        <div className="flex justify-between mt-1.5 text-[10px]">
          <span className="text-slate-400">0%</span>
          <span className="text-slate-500">
            Taux marginal actuel : <strong>{Math.round(params.currentEffectiveRate * 100)}%</strong>
            {" "}| Seuil optimal : <strong>{Math.round(params.optimalRate * 100)}%</strong>
          </span>
        </div>
      </div>

      <p className={`text-xs font-semibold mt-2 ${statusTextColor}`}>
        {statusText}
      </p>
    </div>
  );
}

export default function JaugesFiscales() {
  return (
    <section id="jauges" className="py-16 border-t border-slate-100">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-3">
        Chaque impot a un seuil. Plusieurs sont déjà dépassés.
      </h2>
      <p className="text-slate-500 text-center mb-10 max-w-xl mx-auto">
        La jauge montre où se situe le taux <strong className="text-slate-700">marginal</strong> français
        par rapport au maximum théorique. Au-delà du seuil, augmenter le taux fait <strong className="text-slate-700">baisser</strong> les recettes.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {gaugeConfig.map((g) => (
          <GaugeBar key={g.key} taxKey={g.key} />
        ))}
      </div>

      {/* Légende */}
      <div className="flex justify-center gap-6 mt-6 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-emerald-400" /> Marge
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-amber-400" /> Proche du seuil
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-400" /> Au seuil / dépassé
        </span>
      </div>

      {/* Exemples concrets */}
      <div className="max-w-3xl mx-auto mt-12">
        <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
          Ce que ça veut dire dans la vraie vie
        </h3>
        <p className="text-sm text-slate-500 text-center mb-6">
          Voici comment ces taux marginaux affectent des vrais gens, tous les jours.
        </p>

        <div className="space-y-3">
          {concreteExamples.map((ex, idx) => {
            const isPastPeak = ex.marginalRate >= ex.optimalRate;
            return (
              <div
                key={idx}
                className={`rounded-xl p-4 border-l-4 ${
                  isPastPeak
                    ? "bg-red-50 border-l-red-400"
                    : "bg-amber-50 border-l-amber-400"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <h4 className="font-bold text-slate-800">{ex.title}</h4>
                  <div className="flex items-center gap-3 text-sm">
                    <span className={`font-black ${isPastPeak ? "text-red-600" : "text-amber-600"}`}>
                      {Math.round(ex.marginalRate * 100)}% prélevé
                    </span>
                    <span className="text-slate-400">→</span>
                    <span className={`font-black ${isPastPeak ? "text-red-600" : "text-amber-600"}`}>
                      {Math.round(ex.netPerEuro * 100)} centimes gardés / euro
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-1">{ex.description}</p>
                <p className={`text-xs font-semibold ${isPastPeak ? "text-red-600" : "text-amber-600"}`}>
                  → {ex.verdict}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
