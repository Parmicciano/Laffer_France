"use client";

import { sources } from "@/data/economicData";

export default function SourcesFooter() {
  return (
    <footer className="border-t border-slate-200 mt-8 pt-8 pb-12 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4">
        <h4 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">
          Sources académiques
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1.5">
          {sources.map((s, idx) => (
            <p key={idx} className="text-xs text-slate-400 leading-relaxed">
              {s.authors} ({s.year}).{" "}
              <span className="italic text-slate-500">
                &ldquo;{s.title}&rdquo;
              </span>
              {s.journal && <span>. {s.journal}</span>}.
            </p>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-400">
            Simulateur Laffer France — Modèle : R(τ) = τ × B₀ × (1-τ)^ε — Données : INSEE, OCDE 2024
          </p>
        </div>
      </div>
    </footer>
  );
}
