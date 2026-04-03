"use client";

import { historicalEvents, type HistoricalEvent } from "@/data/economicData";

function VerdictBadge({ event }: { event: HistoricalEvent }) {
  const colors = {
    laffer_confirme:
      event.type === "hausse"
        ? "bg-red-500/10 text-red-400 border-red-500/20"
        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    laffer_infirme: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    neutre: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
        colors[event.verdict]
      }`}
    >
      {event.verdictLabel}
    </span>
  );
}

function TimelineEvent({ event, isLast }: { event: HistoricalEvent; isLast: boolean }) {
  const isHausse = event.type === "hausse";
  const dotColor = isHausse ? "bg-red-500" : "bg-emerald-500";
  const borderColor = isHausse
    ? "border-red-500/20 hover:border-red-500/40"
    : "border-emerald-500/20 hover:border-emerald-500/40";
  const typeLabel = isHausse ? "HAUSSE" : "BAISSE";
  const typeLabelColor = isHausse ? "text-red-400" : "text-emerald-400";

  return (
    <div className="relative flex gap-6">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div
          className={`w-4 h-4 rounded-full ${dotColor} border-2 border-[#0a0a0a] z-10 mt-1.5 shrink-0`}
          style={{
            boxShadow: `0 0 8px ${isHausse ? "#ef444460" : "#10b98160"}`,
          }}
        />
        {!isLast && (
          <div className="w-0.5 flex-1 bg-[#222] min-h-[20px]" />
        )}
      </div>

      {/* Content */}
      <div
        className={`flex-1 bg-[#141414] border ${borderColor} rounded-xl p-5 mb-4 transition-colors`}
      >
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className="text-2xl font-bold text-white">{event.year}</span>
          <span
            className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded ${
              isHausse ? "bg-red-500/10" : "bg-emerald-500/10"
            } ${typeLabelColor}`}
          >
            {typeLabel}
          </span>
          <VerdictBadge event={event} />
        </div>

        <h4 className="text-white font-semibold mb-1">{event.title}</h4>
        <p className="text-neutral-400 text-sm mb-3">{event.description}</p>

        <div className="bg-[#0e0e0e] rounded-lg p-3 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-amber-400 text-xs font-semibold mt-0.5 shrink-0">
              IMPACT
            </span>
            <span className="text-neutral-300 text-sm">{event.impact}</span>
          </div>

          {event.recettesAvant && (
            <div className="flex items-start gap-2">
              <span className="text-neutral-600 text-xs font-semibold mt-0.5 shrink-0">
                AVANT
              </span>
              <span className="text-neutral-400 text-sm">
                {event.recettesAvant}
              </span>
            </div>
          )}

          {event.recettesApres && (
            <div className="flex items-start gap-2">
              <span className="text-neutral-600 text-xs font-semibold mt-0.5 shrink-0">
                APRES
              </span>
              <span className="text-neutral-400 text-sm">
                {event.recettesApres}
              </span>
            </div>
          )}
        </div>

        <p className="text-neutral-500 text-xs mt-3 leading-relaxed">
          {event.details}
        </p>
      </div>
    </div>
  );
}

export default function HistoricalTimeline() {
  return (
    <div className="space-y-6">
      <div className="bg-[#141414] border border-[#222] rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">
          L&apos;histoire fiscale confirme Laffer
        </h3>
        <p className="text-sm text-neutral-400 leading-relaxed">
          Depuis 40 ans, la France a expérimenté involontairement la courbe de
          Laffer à travers des hausses et baisses d&apos;impôt sur le capital et les
          hauts revenus. Le résultat est sans appel :{" "}
          <span className="text-amber-400 font-medium">
            chaque hausse au-delà du sommet a réduit les recettes
          </span>
          , chaque baisse les a restaurées. Ce ne sont pas des théories — ce
          sont des données.
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4 mb-2">
        <div className="bg-[#141414] border border-red-500/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-400">4</div>
          <div className="text-xs text-neutral-500 mt-1">
            Hausses qui ont réduit les recettes
          </div>
        </div>
        <div className="bg-[#141414] border border-emerald-500/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">2</div>
          <div className="text-xs text-neutral-500 mt-1">
            Baisses qui ont restauré les recettes
          </div>
        </div>
        <div className="bg-[#141414] border border-amber-500/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">~19 000</div>
          <div className="text-xs text-neutral-500 mt-1">
            Foyers exilés par l&apos;ISF (1988-2017)
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="pl-2">
        {historicalEvents.map((event, idx) => (
          <TimelineEvent
            key={event.year}
            event={event}
            isLast={idx === historicalEvents.length - 1}
          />
        ))}
      </div>

      {/* Conclusion */}
      <div className="bg-gradient-to-r from-amber-500/5 to-transparent border border-amber-500/20 rounded-xl p-6">
        <h4 className="text-amber-400 font-semibold mb-2">
          Le pattern est clair
        </h4>
        <p className="text-neutral-300 text-sm leading-relaxed">
          Sur le capital et les hauts revenus, la France oscille entre hausse
          (qui fait fuir les bases taxables) et baisse (qui les fait revenir).
          L&apos;instabilité fiscale est elle-même un coût : chaque changement de
          règle pousse les contribuables mobiles à anticiper la prochaine hausse
          et à structurer leur patrimoine en conséquence. La solution n&apos;est pas
          de baisser puis remonter — c&apos;est de{" "}
          <span className="text-white font-medium">
            stabiliser à un taux optimal et s&apos;y tenir
          </span>
          .
        </p>
      </div>
    </div>
  );
}
