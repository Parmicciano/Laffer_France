"use client";

import {
  type ModelSettings,
  CONSERVATIVE_PRESET,
  CENTRAL_PRESET,
  OPTIMISTIC_PRESET,
  OPTIMISTIC_COORDINATED_PRESET,
  getProfileLabel,
  getProfileColor,
  countOptimisticParams,
} from "@/types/modelSettings";

interface SettingsPanelProps {
  settings: ModelSettings;
  onChange: (settings: ModelSettings) => void;
}

export default function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const profile = getProfileLabel(settings);
  const profileColor = getProfileColor(profile);
  const { optimistic, total } = countOptimisticParams(settings);

  const presets: { label: string; preset: ModelSettings; color: string; tag: string }[] = [
    { label: "Conservateur", preset: CONSERVATIVE_PRESET, color: "#10b981", tag: "🟢" },
    { label: "Central", preset: CENTRAL_PRESET, color: "#f59e0b", tag: "🟡" },
    { label: "Optimiste", preset: OPTIMISTIC_PRESET, color: "#ef4444", tag: "🔴" },
    { label: "Optimiste + coordination", preset: OPTIMISTIC_COORDINATED_PRESET, color: "#8b5cf6", tag: "🟣" },
  ];

  return (
    <details className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
      <summary className="px-5 py-3 cursor-pointer hover:bg-slate-50 rounded-xl flex items-center justify-between list-none">
        <div className="flex items-center gap-3">
          <span className="text-lg">{"⚙️"}</span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">
              {"Hypothèses du modèle"}
            </span>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: `${profileColor}15`,
                color: profileColor,
                border: `1px solid ${profileColor}30`,
              }}
            >
              {profile}
            </span>
          </div>
        </div>
        <span className="text-slate-400 text-xs">{"Cliquez pour déplier"}</span>
      </summary>

      <div className="px-5 pb-5 pt-3 space-y-6 border-t border-slate-100">
        {/* === Presets === */}
        <div className="flex flex-wrap gap-2 items-center">
          {presets.map((p) => {
            const active = profile === p.label;
            return (
              <button
                key={p.label}
                onClick={() => onChange(p.preset)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium border transition-all ${
                  active
                    ? ""
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
                style={
                  active
                    ? {
                        backgroundColor: `${p.color}10`,
                        borderColor: `${p.color}40`,
                        color: p.color,
                      }
                    : {}
                }
              >
                {p.tag} {p.label}
              </button>
            );
          })}
          <button
            onClick={() => onChange(CONSERVATIVE_PRESET)}
            className="ml-auto rounded-full px-3 py-1.5 text-[10px] text-slate-400 border border-slate-200 hover:border-slate-300"
          >
            {"Réinitialiser aux défauts conservateurs"}
          </button>
        </div>

        {/* === 1. Modèle d'autofinancement === */}
        <SettingGroup title="Modèle d'autofinancement comportemental">
          <RadioOption
            name="sfModel"
            value="eti"
            checked={settings.selfFinancingModel === "eti"}
            onChange={() =>
              onChange({ ...settings, selfFinancingModel: "eti" })
            }
            label="Équilibre partiel (ETI)"
            description="Statistique suffisante dérivée de l'élasticité. Conservateur."
            formula="autofinancement = ε / (1 + ε)"
            detail="Travail : 25.9% | Capital : 33.3% (ε=0.50) | Cotisations : 28.6%"
            source="Saez, Slemrod & Giertz (2012), formule standard ETI"
            tag="🟢 Conservateur"
          />
          <RadioOption
            name="sfModel"
            value="trabandt_uhlig"
            checked={settings.selfFinancingModel === "trabandt_uhlig"}
            onChange={() =>
              onChange({ ...settings, selfFinancingModel: "trabandt_uhlig" })
            }
            label="Équilibre général (Trabandt & Uhlig)"
            description="Modèle néoclassique avec accumulation de capital. Plus optimiste."
            detail="Travail : 54% | Capital : 79% | Cotisations : 60%"
            source="Trabandt & Uhlig (2011), J. Monetary Economics, EU-14"
            tag="🔴 Optimiste"
            warning="Ces taux incluent les effets d'équilibre général (accumulation de capital, offre de travail). Ils sont plus élevés que les estimations en équilibre partiel."
          />
        </SettingGroup>

        {/* === 2. Élasticité capital === */}
        <SettingGroup title="Élasticité et taux de Laffer — Capital">
          <RadioOption
            name="capitalModel"
            value="direct"
            checked={settings.capitalElasticityModel === "direct"}
            onChange={() =>
              onChange({ ...settings, capitalElasticityModel: "direct" })
            }
            label="Lefebvre et al. — résultat principal"
            description="ε_direct = 0.50 | Cross-élasticité capital→travail = 0.05 | τ* ≈ 43%"
            detail="Inclut la cross-élasticité sur le revenu du travail."
            source="Calibration inspirée de Lefebvre, Lehmann & Sicsic (2025), Scand. J. Econ. 127(2), 460-489"
            tag="🟢 Conservateur"
          />
          <RadioOption
            name="capitalModel"
            value="noCross"
            checked={settings.capitalElasticityModel === "noCross"}
            onChange={() =>
              onChange({ ...settings, capitalElasticityModel: "noCross" })
            }
            label="Lefebvre et al. — sans cross-élasticité"
            description="ε_composite = 0.75 | Cross-élasticité = 0 | τ* = 57%"
            detail="Élasticité directe seule, sans effet sur le revenu du travail."
            source="Calibration inspirée de Lefebvre, Lehmann & Sicsic (2025)"
            tag="🟡 Central"
          />
          <RadioOption
            name="capitalModel"
            value="withPayroll"
            checked={settings.capitalElasticityModel === "withPayroll"}
            onChange={() =>
              onChange({ ...settings, capitalElasticityModel: "withPayroll" })
            }
            label="Lefebvre et al. — avec cotisations sociales"
            description="ε_composite = 1.86 | Cross-élasticité = 0 | τ* = 35%"
            detail="Estimation la plus complète, incluant l'impact sur les cotisations sociales."
            source="Calibration inspirée de Lefebvre, Lehmann & Sicsic (2025)"
            tag="🔴 Fourchette basse"
          />
        </SettingGroup>

        {/* === 3. Modèle supply-side === */}
        <SettingGroup title="Effet de la fiscalité sur la croissance">
          <RadioOption
            name="ssModel"
            value="level"
            checked={settings.supplySideModel === "level"}
            onChange={() =>
              onChange({ ...settings, supplySideModel: "level" })
            }
            label="Effet de niveau (Solow)"
            description="La fiscalité affecte le niveau de PIB, pas le taux de croissance permanent. Le PIB converge vers un nouveau steady-state plus haut en ~15 ans."
            source="Modèle standard néoclassique. Consensus académique majoritaire."
            tag="🟢 Conservateur"
          />
          <RadioOption
            name="ssModel"
            value="hybrid"
            checked={settings.supplySideModel === "hybrid"}
            onChange={() =>
              onChange({ ...settings, supplySideModel: "hybrid" })
            }
            label="Hybride (50% permanent, 50% niveau)"
            description="Une partie de l'effet est permanent (R&D, capital humain), le reste converge en 15 ans."
            tag="🟡 Central"
          />
          <RadioOption
            name="ssModel"
            value="permanent"
            checked={settings.supplySideModel === "permanent"}
            onChange={() =>
              onChange({ ...settings, supplySideModel: "permanent" })
            }
            label="Effet permanent (Romer-Lucas)"
            description="La fiscalité affecte l'investissement en R&D/capital humain et donc le taux de croissance permanent. Plus optimiste."
            source="Modèle de croissance endogène."
            tag="🔴 Optimiste"
          />
        </SettingGroup>

        {/* === 4. Okun === */}
        <SettingGroup title="Élasticité emploi/PIB (Okun)">
          <div className="px-1">
            <input
              type="range"
              min="0.25"
              max="0.50"
              step="0.05"
              value={settings.okunCoefficient}
              onChange={(e) =>
                onChange({
                  ...settings,
                  okunCoefficient: Number(e.target.value),
                })
              }
              className="w-full"
              aria-label={`Coefficient d'Okun : ${settings.okunCoefficient.toFixed(2)}`}
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>{"0.25 — Très rigide"}</span>
              <span className="font-semibold text-slate-600 text-xs">
                {settings.okunCoefficient.toFixed(2)}
              </span>
              <span>{"0.50 — Anglo-saxon"}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {"Recommandé France : 0.30"}
            </div>
          </div>
        </SettingGroup>

        {/* === 5. Phase-in === */}
        <SettingGroup title="Délais de montée en puissance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-1">
            <div>
              <div className="text-xs text-slate-600 mb-1">
                {"Phase-in comportemental : "}
                <span className="font-semibold">
                  {settings.behavioralPhaseInYears} ans
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="10"
                step="1"
                value={settings.behavioralPhaseInYears}
                onChange={(e) =>
                  onChange({
                    ...settings,
                    behavioralPhaseInYears: Number(e.target.value),
                  })
                }
                className="w-full"
                aria-label={`Phase-in comportemental : ${settings.behavioralPhaseInYears} ans`}
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>4 ans (rapide)</span>
                <span>10 ans (lent)</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-600 mb-1">
                {"Phase-in supply-side : "}
                <span className="font-semibold">
                  {settings.supplySidePhaseInYears} ans
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="15"
                step="1"
                value={settings.supplySidePhaseInYears}
                onChange={(e) =>
                  onChange({
                    ...settings,
                    supplySidePhaseInYears: Number(e.target.value),
                  })
                }
                className="w-full"
                aria-label={`Phase-in supply-side : ${settings.supplySidePhaseInYears} ans`}
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>4 ans (rapide)</span>
                <span>15 ans (lent)</span>
              </div>
            </div>
          </div>
        </SettingGroup>

        {/* === 6. Canaux rapides === */}
        <SettingGroup title="Canaux rapides (marge extensive + formalisation + signal)">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:border-slate-300">
            <input
              type="checkbox"
              checked={settings.fastChannelsEnabled}
              onChange={(e) => onChange({ ...settings, fastChannelsEnabled: e.target.checked })}
              className="accent-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-slate-700">{"Inclure les effets rapides"}</span>
              <div className="text-[10px] text-slate-400">
                {"Formalisation (Slemrod 2001), marge extensive (PFU 2017), signal (IDE, spread). Désactiver pour comparer avec le modèle à 2 canaux."}
              </div>
            </div>
          </label>

          {settings.fastChannelsEnabled && (
            <div className="space-y-4 pt-2 px-1">
              {/* Formalisation */}
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>{"Part formalisation dans l'ETI"}</span>
                  <span className="font-semibold">{Math.round(settings.formalisationShare * 100)}%</span>
                </div>
                <input type="range" min="0.30" max="0.70" step="0.05"
                  value={settings.formalisationShare}
                  onChange={(e) => onChange({ ...settings, formalisationShare: Number(e.target.value) })}
                  className="w-full"
                  aria-label={`Part formalisation dans l'ETI : ${Math.round(settings.formalisationShare * 100)}%`} />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>{"30% (conservateur)"}</span>
                  <span>{"70% (Chetty 2009)"}</span>
                </div>
                <div className="text-[10px] text-slate-400 italic mt-0.5">
                  {"[Solide/Inférence] Slemrod (2001), Chetty (2009) : 50-75% de l'ETI est optimisation/shifting"}
                </div>
              </div>

              {/* Base widening */}
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>{"Élargissement base capital"}</span>
                  <span className="font-semibold">+{(settings.capitalBaseWidening * 100).toFixed(1)}%</span>
                </div>
                <input type="range" min="0.005" max="0.07" step="0.005"
                  value={settings.capitalBaseWidening}
                  onChange={(e) => onChange({ ...settings, capitalBaseWidening: Number(e.target.value) })}
                  className="w-full"
                  aria-label={`Élargissement base capital : +${(settings.capitalBaseWidening * 100).toFixed(1)}%`} />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>{"+0.5% (minimal)"}</span>
                  <span>{"+7% (très généreux)"}</span>
                </div>
                <div className="text-[10px] text-slate-400 italic mt-0.5">
                  {"[Inférence] Calibré PFU 2017 : coût initial 1.9 Md€, réel ~0.9 Md€ → ~1 Md€ récupéré sur 120 Md€ = +0.8%. Défaut +2.5% inclut effets indirects."}
                </div>
              </div>

              {/* Crédibilité */}
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>{"Multiplicateur de crédibilité"}</span>
                  <span className="font-semibold">{settings.credibilityMultiplier.toFixed(1)}×</span>
                </div>
                <input type="range" min="1.0" max="2.0" step="0.1"
                  value={settings.credibilityMultiplier}
                  onChange={(e) => onChange({ ...settings, credibilityMultiplier: Number(e.target.value) })}
                  className="w-full"
                  aria-label={`Multiplicateur de crédibilité : ${settings.credibilityMultiplier.toFixed(1)}×`} />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>{"1.0× (réforme seule)"}</span>
                  <span>{"2.0× (package complet)"}</span>
                </div>
                <div className="text-[10px] text-slate-400 italic mt-0.5">
                  {"[Spéculation] Amplifie l'effet signal (IDE, spread). Ex: 1.3× = Choose France, 1.5× = coordination industrielle"}
                </div>
              </div>
            </div>
          )}
        </SettingGroup>

        {/* === Transparence === */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          <div className="font-semibold mb-1">
            {"⚠️ Transparence méthodologique"}
          </div>
          <div>
            {"Profil d'hypothèses : "}
            <strong style={{ color: profileColor }}>{profile}</strong>
          </div>
          <div>
            {optimistic} {"paramètre"}{optimistic > 1 ? "s" : ""} sur {total}{" "}
            {"favorise"}{optimistic > 1 ? "nt" : ""} {"l'autofinancement"}
          </div>
          <div className="text-amber-600 mt-1">
            {"L'incertitude augmente significativement au-delà de 5 ans"}
          </div>
        </div>
      </div>
    </details>
  );
}

// ============================================================
// Sub-components
// ============================================================

function SettingGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-sm font-semibold text-slate-700 mb-2">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function RadioOption({
  name,
  value,
  checked,
  onChange,
  label,
  description,
  formula,
  detail,
  source,
  tag,
  warning,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  description: string;
  formula?: string;
  detail?: string;
  source?: string;
  tag?: string;
  warning?: string;
}) {
  return (
    <label
      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
        checked
          ? "border-blue-300 bg-blue-50/50"
          : "border-slate-200 hover:border-slate-300 bg-white"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mt-1 accent-blue-500"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          {tag && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
              {tag}
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 mt-0.5">{description}</div>
        {formula && (
          <div className="text-[10px] text-slate-400 mt-1 font-mono bg-slate-50 px-2 py-0.5 rounded inline-block">
            {formula}
          </div>
        )}
        {detail && (
          <div className="text-[10px] text-slate-500 mt-1">{detail}</div>
        )}
        {source && (
          <div className="text-[10px] text-slate-400 mt-1 italic">
            {source}
          </div>
        )}
        {warning && (
          <div className="text-[10px] text-amber-600 mt-1 bg-amber-50 px-2 py-1 rounded">
            {"⚠️ "}{warning}
          </div>
        )}
      </div>
    </label>
  );
}
