"use client";

export default function Methodologie() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <a href="/" className="text-sm text-blue-600 hover:underline mb-6 inline-block">{"← Retour au simulateur"}</a>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">{"Méthodologie complète"}</h1>
        <p className="text-sm text-slate-500 mb-10">{"Toutes les formules, sources et hypothèses du simulateur Laffer France."}</p>

        {/* ============================================================ */}
        <Section title="1. Courbe de Laffer — Formule de base">
          <Formula>{"R(τ) = τ × B₀ × (1 − τ)^ε"}</Formula>
          <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
            <li>{"R(τ) = recettes fiscales au taux τ"}</li>
            <li>{"B₀ = base taxable initiale"}</li>
            <li>{"ε = élasticité du revenu taxable (ETI)"}</li>
            <li>{"τ* = taux optimal = 1 / (1 + ε)"}</li>
          </ul>
          <Source>{"Saez, Slemrod & Giertz (2012), Journal of Economic Literature 50(1), pp. 3-50"}</Source>
        </Section>

        {/* ============================================================ */}
        <Section title="2. Élasticités utilisées">
          <table className="w-full text-sm border-collapse mt-2">
            <thead>
              <tr className="text-left border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">{"Impôt"}</th>
                <th className="py-2 pr-4">{"ε"}</th>
                <th className="py-2 pr-4">{"τ*"}</th>
                <th className="py-2 pr-4">{"Taux actuel"}</th>
                <th className="py-2">{"Source"}</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              <tr className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium">{"Travail"}</td>
                <td className="py-2 pr-4 font-mono">0.35</td>
                <td className="py-2 pr-4 font-mono">74%</td>
                <td className="py-2 pr-4 font-mono">65%</td>
                <td className="py-2 text-xs text-slate-500">{"Saez et al. (2012), ETI médiane"}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium">{"Capital (direct)"}</td>
                <td className="py-2 pr-4 font-mono">0.50</td>
                <td className="py-2 pr-4 font-mono">43%</td>
                <td className="py-2 pr-4 font-mono">55%</td>
                <td className="py-2 text-xs text-slate-500">{"Lefebvre, Lehmann & Sicsic (2025), Scand. J. Econ."}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium">{"Capital (sans cross)"}</td>
                <td className="py-2 pr-4 font-mono">0.75</td>
                <td className="py-2 pr-4 font-mono">57%</td>
                <td className="py-2 pr-4 font-mono">55%</td>
                <td className="py-2 text-xs text-slate-500">{"Lefebvre et al. (2025), sans cross-élasticité"}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium">{"Capital (avec cotis.)"}</td>
                <td className="py-2 pr-4 font-mono">1.86</td>
                <td className="py-2 pr-4 font-mono">35%</td>
                <td className="py-2 pr-4 font-mono">55%</td>
                <td className="py-2 text-xs text-slate-500">{"Lefebvre et al. (2025), périmètre complet"}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium">{"Cotisations"}</td>
                <td className="py-2 pr-4 font-mono">0.40</td>
                <td className="py-2 pr-4 font-mono">71%</td>
                <td className="py-2 pr-4 font-mono">45%</td>
                <td className="py-2 text-xs text-slate-500">{"Crépon & Desplatz (2001), allègements Juppé"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium">{"TVA"}</td>
                <td className="py-2 pr-4 font-mono">0.15</td>
                <td className="py-2 pr-4 font-mono">87%</td>
                <td className="py-2 pr-4 font-mono">20%</td>
                <td className="py-2 text-xs text-slate-500">{"Estimation consensus"}</td>
              </tr>
            </tbody>
          </table>
          <Note>{"L'élasticité décroît pour les coupes larges : ε_effectif = ε × max(0.3, 1 − 0.5 × |coupe%| / 100). Justification : à taux très bas, moins d'optimisation à récupérer."}</Note>
        </Section>

        {/* ============================================================ */}
        <Section title="3. Autofinancement — Deux modèles">
          <h4 className="font-semibold text-slate-800 mt-3 mb-1">{"A. Équilibre partiel (ETI)"}</h4>
          <Formula>{"Autofinancement = ε / (1 + ε)"}</Formula>
          <p className="text-sm text-slate-600">{"Formule standard de statistique suffisante. Ex: ε=0.35 → 25.9%."}</p>
          <Source>{"Saez, Slemrod & Giertz (2012)"}</Source>

          <h4 className="font-semibold text-slate-800 mt-4 mb-1">{"B. Équilibre général (Trabandt & Uhlig)"}</h4>
          <p className="text-sm text-slate-600">{"Modèle néoclassique calibré sur l'EU-14 : Travail 54%, Capital 79%, Cotisations 60%."}</p>
          <Source>{"Trabandt & Uhlig (2011), Journal of Monetary Economics 58(4)"}</Source>
        </Section>

        {/* ============================================================ */}
        <Section title="4. Les 5 canaux de récupération">
          <Channel num={1} name="Réponse réelle (lent)" confidence="Solide" color="#10b981">
            <Formula>{"Canal1(y) = Σ [coupe_i × SFR_i × (1 − formalisationShare)] × phaseIn(y)"}</Formula>
            <p>{"où phaseIn(y) = min(1, y / behavioralPhaseInYears)"}</p>
            <p>{"Phase-in linéaire sur 4-10 ans. C'est la réponse comportementale réelle (offre de travail, investissement)."}</p>
          </Channel>

          <Channel num={2} name="Supply-side (croissance induite)" confidence="Inférence" color="#8b5cf6">
            <Formula>{"Canal2(y) = ΔPIB(y) × tauxPO"}</Formula>
            <p>{"où ΔPIB vient du boost de croissance :"}</p>
            <Formula>{"refPIB(y) = refPIB(y−1) × (1 + g_base + g_boost × phaseIn × decay)"}</Formula>
            <p>{"g_boost = Σ [coupe_i / PIB × boostParType_i] (plafonné à ±2 pp/an)"}</p>
            <p>{"boostParType : travail 0.10, capital 0.30, cotisations 0.15 pp par point de PIB"}</p>
            <p>{"decay selon le modèle : niveau = max(0, 1−(y−1)/15), permanent = 1, hybride = 0.5 + 0.5×niveau"}</p>
            <p>{"tauxPO = 42.8% (INSEE)"}</p>
            <Source>{"OCDE (2010), Arnold et al. (2008). Ranking robuste, magnitudes extrapolées."}</Source>
          </Channel>

          <Channel num={3} name="Marge extensive" confidence="Inférence" color="#0ea5e9">
            <p className="font-medium mt-1">{"3a. Retour d'exilés fiscaux (capital seulement, seuil ≥5%)"}</p>
            <Formula>{"exileReturn(y) = pool × speed × (1 − speed)^(y−1) × tauxCapital"}</Formula>
            <p>{"pool = 6 Md€ de VA récupérable (Rexecode), speed = 30%/an"}</p>

            <p className="font-medium mt-3">{"3b. Élargissement de base (capital seulement)"}</p>
            <Formula>{"baseWidening(y) = param × 120Md€ × (coupe/15%) × sCurve(y/3) × (1 − coupe%/100)"}</Formula>
            <p>{"param = 2.5% par défaut. Calibré PFU 2017 : 1 Md€ récupéré sur 120 Md€. sCurve = tanh normalisé."}</p>

            <p className="font-medium mt-3">{"3c. Création d'entreprises (lag 2 ans)"}</p>
            <Formula>{"bizCreation(y) = 1M × coupeMoyenne% × 0.5 × (y−2) × 15k€/1M"}</Formula>
            <p>{"1M créations/an base, élasticité 0.5, 15k€ recettes/entreprise/an."}</p>
          </Channel>

          <Channel num={4} name="Signal & anticipations" confidence="Spéculation" color="#6366f1">
            <Formula>{"Canal4(y) = (spreadSaving + ideRevenue) × crédibilité"}</Formula>
            <p className="font-medium mt-1">{"4a. Compression spread OAT"}</p>
            <Formula>{"spreadSaving = totalCoupe × 30% × 0.5 bps × 0.33 Md€/10bps"}</Formula>

            <p className="font-medium mt-2">{"4b. IDE additionnel"}</p>
            <Formula>{"ideRevenue = 40Md€ × min(15, coupe_capital × 0.8) × 3%/rang × 20% × phaseIn(y/2)"}</Formula>
            <p>{"crédibilité = 1.0× (réforme seule) à 2.0× (coordination industrielle)"}</p>
            <Note>{"Ce canal n'est PAS scalé par pessimiste/optimiste (effet binaire : la réforme est annoncée ou non)."}</Note>
          </Channel>

          <Channel num={5} name="Formalisation (rapide)" confidence="Solide/Inférence" color="#059669">
            <Formula>{"Canal5(y) = Σ [coupe_i × SFR_i × formalisationShare] × phaseIn_rapide(y)"}</Formula>
            <p>{"phaseIn_rapide(y) = min(1, 0.80 + 0.20 × (y−1)) → 80% en an 1, 100% en an 2"}</p>
            <p>{"formalisationShare = 30-70% (défaut 50%). Part de l'ETI qui est de l'optimisation/shifting, pas de la réponse réelle."}</p>
            <Source>{"Slemrod (2001), Chetty (2009) : 50-75% de l'ETI observé est optimisation/shifting."}</Source>
          </Channel>
        </Section>

        {/* ============================================================ */}
        <Section title="5. Emploi — Loi d'Okun">
          <Formula>{"emplois = emploiTotal × (ΔPIB/PIB × okunCoeff)"}</Formula>
          <p className="text-sm text-slate-600">
            {"emploiTotal = 30.5M (INSEE 2024). okunCoeff = 0.25 (rigide) à 0.50 (flexible), défaut 0.30 pour la France."}
          </p>
          <p className="text-sm text-slate-600">
            {"Pour les cotisations patronales : base = 20M salariés privés (pas l'emploi total)."}
          </p>
        </Section>

        {/* ============================================================ */}
        <Section title="6. Dette publique">
          <Formula>{"dépenses(y) = dépOpérationnelles₀ × (1 + inflation)^y + dette(y) × tauxIntérêt"}</Formula>
          <Formula>{"déficit(y) = recettes(y) − dépenses(y)"}</Formula>
          <Formula>{"dette(y) = dette(y−1) − déficit(y)"}</Formula>
          <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 mt-2">
            <li>{"dépOpérationnelles₀ = 1615.2 Md€ (total 1670.2 − charge dette 55)"}</li>
            <li>{"inflation = 2%/an"}</li>
            <li>{"tauxIntérêt base = 2.5%"}</li>
            <li>{"Malus soutenabilité : +50 bps par tranche de 10% dette/PIB au-delà de 120%"}</li>
            <li>{"Bonus spread si la réforme améliore le déficit : −10 bps/an (max 5 ans)"}</li>
          </ul>
          <Note>{"Les intérêts sont séparés des dépenses opérationnelles pour éviter le double-comptage. La charge initiale de 55 Md€ est remplacée par le calcul dynamique dette × taux."}</Note>

          <h4 className="font-semibold text-slate-800 mt-4 mb-1">{"Dette supplémentaire vs statu quo"}</h4>
          <Formula>{"detteSupplémentaire(y) = dette_réforme(y) − dette_statuQuo(y)"}</Formula>
          <p className="text-sm text-slate-600">{"C'est la différence des stocks de dette. Si positif, la réforme a généré plus de dette. Si négatif, elle a réduit la dette."}</p>
        </Section>

        {/* ============================================================ */}
        <Section title="7. Pouvoir d'achat">
          <Formula>{"PA_total = PA_direct + PA_emploi + PA_croissance"}</Formula>

          <h4 className="font-semibold text-slate-800 mt-3 mb-1">{"Direct"}</h4>
          <Formula>{"PA_direct = coupeRevail × phaseIn + coupeCotis × phaseIn × passthrough(y) + coupeCapital × phaseIn × 10%"}</Formula>
          <p className="text-sm text-slate-600">{"passthrough cotisations = lerp(40%, 70%, min(1, y/5)). Source : Crépon & Desplatz (2001)."}</p>

          <h4 className="font-semibold text-slate-800 mt-3 mb-1">{"Emploi"}</h4>
          <Formula>{"PA_emploi = emploisCréés × 30 000€/an / 1Md€"}</Formula>

          <h4 className="font-semibold text-slate-800 mt-3 mb-1">{"Croissance"}</h4>
          <Formula>{"PA_croissance = max(0, ΔPIB) × 50% × 0.70"}</Formula>
          <p className="text-sm text-slate-600">{"50% = part salariale du PIB. 0.70 = élasticité salaires/PIB (Verdugo 2016)."}</p>

          <h4 className="font-semibold text-slate-800 mt-3 mb-1">{"Par habitant"}</h4>
          <Formula>{"€/mois/habitant = PA_total × 1Md€ / 68M habitants / 12 mois"}</Formula>
          <Note>{"Moyenne nationale. Les gains varient fortement selon le revenu : la baisse de cotisations bénéficie plus aux salariés, la baisse de capital plus aux patrimoines."}</Note>
        </Section>

        {/* ============================================================ */}
        <Section title="8. Mode trajectoire">
          <h4 className="font-semibold text-slate-800 mt-2 mb-1">{"Progressif"}</h4>
          <Formula>{"coupe(y) = coupeCible × min(1, y / rampYears)"}</Formula>

          <h4 className="font-semibold text-slate-800 mt-3 mb-1">{"Choc + rollback"}</h4>
          <Formula>{"coupe(y) = max(coupeCible, coupeChoc − rollback × (y − 1))"}</Formula>
          <p className="text-sm text-slate-600">{"Le choc initial est plus fort que la cible, puis se réduit de rollback%/an jusqu'à la cible."}</p>
        </Section>

        {/* ============================================================ */}
        <Section title="9. Garde-fous">
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
            <li><strong>{"Élasticités décroissantes"}</strong>{" : ε_eff = ε × max(0.3, 1 − 0.5 × |coupe|/100). Une coupe de 50% réduit l'ETI de 25%."}</li>
            <li><strong>{"Supply-side plafonné"}</strong>{" : le boost de croissance ne dépasse pas ±2 pp/an (record : Irlande post-2014)."}</li>
            <li><strong>{"Malus dette"}</strong>{" : +50 bps par tranche de 10% de dette/PIB au-delà de 120%. Les intérêts alourdissent le déficit."}</li>
            <li><strong>{"Warnings visuels"}</strong>{" : orange >20% de coupe, rouge >35%, bannière si perte >15% PIB."}</li>
          </ul>
        </Section>

        {/* ============================================================ */}
        <Section title="10. Données macro (INSEE 2024)">
          <table className="w-full text-sm border-collapse mt-2">
            <tbody className="text-slate-700">
              {[
                ["PIB", "2 920 Md€"],
                ["Prélèvements obligatoires", "1 250 Md€"],
                ["Taux PO/PIB (INSEE)", "42.8%"],
                ["Taux PO/PIB (OCDE)", "43.5%"],
                ["Recettes publiques", "1 501.6 Md€"],
                ["Dépenses publiques", "1 670.2 Md€"],
                ["dont charge de la dette", "55 Md€"],
                ["Déficit", "−168.6 Md€ (5.8% PIB)"],
                ["Dette", "3 305 Md€ (113.2% PIB)"],
                ["Emploi total", "30.5M"],
                ["Salariés privés", "20M"],
                ["Population", "68M"],
                ["Croissance tendancielle", "1.1%/an (réel)"],
                ["Inflation baseline", "2%/an"],
              ].map(([k, v], i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-1.5 pr-4 text-slate-500">{k}</td>
                  <td className="py-1.5 font-mono font-medium">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* ============================================================ */}
        <Section title="11. Sources académiques">
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-600">
            <li>{"Saez, E., Slemrod, J. & Giertz, S. (2012). \"The Elasticity of Taxable Income\". Journal of Economic Literature, 50(1), 3-50."}</li>
            <li>{"Lefebvre, M., Lehmann, E. & Sicsic, M. (2025). \"Estimating the Laffer Tax Rate on Capital Income\". Scandinavian Journal of Economics, 127(2), 460-489."}</li>
            <li>{"Trabandt, M. & Uhlig, H. (2011). \"The Laffer Curve Revisited\". Journal of Monetary Economics, 58(4), 305-327."}</li>
            <li>{"Crépon, B. & Desplatz, R. (2001). \"Évaluation des allègements de charges sur les bas salaires\". Économie et Statistique, 348(1), 3-24."}</li>
            <li>{"Arnold, J. et al. (2008). \"Tax Policy for Economic Recovery\". OECD Working Papers No. 620."}</li>
            <li>{"OCDE (2010). \"Tax Policy Reform and Economic Growth\". OECD Tax Policy Studies No. 20."}</li>
            <li>{"Slemrod, J. (2001). \"A General Model of the Behavioral Response to Taxation\". International Tax and Public Finance, 8, 119-128."}</li>
            <li>{"Chetty, R. (2009). \"Is the Taxable Income Elasticity Sufficient?\". American Economic Journal: Economic Policy, 1(2), 31-52."}</li>
            <li>{"Verdugo, G. (2016). \"Real Wage Cyclicality in the Eurozone\". European Economic Review, 82, 162-180."}</li>
          </ul>
        </Section>

        {/* ============================================================ */}
        <Section title="12. Niveaux de confiance">
          <table className="w-full text-sm border-collapse mt-2">
            <thead>
              <tr className="text-left border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">{"Canal"}</th>
                <th className="py-2 pr-4">{"Confiance"}</th>
                <th className="py-2">{"Justification"}</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {[
                ["Canal 1 (réponse réelle)", "Solide", "ETI bien documenté, Saez et al."],
                ["Canal 2 (supply-side)", "Inférence", "OCDE ranking robuste, magnitudes incertaines"],
                ["Canal 3 (marge extensive)", "Inférence", "Calibré sur PFU 2017, échantillon = 1 réforme"],
                ["Canal 4 (signal)", "Spéculation", "Effets attestés qualitativement, pas quantifiés"],
                ["Canal 5 (formalisation)", "Solide/Inférence", "Décomposition ETI documentée, part exacte incertaine"],
              ].map(([canal, conf, just], i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-1.5 pr-4 font-medium">{canal}</td>
                  <td className="py-1.5 pr-4">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      conf === 'Solide' ? 'bg-emerald-50 text-emerald-600' :
                      conf === 'Inférence' ? 'bg-amber-50 text-amber-600' :
                      conf === 'Solide/Inférence' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-red-50 text-red-500'
                    }`}>{conf}</span>
                  </td>
                  <td className="py-1.5 text-xs text-slate-500">{just}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <div className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
          {"Simulateur Laffer France — Modèle v3 post-audit — R(τ) = τ × B₀ × (1−τ)^ε — Données : INSEE, OCDE 2024"}
        </div>
      </div>
    </main>
  );
}

// ============================================================
// Sub-components
// ============================================================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-slate-900 mb-3 pb-2 border-b border-slate-200">{title}</h2>
      {children}
    </section>
  );
}

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-100 border border-slate-200 rounded-lg px-4 py-2 my-2 font-mono text-sm text-slate-800 overflow-x-auto">
      {children}
    </div>
  );
}

function Source({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-slate-400 italic mt-1">{children}</p>;
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2 text-xs text-amber-800">
      {children}
    </div>
  );
}

function Channel({ num, name, confidence, color, children }: {
  num: number; name: string; confidence: string; color: string; children: React.ReactNode;
}) {
  return (
    <div className="mt-4 p-4 bg-white border border-slate-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: color }}>{num}</span>
        <span className="font-semibold text-slate-800">{name}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
          confidence === 'Solide' || confidence === 'Solide/Inférence' ? 'bg-emerald-50 text-emerald-600' :
          confidence === 'Inférence' ? 'bg-amber-50 text-amber-600' :
          'bg-red-50 text-red-500'
        }`}>{confidence}</span>
      </div>
      <div className="text-sm text-slate-600 space-y-1">{children}</div>
    </div>
  );
}
