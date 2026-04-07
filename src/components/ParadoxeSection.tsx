"use client";

import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────

const silentExodus = [
  {
    category: "Entrepreneurs & fondateurs",
    visible: "Cas médiatisés de fondateurs expatriés",
    invisible: "~4 200 créateurs d'entreprise partis entre 2017 et 2023 (estimation)",
    impact: "Chaque startup délocalisée = 50 à 500 emplois non créés en France (hypothèse)",
    source: "DGFiP, flux migratoires fiscaux",
  },
  {
    category: "Cadres dirigeants & ingénieurs",
    visible: "Cas médiatisés de dirigeants expatriés",
    invisible: "~12 000 foyers fiscaux à hauts revenus par an quittent la France (estimation)",
    impact: "Perte estimée de 1,5 à 3 Md€/an de base taxable directe",
    source: "Rexecode, DGFiP",
  },
  {
    category: "Capitaux & investissements",
    visible: "Les holdings qui se délocalisent",
    invisible: "~30 Md€/an d'investissements détournés vers l'Irlande, les Pays-Bas, la Suisse",
    impact: "Chaque milliard non investi = ~8 000 emplois non créés",
    source: "OCDE, FDI inflows France vs pairs",
  },
  {
    category: "Jeunes diplômés",
    visible: "Le 'brain drain' dans la presse",
    invisible: "~180 000 Français de 18-35 ans vivent à Londres, Amsterdam, Dublin",
    impact: "Formation payée par la France, impôts payés ailleurs",
    source: "Registres consulaires, INSEE mobilité",
  },
];

const actes = [
  {
    numero: "I",
    intuition: "Taxer plus les riches finance les hôpitaux",
    reveal: "Quand les riches partent, leur impôt part avec eux.",
    preuve: "L'ISF rapportait 5 Md€ bruts. Mais les 19 000 contribuables partis ont emporté leur IR, leur IS, leurs plus-values et leur consommation taxable. Rexecode estime le manque à gagner total à 7 Md€/an minimum. Bilan : l'ISF a fait perdre au moins 2 Md€/an de recettes nettes.",
    source: "Rexecode ; DGFiP ; Cour des Comptes",
    verdict: "L'ISF coûtait plus qu'il ne rapportait.",
  },
  {
    numero: "II",
    intuition: "Baisser les impôts, c'est un cadeau aux riches",
    reveal: "En 2017, on baisse le taux sur le capital à 30%. Les riches paient... PLUS.",
    preuve: "Dividendes distribués : 14,3 Md€ (2017) → 23,2 Md€ (2019). Recettes fiscales en hausse malgré un taux plus bas. Le 'cadeau' a rapporté de l'argent à l'État.",
    source: "France Stratégie 2021 ; DGFiP",
    verdict: "Baisser le taux a AUGMENTÉ les recettes.",
  },
  {
    numero: "III",
    intuition: "Sans impôts élevés, on devra couper dans les services publics",
    reveal: "La France taxe 27% de plus que la moyenne OCDE. Pourtant, les services publics se dégradent.",
    preuve: "169 Md€ de déficit MALGRÉ des impôts records. 38e/38 en compétitivité. Les urgences ferment, les profs manquent, les routes se fissurent — pas parce qu'on ne taxe pas assez, mais parce que l'assiette rétrécit.",
    source: "INSEE 2024 ; OCDE",
    verdict: "Le statu quo EST déjà la coupe.",
  },
];

// ─────────────────────────────────────────────────
// ANIMATED COUNTER (Lupin "dossier reveal" style)
// ─────────────────────────────────────────────────

function AnimatedNumber({ target, suffix = "", duration = 1500 }: { target: number; suffix?: string; duration?: number }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setValue(Math.round(target * eased));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <div ref={ref} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {value.toLocaleString("fr-FR")}{suffix}
    </div>
  );
}

// ─────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────

export default function ParadoxeSection() {
  const [revealedActe, setRevealedActe] = useState<number | null>(null);
  const [dossierOpen, setDossierOpen] = useState(false);

  return (
    <section className="py-16 border-t border-slate-100">

      {/* ───── PROLOGUE : On parle leur langage ───── */}
      <div className="max-w-2xl mx-auto text-center mb-14">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-[0.2em] mb-4">
          <span className="w-8 h-px bg-slate-300" />
          Le paradoxe
          <span className="w-8 h-px bg-slate-300" />
        </div>

        <h2 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight">
          Vous voulez plus d{"'"}argent<br />
          pour les hôpitaux, les écoles, les retraites ?
        </h2>

        <p className="text-lg text-slate-500 mt-6 leading-relaxed max-w-xl mx-auto">
          <strong className="text-slate-800">Nous aussi.</strong>
          {" "}Là n{"'"}est pas le débat.
        </p>

        <p className="text-base text-slate-500 mt-3 leading-relaxed max-w-xl mx-auto">
          Le débat, c{"'"}est de savoir si un euro d{"'"}impôt
          supplémentaire <em>rapporte</em> réellement un euro.
          Parce que quand la réponse est non, c{"'"}est l{"'"}hôpital qui perd.
        </p>
      </div>

      {/* ───── ACTE CENTRAL : Le tour en 3 temps ───── */}
      {/* Comme Lupin : chaque carte est retournée une par une */}
      <div className="max-w-3xl mx-auto mb-16">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5 text-center">
          Trois idées reçues. Trois faits. Cliquez pour retourner.
        </div>

        <div className="space-y-4">
          {actes.map((acte, i) => {
            const isOpen = revealedActe === i;
            return (
              <div
                key={i}
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                onClick={() => setRevealedActe(isOpen ? null : i)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setRevealedActe(isOpen ? null : i); } }}
                className={`relative rounded-2xl border shadow-sm cursor-pointer transition-all duration-500 overflow-hidden ${
                  isOpen
                    ? "border-slate-300 bg-gradient-to-br from-slate-50 to-white"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                }`}
              >
                <div className="px-6 py-5">
                  <div className="flex items-start gap-4">
                    {/* Numéro d'acte — style dossier */}
                    <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black transition-all duration-500 ${
                      isOpen
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                        : "bg-slate-100 text-slate-400"
                    }`}>
                      {acte.numero}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* L'intuition — barrée quand révélée */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full transition-all duration-500 ${
                          isOpen
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-50 text-red-400"
                        }`}>
                          {isOpen ? "Les faits" : "L'idée reçue"}
                        </span>
                      </div>

                      <p className={`text-[15px] font-semibold transition-all duration-500 ${
                        isOpen ? "text-slate-400 line-through decoration-red-300" : "text-slate-800"
                      }`}>
                        {acte.intuition}
                      </p>

                      {/* Le reveal — Lupin enlève le masque */}
                      {isOpen && (
                        <div className="mt-4 space-y-3 paradoxe-reveal">
                          <p className="text-base font-semibold text-slate-900 leading-snug">
                            {acte.reveal}
                          </p>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {acte.preuve}
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <span className="text-[10px] text-slate-400">{acte.source}</span>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                              {acte.verdict}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Indicateur clic */}
                    <div className={`shrink-0 mt-1 transition-transform duration-500 ${isOpen ? "rotate-180" : ""}`}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M6 8l4 4 4-4" stroke={isOpen ? "#059669" : "#cbd5e1"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ───── LE DOSSIER : L'exode silencieux ───── */}
      {/* Lupin ouvre le coffre-fort. Le vrai trésor n'est pas ce qu'on croit. */}
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-2">
          <button
            onClick={() => setDossierOpen(!dossierOpen)}
            className="group inline-flex items-center gap-3 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors py-2 px-4 rounded-full hover:bg-slate-50"
          >
            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-300 ${
              dossierOpen ? "border-emerald-400 bg-emerald-50 rotate-45" : "border-slate-300 group-hover:border-slate-400"
            }`}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 3v6M3 6h6" stroke={dossierOpen ? "#059669" : "#94a3b8"} strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
            Ouvrir le dossier : l{"'"}exode que personne ne montre
          </button>
          <div className="text-[10px] text-slate-400 mt-1">
            Les départs médiatisés ne sont que la partie visible. Estimations hypothétiques.
          </div>
        </div>

        {dossierOpen && (
          <div className="paradoxe-reveal mt-6">

            {/* Le coffre-fort s'ouvre — panel dark cinématique */}
            <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl mb-8">
              {/* En-tête style dossier confidentiel */}
              <div className="px-6 pt-6 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    Données compilées — DGFiP, Rexecode, OCDE, INSEE
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-3">
                  Pour chaque nom dans la presse, des milliers partent en silence
                </h3>
              </div>

              {/* Les 4 compteurs animés */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-800">
                {[
                  { target: 12000, suffix: "", label: "foyers aisés partent", sub: "chaque année", color: "text-red-400" },
                  { target: 30, suffix: " Md€", label: "d'investissement", sub: "détournés par an", color: "text-amber-400" },
                  { target: 180000, suffix: "", label: "jeunes diplômés", sub: "partis à l'étranger", color: "text-blue-400" },
                  { target: 240000, suffix: "", label: "emplois non créés", sub: "(estimation)", color: "text-emerald-400" },
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-900 px-4 py-6 text-center">
                    <div className={`text-2xl md:text-3xl font-black ${stat.color}`}>
                      <AnimatedNumber target={stat.target} suffix={stat.suffix} duration={1800 + i * 300} />
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2 leading-tight">
                      {stat.label}<br />{stat.sub}
                    </div>
                  </div>
                ))}
              </div>

              {/* La phrase qui tue — style Lupin monologue */}
              <div className="px-6 py-5 text-center">
                <p className="text-sm text-slate-400 italic">
                  {"\""}On ne vole pas un coffre en cassant la serrure.
                  On convainc le propriétaire de l{"'"}ouvrir lui-même.{"\""}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  La fiscalité excessive fait exactement ça : elle convainc les
                  contribuables de partir <em>d{"'"}eux-mêmes</em>.
                </p>
              </div>
            </div>

            {/* Décomposition par catégorie — l'iceberg */}
            <div className="relative mb-8">
              <div className="text-center mb-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  La surface vs la profondeur
                </span>
              </div>
              <div className="space-y-3">
                {silentExodus.map((item, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-xs font-bold text-slate-800 mb-3">{item.category}</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          Ce qu{"'"}on voit
                        </span>
                        <span className="text-xs text-slate-500">{item.visible}</span>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3">
                        <span className="text-[9px] font-semibold text-red-400 uppercase tracking-wider block mb-1">
                          Ce qu{"'"}on ne voit pas
                        </span>
                        <span className="text-xs text-slate-800 font-medium">{item.invisible}</span>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3">
                        <span className="text-[9px] font-semibold text-amber-500 uppercase tracking-wider block mb-1">
                          Ce que ça coûte
                        </span>
                        <span className="text-xs text-red-700 font-medium">{item.impact}</span>
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-2 text-right italic">{item.source}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Le mot de la fin — le gentleman repose le masque */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 md:p-8 text-center">
              <p className="text-base md:text-lg text-emerald-900 leading-relaxed font-medium">
                Un contribuable qui reste et paie 30%
                <br />
                rapporte <strong>infiniment plus</strong>
                <br />
                qu{"'"}un contribuable qui fuit un taux de 50%.
              </p>
              <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                <span className="font-mono font-bold text-emerald-700 bg-white/60 px-4 py-2 rounded-lg border border-emerald-200">
                  30% de quelque chose
                </span>
                <span className="text-emerald-600 font-black text-lg">{">"}</span>
                <span className="font-mono font-bold text-red-500 bg-white/60 px-4 py-2 rounded-lg border border-red-200">
                  50% de rien
                </span>
              </div>
              <p className="text-xs text-emerald-600 mt-5">
                Ce n{"'"}est ni de droite ni de gauche. C{"'"}est de l{"'"}arithmétique.
              </p>
            </div>

          </div>
        )}
      </div>
    </section>
  );
}
