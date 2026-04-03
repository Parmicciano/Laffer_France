"use client";

import { useMemo } from "react";
import { taxTypes, type TaxTypeKey } from "@/data/economicData";
import { generateLafferCurve } from "@/utils/calculations";

interface LafferCurveProps {
  selectedTax: TaxTypeKey;
}

export default function LafferCurve({ selectedTax }: LafferCurveProps) {
  const params = taxTypes[selectedTax];

  const { curvePath, areaPath, cursorPos, peakPos } = useMemo(() => {
    const points = generateLafferCurve(params.elasticity, 200);

    // SVG dimensions
    const W = 700;
    const H = 320;
    const padL = 50;
    const padR = 30;
    const padT = 30;
    const padB = 50;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    const toX = (tau: number) => padL + tau * chartW;
    const toY = (r: number) => padT + (1 - r) * chartH;

    // Build SVG path
    let pathD = `M ${toX(points[0].x)} ${toY(points[0].y)}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${toX(points[i].x)} ${toY(points[i].y)}`;
    }

    // Area path (closed)
    let areaD = pathD;
    areaD += ` L ${toX(1)} ${toY(0)} L ${toX(0)} ${toY(0)} Z`;

    // Cursor position (France)
    const cursorTau = params.currentEffectiveRate;
    const cursorIdx = Math.round(cursorTau * 200);
    const cursorPoint = points[Math.min(cursorIdx, points.length - 1)];

    // Peak position
    const peakTau = params.optimalRate;
    const peakIdx = Math.round(peakTau * 200);
    const peakPoint = points[Math.min(peakIdx, points.length - 1)];

    return {
      curvePath: pathD,
      areaPath: areaD,
      cursorPos: { x: toX(cursorPoint.x), y: toY(cursorPoint.y), tau: cursorTau },
      peakPos: { x: toX(peakPoint.x), y: toY(peakPoint.y), tau: peakTau },
    };
  }, [params.elasticity, params.currentEffectiveRate, params.optimalRate]);

  const W = 700;
  const H = 320;
  const padL = 50;
  const padR = 30;
  const padT = 30;
  const padB = 50;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  // Position indicator (qualitative)
  const positionInfo = {
    left_of_peak: { emoji: "✅", color: "#10b981", label: "Zone sûre" },
    left_near_peak: { emoji: "⚠️", color: "#f59e0b", label: "Proche du sommet" },
    near_peak: { emoji: "⚠️", color: "#f59e0b", label: "Proche du sommet" },
    at_or_past_peak: { emoji: "🔴", color: "#ef4444", label: "Au sommet / au-delà" },
  };

  const pos = positionInfo[params.position];

  return (
    <div className="bg-[#141414] border border-[#222] rounded-xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Courbe de Laffer — {params.shortLabel}
          </h3>
          <p className="text-sm text-neutral-400 mt-1">{params.label}</p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
          style={{
            backgroundColor: `${pos.color}15`,
            color: pos.color,
            border: `1px solid ${pos.color}30`,
          }}
        >
          <span>{pos.emoji}</span>
          {pos.label}
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[700px] mx-auto" preserveAspectRatio="xMidYMid meet">
          <defs>
            {/* Gradient for the curve fill */}
            <linearGradient id={`curveGradient-${selectedTax}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset={`${params.optimalRate * 80}%`} stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.2" />
            </linearGradient>
            {/* Gradient for the curve stroke */}
            <linearGradient id={`strokeGradient-${selectedTax}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset={`${params.optimalRate * 80}%`} stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            {/* Glow filter for cursor */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <g key={`grid-y-${v}`}>
              <line
                x1={padL}
                y1={padT + (1 - v) * chartH}
                x2={padL + chartW}
                y2={padT + (1 - v) * chartH}
                stroke="#222"
                strokeWidth="1"
              />
              <text
                x={padL - 8}
                y={padT + (1 - v) * chartH + 4}
                textAnchor="end"
                fill="#555"
                fontSize="10"
              >
                {Math.round(v * 100)}%
              </text>
            </g>
          ))}
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((v) => (
            <g key={`grid-x-${v}`}>
              <line
                x1={padL + v * chartW}
                y1={padT}
                x2={padL + v * chartW}
                y2={padT + chartH}
                stroke="#1a1a1a"
                strokeWidth="1"
              />
              <text
                x={padL + v * chartW}
                y={H - padB + 20}
                textAnchor="middle"
                fill="#555"
                fontSize="10"
              >
                {Math.round(v * 100)}%
              </text>
            </g>
          ))}

          {/* Axis labels */}
          <text
            x={padL + chartW / 2}
            y={H - 5}
            textAnchor="middle"
            fill="#888"
            fontSize="11"
            fontWeight="500"
          >
            Taux d&apos;imposition effectif
          </text>
          <text
            x={12}
            y={padT + chartH / 2}
            textAnchor="middle"
            fill="#888"
            fontSize="11"
            fontWeight="500"
            transform={`rotate(-90, 12, ${padT + chartH / 2})`}
          >
            Recettes
          </text>

          {/* Filled area under curve */}
          <path
            d={areaPath}
            fill={`url(#curveGradient-${selectedTax})`}
          />

          {/* Curve line */}
          <path
            d={curvePath}
            fill="none"
            stroke={`url(#strokeGradient-${selectedTax})`}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Peak marker */}
          <line
            x1={peakPos.x}
            y1={peakPos.y}
            x2={peakPos.x}
            y2={padT + chartH}
            stroke="#555"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
          <text
            x={peakPos.x}
            y={padT + chartH + 35}
            textAnchor="middle"
            fill="#888"
            fontSize="9"
            fontWeight="500"
          >
            τ* = {Math.round(params.optimalRate * 100)}%
          </text>
          <text
            x={peakPos.x}
            y={peakPos.y - 12}
            textAnchor="middle"
            fill="#888"
            fontSize="9"
          >
            Sommet
          </text>

          {/* France cursor — vertical line */}
          <line
            x1={cursorPos.x}
            y1={cursorPos.y}
            x2={cursorPos.x}
            y2={padT + chartH}
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="3,3"
            opacity="0.6"
          />

          {/* France cursor — dot */}
          <g className="laffer-cursor">
            <circle
              cx={cursorPos.x}
              cy={cursorPos.y}
              r="7"
              fill="#f59e0b"
              stroke="#0a0a0a"
              strokeWidth="2"
            />
          </g>

          {/* France cursor — label */}
          <g>
            <rect
              x={cursorPos.x - 40}
              y={cursorPos.y - 35}
              width="80"
              height="22"
              rx="4"
              fill="#f59e0b"
              opacity="0.9"
            />
            <text
              x={cursorPos.x}
              y={cursorPos.y - 20}
              textAnchor="middle"
              fill="#0a0a0a"
              fontSize="11"
              fontWeight="700"
            >
              France {Math.round(cursorPos.tau * 100)}%
            </text>
          </g>

          {/* Zone labels */}
          <text
            x={padL + chartW * 0.15}
            y={padT + chartH - 10}
            textAnchor="middle"
            fill="#10b981"
            fontSize="9"
            opacity="0.7"
          >
            Zone productive
          </text>
          <text
            x={padL + chartW * 0.85}
            y={padT + chartH - 10}
            textAnchor="middle"
            fill="#ef4444"
            fontSize="9"
            opacity="0.7"
          >
            Zone contre-productive
          </text>
        </svg>
      </div>

      {/* Description panel */}
      <div className="mt-4 p-4 bg-[#0e0e0e] rounded-lg border border-[#1a1a1a]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-neutral-500 mb-1">Recettes</div>
            <div className="text-white font-semibold">{params.recettes} Md€</div>
          </div>
          <div>
            <div className="text-neutral-500 mb-1">Élasticité (ε)</div>
            <div className="text-white font-semibold">{params.elasticity}</div>
          </div>
          <div>
            <div className="text-neutral-500 mb-1">Taux optimal (τ*)</div>
            <div className="text-white font-semibold">{Math.round(params.optimalRate * 100)}%</div>
          </div>
          <div>
            <div className="text-neutral-500 mb-1">Autofinancement</div>
            <div className="text-white font-semibold">{Math.round(params.selfFinancingRate_ETI * 100)}%</div>
          </div>
        </div>
        <p className="text-neutral-400 text-sm mt-3 leading-relaxed">
          {params.positionDescription}
        </p>
        {params.maxAdditionalRevenue <= 0.05 && (
          <p className="text-amber-400/80 text-xs mt-2 font-medium">
            Marge d&apos;augmentation des recettes en montant les taux : seulement{" "}
            {Math.round(params.maxAdditionalRevenue * 100)}%
          </p>
        )}
      </div>
    </div>
  );
}
