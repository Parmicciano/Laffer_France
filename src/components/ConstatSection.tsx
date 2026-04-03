"use client";

import { macroData, internationalComparison } from "@/data/economicData";

export default function ConstatSection() {
  const maxTax = 50; // for bar scale

  return (
    <section id="constat" className="py-16 border-t border-slate-100">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-3">
        La France taxe plus que presque tout le monde
      </h2>
      <p className="text-slate-500 text-center mb-10 max-w-xl mx-auto">
        Avec 43,5% de sa richesse nationale prélevée en impots, la France est
        2ème de l&apos;OCDE et dernière en compétitivité fiscale.
      </p>

      {/* Key stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="bg-red-50 rounded-xl p-6 text-center border border-red-100">
          <div className="text-4xl font-black text-red-600">{macroData.taxToGdp}%</div>
          <div className="text-sm text-red-800 font-medium mt-1">
            de la richesse part en impots
          </div>
          <div className="text-xs text-red-400 mt-2">
            Moyenne OCDE : {macroData.taxToGdpOcde}% — la France est{" "}
            {(macroData.taxToGdp - macroData.taxToGdpOcde).toFixed(1)} points au-dessus
          </div>
        </div>
        <div className="bg-amber-50 rounded-xl p-6 text-center border border-amber-100">
          <div className="text-4xl font-black text-amber-600">38<span className="text-xl">/38</span></div>
          <div className="text-sm text-amber-800 font-medium mt-1">
            en compétitivité fiscale OCDE
          </div>
          <div className="text-xs text-amber-400 mt-2">
            Tax Competitiveness Index — dernier du classement
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-6 text-center border border-slate-200">
          <div className="text-4xl font-black text-slate-700">-169 <span className="text-xl">Mds€</span></div>
          <div className="text-sm text-slate-600 font-medium mt-1">
            de déficit public (5,8% du PIB)
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Malgré un record d&apos;impots, le budget n&apos;est toujours pas à l&apos;équilibre
          </div>
        </div>
      </div>

      {/* Country comparison bars */}
      <div className="max-w-2xl mx-auto">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Comparaison internationale — Impots en % du PIB
        </h3>
        <div className="space-y-2">
          {internationalComparison.map((c) => {
            const isFrance = c.country === "France";
            const isOcde = c.country === "Moyenne OCDE";
            const barWidth = (c.taxToGdp / maxTax) * 100;
            return (
              <div key={c.country} className="flex items-center gap-3">
                <div className={`w-28 text-right text-sm shrink-0 ${isFrance ? "font-bold text-red-600" : isOcde ? "font-semibold text-blue-600" : "text-slate-500"}`}>
                  {c.country}
                </div>
                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isFrance ? "bg-red-500" : isOcde ? "bg-blue-400" : "bg-slate-300"
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <div className={`w-12 text-sm text-right ${isFrance ? "font-bold text-red-600" : isOcde ? "font-semibold text-blue-600" : "text-slate-400"}`}>
                  {c.taxToGdp}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
