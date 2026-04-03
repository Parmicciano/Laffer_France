"use client";

import { taxTypes, type TaxTypeKey } from "@/data/economicData";

interface TaxTypeSelectorProps {
  selected: TaxTypeKey;
  onChange: (key: TaxTypeKey) => void;
}

const taxTypeKeys: TaxTypeKey[] = [
  "travail",
  "capital",
  "cotisationsPatronales",
  "tva",
];

export default function TaxTypeSelector({
  selected,
  onChange,
}: TaxTypeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {taxTypeKeys.map((key) => {
        const t = taxTypes[key];
        const isActive = key === selected;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${
                isActive
                  ? "text-white shadow-lg"
                  : "bg-[#1a1a1a] text-neutral-400 hover:text-neutral-200 hover:bg-[#222] border border-[#2a2a2a]"
              }
            `}
            style={
              isActive
                ? {
                    backgroundColor: `${t.color}20`,
                    border: `1px solid ${t.color}60`,
                    color: t.color,
                    boxShadow: `0 0 20px ${t.color}15`,
                  }
                : undefined
            }
          >
            {t.shortLabel}
            <span className="ml-2 text-xs opacity-60">
              {t.recettes} Md€
            </span>
          </button>
        );
      })}
    </div>
  );
}
