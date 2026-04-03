"use client";

import { useState, useMemo } from "react";
import { taxTypes, type TaxTypeKey } from "@/data/economicData";
import { generateLafferCurve } from "@/utils/calculations";

const taxButtons: { key: TaxTypeKey; label: string }[] = [
  { key: "capital", label: "Capital" },
  { key: "travail", label: "Travail" },
  { key: "cotisationsPatronales", label: "Cotisations" },
  { key: "tva", label: "TVA" },
];

export default function HeroSection() {
  const [selectedTax, setSelectedTax] = useState<TaxTypeKey>("capital");
  const params = taxTypes[selectedTax];

  const { curvePath, areaPath, cursorPos, peakPos } = useMemo(() => {
    const points = generateLafferCurve(params.elasticity, 200);

    const W = 800;
    const H = 380;
    const padL = 60;
    const padR = 40;
    const padT = 40;
    const padB = 55;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    const toX = (tau: number) => padL + tau * chartW;
    const toY = (r: number) => padT + (1 - r) * chartH;

    let pathD = `M ${toX(points[0].x)} ${toY(points[0].y)}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${toX(points[i].x)} ${toY(points[i].y)}`;
    }

    let aD = pathD;
    aD += ` L ${toX(1)} ${toY(0)} L ${toX(0)} ${toY(0)} Z`;

    const cursorTau = params.currentEffectiveRate;
    const cursorIdx = Math.round(cursorTau * 200);
    const cursorPt = points[Math.min(cursorIdx, points.length - 1)];

    const peakTau = params.optimalRate;
    const peakIdx = Math.round(peakTau * 200);
    const peakPt = points[Math.min(peakIdx, points.length - 1)];

    return {
      curvePath: pathD,
      areaPath: aD,
      cursorPos: { x: toX(cursorPt.x), y: toY(cursorPt.y), tau: cursorTau },
      peakPos: { x: toX(peakPt.x), y: toY(peakPt.y), tau: peakTau },
    };
  }, [params.elasticity, params.currentEffectiveRate, params.optimalRate]);

  const W = 800, H = 380;
  const padL = 60, padR = 40, padT = 40, padB = 55;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const isPastPeak = params.currentEffectiveRate >= params.optimalRate * 0.95;

  return (
    <section id="hero" className="pt-8 pb-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
          Et si la France gagnait plus<br />
          <span className="text-red-600">en taxant moins ?</span>
        </h2>
        <p className="text-lg text-slate-500 mt-4 max-w-2xl mx-auto">
          Quand les impots sont trop élevés, les augmenter fait <strong className="text-slate-700">baisser</strong> les
          recettes au lieu de les augmenter. C&apos;est la courbe de Laffer.
        </p>
      </div>

      {/* Courbe de Laffer */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 md:p-8 max-w-3xl mx-auto">
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="curveFill" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.12" />
                <stop offset={`${params.optimalRate * 85}%`} stopColor="#d97706" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#dc2626" stopOpacity="0.08" />
              </linearGradient>
              <linearGradient id="curveStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#059669" />
                <stop offset={`${params.optimalRate * 85}%`} stopColor="#d97706" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>

            {/* Zone labels — left and right */}
            <rect x={padL} y={padT} width={(peakPos.x - padL)} height={chartH} fill="#05966908" rx="4" />
            <rect x={peakPos.x} y={padT} width={(padL + chartW - peakPos.x)} height={chartH} fill="#dc262608" rx="4" />

            {/* Grid */}
            {[0, 0.25, 0.5, 0.75, 1].map((v) => (
              <line key={`gy${v}`} x1={padL} y1={padT + (1-v)*chartH} x2={padL+chartW} y2={padT + (1-v)*chartH} stroke="#e2e8f0" strokeWidth="1" />
            ))}

            {/* X-axis labels */}
            {[0, 20, 40, 60, 80, 100].map((v) => (
              <text key={`xl${v}`} x={padL + (v/100)*chartW} y={H - 10} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="500">
                {v}%
              </text>
            ))}
            <text x={padL + chartW/2} y={H - 0} textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="600">
              Taux d&apos;imposition →
            </text>

            {/* Y-axis label */}
            <text x={16} y={padT + chartH/2} textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="600" transform={`rotate(-90, 16, ${padT + chartH/2})`}>
              Recettes de l&apos;État →
            </text>

            {/* Area fill */}
            <path d={areaPath} fill="url(#curveFill)" />

            {/* Curve */}
            <path d={curvePath} fill="none" stroke="url(#curveStroke)" strokeWidth="3" strokeLinecap="round" />

            {/* Peak marker */}
            <line x1={peakPos.x} y1={peakPos.y} x2={peakPos.x} y2={padT+chartH} stroke="#64748b" strokeWidth="1" strokeDasharray="4,4" />
            <circle cx={peakPos.x} cy={peakPos.y} r="4" fill="#64748b" />
            <text x={peakPos.x} y={peakPos.y - 16} textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="600">
              Maximum ({Math.round(params.optimalRate * 100)}%)
            </text>

            {/* Zone annotations */}
            <text x={padL + 30} y={padT + chartH - 20} fill="#059669" fontSize="11" fontWeight="600" opacity="0.8">
              + d&apos;impots = + de recettes
            </text>
            <text x={padL + chartW - 30} y={padT + chartH - 20} textAnchor="end" fill="#dc2626" fontSize="11" fontWeight="600" opacity="0.8">
              + d&apos;impots = MOINS de recettes
            </text>

            {/* France cursor — vertical line */}
            <line x1={cursorPos.x} y1={cursorPos.y} x2={cursorPos.x} y2={padT+chartH} stroke={isPastPeak ? "#dc2626" : "#d97706"} strokeWidth="2" strokeDasharray="4,4" opacity="0.5" />

            {/* France cursor — dot */}
            <g className="laffer-cursor">
              <circle cx={cursorPos.x} cy={cursorPos.y} r="10" fill={isPastPeak ? "#dc2626" : "#d97706"} stroke="#fff" strokeWidth="3" />
            </g>

            {/* France label */}
            <g>
              <rect x={cursorPos.x - 50} y={cursorPos.y - 42} width="100" height="26" rx="6" fill={isPastPeak ? "#dc2626" : "#d97706"} />
              <text x={cursorPos.x} y={cursorPos.y - 24} textAnchor="middle" fill="#fff" fontSize="13" fontWeight="800">
                LA FRANCE
              </text>
            </g>

            {/* Arrow annotation if past peak */}
            {isPastPeak && cursorPos.x < padL + chartW - 80 && (
              <g>
                <line x1={cursorPos.x + 20} y1={cursorPos.y + 10} x2={cursorPos.x + 60} y2={cursorPos.y + 30} stroke="#dc2626" strokeWidth="2" markerEnd="url(#arrowhead)" />
                <defs>
                  <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#dc2626" />
                  </marker>
                </defs>
                <text x={cursorPos.x + 65} y={cursorPos.y + 36} fill="#dc2626" fontSize="10" fontWeight="600">
                  Si on monte encore
                </text>
                <text x={cursorPos.x + 65} y={cursorPos.y + 48} fill="#dc2626" fontSize="10" fontWeight="600">
                  → on perd des recettes
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Tax type pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <span className="text-xs text-slate-400 self-center mr-1">Voir pour :</span>
          {taxButtons.map((t) => {
            const isActive = t.key === selectedTax;
            const tp = taxTypes[t.key];
            const isPast = tp.currentEffectiveRate >= tp.optimalRate * 0.95;
            return (
              <button
                key={t.key}
                onClick={() => setSelectedTax(t.key)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  isActive
                    ? isPast
                      ? "bg-red-100 text-red-700 ring-2 ring-red-300"
                      : "bg-blue-100 text-blue-700 ring-2 ring-blue-300"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* One-line verdict */}
        <p className={`text-center mt-4 text-sm font-semibold ${isPastPeak ? "text-red-600" : "text-amber-600"}`}>
          {params.positionDescription}
        </p>
      </div>
    </section>
  );
}
