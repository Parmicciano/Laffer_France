"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { computeCombinedImpact, formatMd, type ScenarioInput } from "@/utils/calculations";
import { macroData, taxTypes } from "@/data/economicData";

interface SliderProps {
  label: string;
  sublabel: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
  color: string;
  recettes: number;
}

function Slider({ label, sublabel, value, max, onChange, color, recettes }: SliderProps) {
  const grossLoss = recettes * (value / 100);
  return (
    <div className="bg-[#0e0e0e] rounded-lg p-4 border border-[#1a1a1a]">
      <div className="flex justify-between items-center mb-2">
        <div>
          <span className="text-sm font-medium text-white">{label}</span>
          <span className="text-xs text-neutral-500 ml-2">{sublabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-lg font-bold tabular-nums"
            style={{ color: value > 0 ? color : "#666" }}
          >
            -{value}%
          </span>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${(value / max) * 100}%, #333 ${(value / max) * 100}%, #333 100%)`,
        }}
      />
      <div className="flex justify-between mt-1">
        <span className="text-xs text-neutral-600">0%</span>
        <span className="text-xs text-neutral-500">
          {value > 0 ? `Perte brute : -${grossLoss.toFixed(1)} Md€` : "Aucune baisse"}
        </span>
        <span className="text-xs text-neutral-600">-{max}%</span>
      </div>
    </div>
  );
}

interface ScenarioSimulatorProps {
  scenario: ScenarioInput;
  onScenarioChange: (s: ScenarioInput) => void;
}

export default function ScenarioSimulator({
  scenario,
  onScenarioChange,
}: ScenarioSimulatorProps) {
  const impact = useMemo(
    () => computeCombinedImpact(scenario),
    [scenario]
  );

  // Prepare waterfall chart data
  const waterfallData = useMemo(() => {
    const items: { name: string; perte: number; recuperation: number; label: string }[] = [];

    if (scenario.travail > 0) {
      const d = impact.details.travail;
      items.push({
        name: "Travail",
        perte: -d.grossLoss,
        recuperation: d.dynamicRecovery,
        label: `Net: ${formatMd(-d.netLoss)}`,
      });
    }

    if (scenario.capital > 0) {
      const d = impact.details.capital;
      items.push({
        name: "Capital",
        perte: -d.grossLoss,
        recuperation: d.dynamicRecovery + d.crossEffect,
        label: `Net: ${formatMd(-d.netLoss)}`,
      });
    }

    if (scenario.cotisationsPatronales > 0) {
      const d = impact.details.cotisationsPatronales;
      items.push({
        name: "Cotisations",
        perte: -d.grossLoss,
        recuperation: d.dynamicRecovery + d.employmentGain,
        label: `Net: ${formatMd(-d.netLoss)}`,
      });
    }

    items.push({
      name: "TOTAL",
      perte: -impact.totalGrossLoss,
      recuperation:
        impact.totalDynamicRecovery +
        impact.totalCrossEffect +
        impact.totalEmploymentGain,
      label: `Net: ${formatMd(-impact.totalNetLoss)}`,
    });

    return items;
  }, [impact, scenario]);

  const hasAnyChange =
    scenario.travail > 0 ||
    scenario.capital > 0 ||
    scenario.cotisationsPatronales > 0;

  return (
    <div className="space-y-6">
      {/* Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Slider
          label="IR + CSG travail"
          sublabel={`${taxTypes.travail.recettes} Md€`}
          value={scenario.travail}
          max={20}
          onChange={(v) => onScenarioChange({ ...scenario, travail: v })}
          color="#f59e0b"
          recettes={taxTypes.travail.recettes}
        />
        <Slider
          label="IS + impôt capital"
          sublabel={`${taxTypes.capital.recettes} Md€`}
          value={scenario.capital}
          max={30}
          onChange={(v) => onScenarioChange({ ...scenario, capital: v })}
          color="#ef4444"
          recettes={taxTypes.capital.recettes}
        />
        <Slider
          label="Cotisations patronales"
          sublabel={`${taxTypes.cotisationsPatronales.recettes} Md€`}
          value={scenario.cotisationsPatronales}
          max={20}
          onChange={(v) =>
            onScenarioChange({ ...scenario, cotisationsPatronales: v })
          }
          color="#3b82f6"
          recettes={taxTypes.cotisationsPatronales.recettes}
        />
      </div>

      {/* Quick presets */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-neutral-500 self-center mr-2">
          Scénarios prédéfinis :
        </span>
        <button
          onClick={() =>
            onScenarioChange({ travail: 5, capital: 15, cotisationsPatronales: 10 })
          }
          className="px-3 py-1 text-xs bg-[#1a1a1a] text-neutral-300 rounded-md border border-[#2a2a2a] hover:border-amber-500/30 transition-colors"
        >
          Réforme modérée
        </button>
        <button
          onClick={() =>
            onScenarioChange({ travail: 10, capital: 25, cotisationsPatronales: 15 })
          }
          className="px-3 py-1 text-xs bg-[#1a1a1a] text-neutral-300 rounded-md border border-[#2a2a2a] hover:border-amber-500/30 transition-colors"
        >
          Réforme ambitieuse
        </button>
        <button
          onClick={() =>
            onScenarioChange({ travail: 0, capital: 20, cotisationsPatronales: 0 })
          }
          className="px-3 py-1 text-xs bg-[#1a1a1a] text-neutral-300 rounded-md border border-[#2a2a2a] hover:border-amber-500/30 transition-colors"
        >
          Capital seul
        </button>
        <button
          onClick={() =>
            onScenarioChange({ travail: 0, capital: 0, cotisationsPatronales: 15 })
          }
          className="px-3 py-1 text-xs bg-[#1a1a1a] text-neutral-300 rounded-md border border-[#2a2a2a] hover:border-amber-500/30 transition-colors"
        >
          Cotisations seules
        </button>
        <button
          onClick={() =>
            onScenarioChange({ travail: 0, capital: 0, cotisationsPatronales: 0 })
          }
          className="px-3 py-1 text-xs bg-[#1a1a1a] text-neutral-400 rounded-md border border-[#2a2a2a] hover:border-neutral-500/30 transition-colors"
        >
          Reset
        </button>
      </div>

      {hasAnyChange ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#141414] border border-[#222] rounded-lg p-4">
              <div className="text-xs text-neutral-500 mb-1">Perte brute</div>
              <div className="text-xl font-bold text-red-400">
                -{impact.totalGrossLoss.toFixed(1)} Md€
              </div>
            </div>
            <div className="bg-[#141414] border border-[#222] rounded-lg p-4">
              <div className="text-xs text-neutral-500 mb-1">
                Récupération dynamique
              </div>
              <div className="text-xl font-bold text-emerald-400">
                +
                {(
                  impact.totalDynamicRecovery +
                  impact.totalCrossEffect +
                  impact.totalEmploymentGain
                ).toFixed(1)}{" "}
                Md€
              </div>
            </div>
            <div className="bg-[#141414] border border-[#222] rounded-lg p-4">
              <div className="text-xs text-neutral-500 mb-1">Perte nette</div>
              <div
                className={`text-xl font-bold ${
                  impact.totalNetLoss > 0 ? "text-blue-400" : "text-emerald-400"
                }`}
              >
                {impact.totalNetLoss > 0 ? "-" : "+"}
                {Math.abs(impact.totalNetLoss).toFixed(1)} Md€
              </div>
            </div>
            <div className="bg-[#141414] border border-[#222] rounded-lg p-4">
              <div className="text-xs text-neutral-500 mb-1">
                Autofinancement
              </div>
              <div
                className={`text-xl font-bold ${
                  impact.totalSelfFinancing >= 70
                    ? "text-emerald-400"
                    : impact.totalSelfFinancing >= 50
                    ? "text-amber-400"
                    : "text-red-400"
                }`}
              >
                {impact.totalSelfFinancing.toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Waterfall chart */}
          <div className="bg-[#141414] border border-[#222] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-1">
              Décomposition de l&apos;impact
            </h3>
            <p className="text-sm text-neutral-500 mb-4">
              Perte brute vs récupération dynamique par type d&apos;impôt
            </p>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={waterfallData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#888", fontSize: 12 }}
                  axisLine={{ stroke: "#333" }}
                />
                <YAxis
                  tick={{ fill: "#888", fontSize: 11 }}
                  axisLine={{ stroke: "#333" }}
                  tickFormatter={(v: number) => `${v} Md€`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(value, name) => [
                    `${Number(value).toFixed(1)} Md€`,
                    name === "perte" ? "Perte brute" : "Récupération",
                  ]}
                />
                <Legend
                  formatter={(value: string) =>
                    value === "perte" ? "Perte brute" : "Récupération dynamique"
                  }
                  wrapperStyle={{ fontSize: "12px", color: "#888" }}
                />
                <ReferenceLine
                  y={0}
                  stroke="#444"
                  strokeWidth={1}
                />
                <Bar dataKey="perte" stackId="a" radius={[0, 0, 0, 0]}>
                  {waterfallData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={
                        entry.name === "TOTAL" ? "#ef444480" : "#ef4444"
                      }
                    />
                  ))}
                </Bar>
                <Bar dataKey="recuperation" stackId="a" radius={[4, 4, 0, 0]}>
                  {waterfallData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={
                        entry.name === "TOTAL" ? "#10b98180" : "#10b981"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Employment and exile effects */}
          {(impact.totalNewJobs > 0 ||
            scenario.capital > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {impact.totalNewJobs > 0 && (
                <div className="bg-[#141414] border border-[#222] rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-blue-400 mb-3">
                    Effet emploi (cotisations patronales)
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">
                        Emplois créés (année 1)
                      </span>
                      <span className="text-white font-medium">
                        +{impact.totalNewJobs.toLocaleString("fr-FR")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">TVA induite</span>
                      <span className="text-emerald-400">
                        +{impact.details.cotisationsPatronales.tvaInduced.toFixed(1)}{" "}
                        Md€
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">IR induit</span>
                      <span className="text-emerald-400">
                        +{impact.details.cotisationsPatronales.irInduced.toFixed(1)}{" "}
                        Md€
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-[#222] pt-2">
                      <span className="text-neutral-300 font-medium">
                        Gain total emploi
                      </span>
                      <span className="text-emerald-400 font-bold">
                        +{impact.details.cotisationsPatronales.employmentGain.toFixed(1)}{" "}
                        Md€
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {scenario.capital > 0 && (
                <div className="bg-[#141414] border border-[#222] rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-red-400 mb-3">
                    Effet capital (cross-élasticité)
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">
                        Autofinancement direct
                      </span>
                      <span className="text-emerald-400">
                        {Math.round(taxTypes.capital.selfFinancingRate_ETI * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">
                        Cross-élasticité (→ travail)
                      </span>
                      <span className="text-emerald-400">
                        +{impact.details.capital.crossEffect.toFixed(1)} Md€
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-[#222] pt-2">
                      <span className="text-neutral-300 font-medium">
                        Autofinancement total
                      </span>
                      <span className="text-emerald-400 font-bold">
                        {impact.details.capital.selfFinancingTotal.toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">
                      Baisser l&apos;impôt capital augmente aussi les recettes
                      travail (les entreprises investissent → embauchent).
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Context: impact relative to deficit */}
          <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
              <div className="flex-1">
                <span className="text-neutral-400">
                  Perte nette de cette réforme :{" "}
                </span>
                <span className="text-white font-semibold">
                  {impact.totalNetLoss.toFixed(1)} Md€
                </span>
                <span className="text-neutral-500">
                  {" "}
                  soit{" "}
                  {(
                    (impact.totalNetLoss / Math.abs(macroData.deficit)) *
                    100
                  ).toFixed(0)}
                  % du déficit actuel ({Math.abs(macroData.deficit)} Md€)
                </span>
              </div>
              <div className="text-xs text-neutral-500">
                C&apos;est le coût statique. L&apos;effet dynamique sur 10 ans peut
                l&apos;inverser →
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-[#141414] border border-[#222] rounded-xl p-12 text-center">
          <p className="text-neutral-500 text-lg">
            Ajustez les sliders pour simuler une baisse d&apos;impôt
          </p>
          <p className="text-neutral-600 text-sm mt-2">
            L&apos;impact sera calculé en temps réel avec les taux
            d&apos;autofinancement de la littérature académique
          </p>
        </div>
      )}
    </div>
  );
}
