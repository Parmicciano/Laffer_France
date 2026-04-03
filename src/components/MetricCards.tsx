"use client";

import { macroData } from "@/data/economicData";

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  comparison?: string;
  comparisonColor?: string;
  icon: React.ReactNode;
}

function MetricCard({
  label,
  value,
  subValue,
  comparison,
  comparisonColor = "text-neutral-400",
  icon,
}: MetricCardProps) {
  return (
    <div className="metric-card bg-[#141414] border border-[#222] rounded-xl p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-neutral-400 text-sm font-medium">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subValue && (
        <div className="text-sm text-neutral-500">{subValue}</div>
      )}
      {comparison && (
        <div className={`text-xs font-medium ${comparisonColor}`}>
          {comparison}
        </div>
      )}
    </div>
  );
}

export default function MetricCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <MetricCard
        label="Tax / PIB"
        value={`${macroData.taxToGdp}%`}
        subValue="2ème OCDE"
        comparison={`Moy. OCDE : ${macroData.taxToGdpOcde}% (${(macroData.taxToGdp - macroData.taxToGdpOcde).toFixed(1)}pp au-dessus)`}
        comparisonColor="text-red-400"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        }
      />
      <MetricCard
        label="Prélèvements"
        value={`${macroData.prelevementsObligatoires} Md€`}
        subValue={`${macroData.taxToGdp}% du PIB`}
        comparison={`PIB : ${macroData.pib.toLocaleString("fr-FR")} Md€`}
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <MetricCard
        label="Déficit"
        value={`${macroData.deficit} Md€`}
        subValue={`${macroData.deficitPct}% du PIB`}
        comparison="Plafond Maastricht : 3%"
        comparisonColor="text-red-400"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        }
      />
      <MetricCard
        label="Dette publique"
        value={`${macroData.dette.toLocaleString("fr-FR")} Md€`}
        subValue={`${macroData.dettePct}% du PIB`}
        comparison={`Charge : ~${macroData.chargeDette} Md€/an`}
        comparisonColor="text-amber-400"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        }
      />
      <MetricCard
        label="Compétitivité fiscale"
        value={`${macroData.classementCompetitivite}/${macroData.totalOcde}`}
        subValue="Tax Competitiveness Index"
        comparison="Dernier de l'OCDE"
        comparisonColor="text-red-400"
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
          </svg>
        }
      />
    </div>
  );
}
