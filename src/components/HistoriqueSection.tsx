"use client";

const keyEvents = [
  {
    year: "1988",
    title: "Création de l'ISF",
    type: "hausse" as const,
    result: "Exode fiscal massif — le rapport Marini (Sénat) documente ~843 départs/an en 2006. L'ISF rapportait ~5 Mds€/an brut mais la fuite de capitaux (~200 Mds€ cumulés selon Pichet 2007) a coûté bien plus en recettes perdues.",
    verdict: "L'impot rapporte MOINS que ce qu'il coute",
    color: "red",
  },
  {
    year: "2012",
    title: "Taxe à 75% (Hollande)",
    type: "hausse" as const,
    result: "Objectif : 500 M€/an. Résultat : ~260 M€ collectés, exode médiatisé, abandon en 2015.",
    verdict: "Recettes bien en dessous des prévisions",
    color: "red",
  },
  {
    year: "2013",
    title: "Fin du prélèvement forfaitaire",
    type: "hausse" as const,
    result: "L'impot sur les dividendes passe au barème. Les distributions chutent. Les recettes totales BAISSENT.",
    verdict: "Pattern cohérent avec un dépassement possible du seuil (calibration inspirée de Lefebvre et al. 2025, avec incertitude substantielle)",
    color: "red",
  },
  {
    year: "2017",
    title: "Flat tax 30% + fin de l'ISF",
    type: "baisse" as const,
    result: "Le taux baisse, mais les recettes sur le capital AUGMENTENT grâce au dynamisme des investissements et au retour de capitaux.",
    verdict: "Moins d'impot = plus de recettes",
    color: "green",
  },
];

export default function HistoriqueSection() {
  return (
    <section id="historique" className="py-16 border-t border-slate-100">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-3">
        Épisodes historiques et fiscalité du capital
      </h2>
      <p className="text-slate-500 text-center mb-10 max-w-xl mx-auto">
        En 40 ans, plusieurs réformes fiscales françaises offrent des
        épisodes compatibles avec la courbe de Laffer. L&apos;interprétation
        dépend des hypothèses d&apos;élasticité retenues.
      </p>

      <div className="max-w-2xl mx-auto space-y-4">
        {keyEvents.map((e) => {
          const isHausse = e.type === "hausse";
          return (
            <div
              key={e.year}
              className={`rounded-xl p-5 border-l-4 ${
                isHausse
                  ? "bg-red-50 border-l-red-400"
                  : "bg-emerald-50 border-l-emerald-400"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-black text-slate-800">
                  {e.year}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isHausse
                      ? "bg-red-100 text-red-600"
                      : "bg-emerald-100 text-emerald-600"
                  }`}
                >
                  {isHausse ? "Hausse d'impot" : "Baisse d'impot"}
                </span>
                <span className="font-bold text-slate-800">{e.title}</span>
              </div>
              <p className="text-sm text-slate-600 mb-2">{e.result}</p>
              <p
                className={`text-xs font-bold ${
                  isHausse ? "text-red-600" : "text-emerald-600"
                }`}
              >
                → {e.verdict}
              </p>
            </div>
          );
        })}
      </div>

      <div className="max-w-2xl mx-auto mt-8 bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
        <p className="text-amber-800 text-sm font-semibold">
          Selon notre calibration, ces épisodes suggèrent que les variations
          de taux sur le capital s&apos;accompagnent souvent de variations
          opposées des recettes. Cette interprétation dépend des hypothèses
          d&apos;élasticité retenues et reste entourée d&apos;incertitudes.
        </p>
      </div>
    </section>
  );
}
