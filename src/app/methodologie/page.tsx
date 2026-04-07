"use client";

export default function Methodologie() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <a href="/" className="text-sm text-blue-600 hover:underline mb-6 inline-block">{"← Retour au simulateur"}</a>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">{"Méthodologie"}</h1>
        <p className="text-slate-500 mb-10">{"Comment fonctionne le simulateur, en langage clair. Chaque hypothèse est sourcée et chaque formule est expliquée."}</p>

        {/* ================================================================ */}
        <S title="1. L'idée centrale : la courbe de Laffer">
          <P>{"Quand l'État augmente un impôt, les recettes ne montent pas forcément. Au-delà d'un certain seuil, les gens travaillent moins, investissent ailleurs, ou optimisent davantage. Les recettes finissent par baisser."}</P>
          <P>{"La courbe de Laffer décrit cette relation : les recettes montent avec le taux, atteignent un sommet (le taux optimal), puis redescendent."}</P>
          <F label="Recettes" formula="Taux  ×  Base taxable  ×  (1 − Taux) puissance élasticité" />
          <P>{"Le taux optimal est simplement :"}</P>
          <F label="Taux optimal" formula="1  ÷  (1 + élasticité)" />
          <Ex>{"Si l'élasticité est 0.35 (travail), le taux optimal est 1 ÷ 1.35 = 74%. Au-delà, chaque point de hausse rapporte de moins en moins."}</Ex>
          <Src>{"Saez, Slemrod & Giertz (2012), Journal of Economic Literature"}</Src>
        </S>

        {/* ================================================================ */}
        <S title="2. Les élasticités : de combien les gens réagissent">
          <P>{"L'élasticité (ε) mesure la sensibilité des contribuables au taux d'imposition. Une élasticité de 0.35 signifie : quand le taux marginal augmente de 10%, le revenu déclaré baisse de 3.5%."}</P>
          <P>{"Le simulateur utilise des élasticités issues de la recherche académique, spécifiques à la France quand c'est possible."}</P>

          <table className="w-full text-sm border-collapse mt-4 mb-4">
            <thead>
              <tr className="text-left border-b-2 border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="py-3 pr-4">Impôt</th>
                <th className="py-3 pr-4">Élasticité</th>
                <th className="py-3 pr-4">Taux optimal</th>
                <th className="py-3 pr-4">Taux actuel</th>
                <th className="py-3">Source</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {[
                ["Travail (IR + CSG)", "0.35", "74%", "65%", "Saez et al. (2012), médiane ETI"],
                ["Capital — résultat principal", "0.50", "43%", "55%", "Calibration inspirée de Lefebvre et al. (2025)*"],
                ["Capital — sans cross-élasticité", "0.75", "57%", "55%", "Calibration inspirée de Lefebvre et al. (2025)*"],
                ["Capital — avec cotisations", "1.86", "35%", "55%", "Calibration inspirée de Lefebvre et al. (2025)*"],
                ["Cotisations patronales", "0.40", "71%", "45%", "Crépon & Desplatz (2001)"],
                ["TVA", "0.15", "87%", "20%", "Estimation consensus"],
              ].map(([imp, e, opt, act, src], i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-2.5 pr-4 font-medium">{imp}</td>
                  <td className="py-2.5 pr-4 font-mono text-blue-700 font-semibold">{e}</td>
                  <td className="py-2.5 pr-4 font-mono">{opt}</td>
                  <td className="py-2.5 pr-4 font-mono">{act}</td>
                  <td className="py-2.5 text-xs text-slate-400">{src}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <P>{"Le capital a trois élasticités possibles selon qu'on inclut ou non les effets croisés sur l'IR et les cotisations. L'utilisateur choisit dans le panneau Hypothèses."}</P>

          <Note>{"* Les paramètres du capital sont nos choix de calibration, inspirés des estimations de Lefebvre, Lehmann & Sicsic (2025). Ces valeurs sont entourées d'une incertitude substantielle que les auteurs eux-mêmes soulignent. Elles n'engagent pas les auteurs de l'étude source. À titre d'exemple, les taux laffériens estimés le sont au conditionnel et à court terme ; leur extrapolation à long terme reste une question ouverte."}</Note>

          <Note>{"Garde-fou : pour les coupes supérieures à 20%, l'élasticité est réduite progressivement (on ne peut pas extrapoler une élasticité calibrée sur de petites variations à des changements massifs). Une coupe de 50% réduit l'élasticité effective d'environ 25%."}</Note>
        </S>

        {/* ================================================================ */}
        <S title="3. L'autofinancement : combien l'État récupère">
          <P>{"Quand on baisse un impôt, la perte brute n'est pas la perte réelle. Les comportements changent et une partie des recettes revient. C'est l'autofinancement."}</P>

          <h3 className="font-semibold text-slate-800 mt-5 mb-2">{"Modèle A — Équilibre partiel (conservateur)"}</h3>
          <P>{"La formule est simple : on divise l'élasticité par (1 + élasticité)."}</P>
          <F label="Autofinancement" formula="élasticité  ÷  (1 + élasticité)" />
          <Ex>{"Travail (ε = 0.35) : autofinancement = 0.35 ÷ 1.35 = 25.9%. Sur 10 Md€ de baisse, l'État récupère automatiquement 2.6 Md€ par les changements de comportement."}</Ex>

          <h3 className="font-semibold text-slate-800 mt-5 mb-2">{"Modèle B — Équilibre général (optimiste)"}</h3>
          <P>{"Le modèle de Trabandt & Uhlig (2011) prend en compte l'accumulation de capital et les effets de second tour. Il donne des taux plus élevés : 54% pour le travail, 79% pour le capital."}</P>
          <Src>{"Trabandt & Uhlig (2011), Journal of Monetary Economics"}</Src>
        </S>

        {/* ================================================================ */}
        <S title="4. Les 5 canaux de récupération">
          <P>{"Le simulateur ne se contente pas d'un seul chiffre d'autofinancement. Il décompose la récupération en 5 canaux distincts, avec des vitesses différentes."}</P>

          <Ch num={1} name="Réponse réelle" speed="Lente (4-10 ans)" conf="Solide">
            <P>{"C'est le canal classique : les gens ajustent leur comportement. Les médecins travaillent un jour de plus, les entrepreneurs investissent davantage, les cadres négocient moins de packages défiscalisés."}</P>
            <P>{"Ce canal monte progressivement sur 4 à 10 ans (configurable). C'est la part \"réelle\" de l'élasticité du revenu taxable."}</P>
            <F label="An Y" formula="Coupe × autofinancement × (1 − part formalisation) × min(1, année ÷ durée phase-in)" />
            <Ex>{"Baisse travail de 10 Md€, autofinancement 25.9%, formalisation 50%, phase-in 5 ans. An 3 : 10 × 0.259 × 0.50 × (3/5) = 0.78 Md€."}</Ex>
          </Ch>

          <Ch num={2} name="Supply-side (croissance)" speed="Moyenne (composée)" conf="Inférence">
            <P>{"Baisser les impôts stimule la croissance du PIB. Un PIB plus élevé génère plus de recettes fiscales, même à taux plus bas. C'est l'effet boule de neige."}</P>
            <P>{"Chaque point de PIB de baisse fiscale ajoute un boost de croissance annuel, qui varie selon le type d'impôt (le plus distorsif = plus gros boost) :"}</P>
            <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1 my-2">
              <li>{"Capital (IS) : 0.30 point de croissance par point de PIB de baisse — le plus efficace"}</li>
              <li>{"Cotisations : 0.15 point"}</li>
              <li>{"Travail (IR/CSG) : 0.10 point"}</li>
            </ul>
            <P>{"Ce boost est plafonné à +2 points de croissance par an (record historique : Irlande post-2014). Il peut être permanent, temporaire (convergence en 15 ans), ou hybride selon le modèle choisi."}</P>
            <P>{"Les recettes induites = PIB additionnel × taux de prélèvement (42.8%)."}</P>
            <Src>{"OCDE (2010), Arnold et al. (2008). Le classement (IS > cotis > IR) est robuste, les magnitudes sont extrapolées."}</Src>
          </Ch>

          <Ch num={3} name="Marge extensive" speed="Rapide (1-3 ans)" conf="Inférence">
            <P>{"Contrairement à la marge intensive (les mêmes gens déclarent plus ou moins), la marge extensive concerne des gens qui entrent ou sortent du système : retour d'exilés fiscaux, nouvelles distributions de dividendes, créations d'entreprises."}</P>

            <h4 className="font-medium text-slate-700 mt-3 mb-1">{"3a. Retour d'exilés fiscaux"}</h4>
            <P>{"19 000 foyers ISF ont quitté la France entre 1982 et 2017, emportant ~6 Md€ de valeur ajoutée annuelle (Rexecode). Quand le capital est réduit d'au moins 5%, une partie revient : 30% du stock restant chaque année, décroissant exponentiellement."}</P>

            <h4 className="font-medium text-slate-700 mt-3 mb-1">{"3b. Élargissement de la base capital"}</h4>
            <P>{"Après le PFU 2017, les dividendes distribués sont passés de 13.6 à 23.2 Md€ (+70%). Ce n'est pas que les mêmes gens déclarent plus — c'est que des revenus cachés, différés ou restructurés réapparaissent. Le simulateur modélise cet effet comme un élargissement de la base taxable du capital, calibré de façon conservatrice (+2.5% pour une coupe de référence de 15%, là où le PFU a montré +70%)."}</P>

            <h4 className="font-medium text-slate-700 mt-3 mb-1">{"3c. Création d'entreprises"}</h4>
            <P>{"Moins d'impôt = plus de créations d'entreprises. Chaque nouvelle entreprise génère ~15 000€/an de recettes fiscales (IR + cotisations + TVA). Effet avec un lag de 2 ans."}</P>
          </Ch>

          <Ch num={4} name="Signal & anticipations" speed="Instantané" conf="Spéculation">
            <P>{"Les marchés réagissent à l'annonce, pas à l'implémentation. Une réforme crédible change les anticipations le jour J."}</P>

            <h4 className="font-medium text-slate-700 mt-3 mb-1">{"4a. Compression du spread"}</h4>
            <P>{"Si les marchés perçoivent une amélioration structurelle du déficit, le taux d'emprunt de la France baisse. Sur 3 305 Md€ de dette, chaque 10 points de base représentent 3.3 Md€/an d'économies."}</P>

            <h4 className="font-medium text-slate-700 mt-3 mb-1">{"4b. Investissement direct étranger"}</h4>
            <P>{"La France est dernière du classement ITCI (compétitivité fiscale). Une amélioration attire de l'IDE. Le simulateur estime +3% d'IDE par rang gagné, dont 20% génère des recettes fiscales directes."}</P>

            <h4 className="font-medium text-slate-700 mt-3 mb-1">{"Multiplicateur de crédibilité"}</h4>
            <P>{"Ce canal est multiplié si la réforme s'accompagne d'engagements d'investissement coordonnés (type Choose France). Par défaut 1.0× (pas de coordination). Ce canal n'est PAS affecté par les scénarios pessimiste/optimiste car c'est un effet binaire : la réforme est annoncée ou non."}</P>
          </Ch>

          <Ch num={5} name="Formalisation" speed="Très rapide (80% en an 1)" conf="Solide/Inférence">
            <P>{"Quand les taux baissent, l'optimisation fiscale devient moins rentable. Des revenus qui étaient cachés, différés ou restructurés réapparaissent dans la base taxable. C'est quasi instantané car c'est une décision comptable, pas un investissement réel."}</P>
            <P>{"La recherche (Slemrod 2001, Chetty 2009) montre que 50 à 75% de l'élasticité observée est en fait de l'optimisation/shifting, pas de la réponse réelle. Le simulateur utilise 50% par défaut (configurable de 30% à 70%)."}</P>
            <P>{"Ce canal court-circuite le phase-in lent du canal 1 : 80% de l'effet arrive dès l'année 1, 100% en année 2."}</P>
            <Ex>{"Baisse capital de 7.2 Md€, autofinancement 33%, formalisation 50%. An 1 : 7.2 × 0.33 × 0.50 × 0.80 = 0.95 Md€ récupérés immédiatement."}</Ex>
            <Src>{"Slemrod (2001), International Tax and Public Finance. Chetty (2009), American Economic Journal."}</Src>
          </Ch>
        </S>

        {/* ================================================================ */}
        <S title="5. L'emploi : la loi d'Okun">
          <P>{"Un PIB plus élevé crée des emplois. La relation est modélisée par le coefficient d'Okun, qui mesure combien d'emplois sont créés par point de croissance du PIB."}</P>
          <F label="Emplois créés" formula="30.5 millions  ×  (PIB additionnel ÷ PIB)  ×  coefficient Okun" />
          <P>{"Le coefficient est configurable de 0.25 (marché très rigide) à 0.50 (marché flexible). Recommandé pour la France : 0.30."}</P>
          <Ex>{"Si le PIB augmente de 1% (29.2 Md€) avec Okun = 0.30 : 30.5M × 0.01 × 0.30 = 91 500 emplois créés."}</Ex>
          <P>{"Pour les cotisations patronales, la base est 20M salariés privés (pas l'emploi total), car c'est sur eux que les allègements portent."}</P>
        </S>

        {/* ================================================================ */}
        <S title="6. La dette publique">
          <P>{"Le modèle de dette sépare les dépenses opérationnelles (1 615 Md€) de la charge de la dette (55 Md€) pour éviter de compter les intérêts deux fois."}</P>

          <h3 className="font-semibold text-slate-800 mt-4 mb-2">{"Chaque année :"}</h3>
          <ol className="list-decimal pl-5 text-sm text-slate-600 space-y-2">
            <li>{"Dépenses opérationnelles = 1 615 Md€ × (1 + 2% inflation) puissance année"}</li>
            <li>{"Intérêts = dette × taux d'intérêt (2.5% de base)"}</li>
            <li>{"Déficit = recettes − dépenses opérationnelles − intérêts"}</li>
            <li>{"Nouvelle dette = ancienne dette − déficit (le déficit est négatif, donc la dette augmente)"}</li>
          </ol>

          <h3 className="font-semibold text-slate-800 mt-4 mb-2">{"Malus de soutenabilité"}</h3>
          <P>{"Si la dette dépasse 120% du PIB, les marchés imposent des taux plus élevés. Le modèle ajoute +0.5 point de taux d'intérêt par tranche de 10% de dette/PIB au-delà de 120%. Cela crée un cercle vicieux : plus de dette → plus d'intérêts → plus de déficit → plus de dette."}</P>

          <h3 className="font-semibold text-slate-800 mt-4 mb-2">{"Dette supplémentaire vs statu quo"}</h3>
          <P>{"Le graphique montre la différence entre la dette avec réforme et la dette sans réforme. Un chiffre positif signifie que la réforme a temporairement créé plus de dette. Quand l'autofinancement dépasse 100%, ce chiffre commence à baisser."}</P>
        </S>

        {/* ================================================================ */}
        <S title="7. Le pouvoir d'achat">
          <P>{"Le simulateur calcule combien chaque habitant gagne ou perd par mois, en moyenne. Le calcul a trois composantes."}</P>

          <h3 className="font-semibold text-slate-800 mt-4 mb-2">{"Allègement direct"}</h3>
          <P>{"La baisse d'impôt sur le travail arrive directement dans la poche des salariés. Pour les cotisations patronales, seule une partie est répercutée en salaires : 40% la première année, montant progressivement à 70% en 5 ans. Pour le capital, seulement 10% se diffuse en pouvoir d'achat large (le reste bénéficie aux détenteurs de capital)."}</P>

          <h3 className="font-semibold text-slate-800 mt-4 mb-2">{"Via l'emploi"}</h3>
          <P>{"Chaque emploi créé représente un salaire net moyen de 30 000€/an qui entre dans l'économie."}</P>

          <h3 className="font-semibold text-slate-800 mt-4 mb-2">{"Via la croissance"}</h3>
          <P>{"Un PIB plus élevé tire les salaires vers le haut. Mais les salaires montent moins vite que le PIB (élasticité salaires/PIB = 0.70), et seule la moitié du PIB va aux salaires."}</P>
          <F label="Gain salarial" formula="PIB additionnel  ×  50% (part salariale)  ×  70% (élasticité)" />

          <h3 className="font-semibold text-slate-800 mt-4 mb-2">{"Par habitant"}</h3>
          <F label="€/mois par habitant" formula="Total (Md€)  ×  1 milliard  ÷  68 millions  ÷  12 mois" />
          <Note>{"C'est une moyenne nationale. Un salarié au SMIC bénéficie davantage d'une baisse de cotisations, un cadre supérieur d'une baisse d'IR, un actionnaire d'une baisse d'IS. Le chiffre par habitant lisse ces différences."}</Note>
        </S>

        {/* ================================================================ */}
        <S title="8. Le mode trajectoire">
          <P>{"Au lieu d'appliquer la coupe d'un coup, le mode trajectoire permet de simuler une montée progressive ou un choc suivi d'un rollback."}</P>

          <h3 className="font-semibold text-slate-800 mt-4 mb-2">{"Progressif"}</h3>
          <P>{"La coupe augmente linéairement sur N années. Exemple : pour une cible de −15% sur 5 ans, c'est −3% par an."}</P>

          <h3 className="font-semibold text-slate-800 mt-4 mb-2">{"Choc + rollback"}</h3>
          <P>{"La coupe commence forte (2× la cible par défaut) puis diminue chaque année. Exemple : choc de −30%, puis rollback de 2%/an jusqu'à la cible de −15%."}</P>
          <P>{"L'intérêt : le choc déclenche les canaux rapides (formalisation, signal, retour d'exilés) plus vite, mais il crée aussi plus de dette de transition. Le graphique de comparaison montre si le jeu en vaut la chandelle."}</P>
        </S>

        {/* ================================================================ */}
        <S title="9. Les garde-fous">
          <P>{"Le modèle inclut des limites pour éviter les résultats absurdes quand on pousse les curseurs à l'extrême."}</P>
          <ul className="list-disc pl-5 text-sm text-slate-600 space-y-3 mt-3">
            <li><strong>{"Élasticités décroissantes"}</strong>{" — Plus la coupe est large, moins l'élasticité marginale est forte. Une coupe de 50% réduit l'élasticité d'environ 25%. Justification : à taux très bas, il y a moins d'optimisation à récupérer."}</li>
            <li><strong>{"Supply-side plafonné"}</strong>{" — Le boost de croissance annuel ne peut pas dépasser +2 points de pourcentage (record historique : Irlande post-2014, dans des circonstances exceptionnelles)."}</li>
            <li><strong>{"Malus dette"}</strong>{" — Au-delà de 120% de dette/PIB, le taux d'intérêt augmente automatiquement, ce qui aggrave le déficit."}</li>
            <li><strong>{"Avertissements visuels"}</strong>{" — Orange au-delà de 20% de coupe (élasticités extrapolées), rouge au-delà de 35% (résultats non fiables), bannière si la perte brute dépasse 15% du PIB."}</li>
          </ul>
        </S>

        {/* ================================================================ */}
        <S title="10. Données macro (INSEE 2024)">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-3">
            {[
              ["PIB", "2 920 Md€"],
              ["Prélèvements obligatoires", "1 250 Md€ (42.8% PIB)"],
              ["Recettes publiques", "1 501.6 Md€"],
              ["Dépenses publiques", "1 670.2 Md€"],
              ["dont charge dette", "55 Md€"],
              ["Déficit", "−168.6 Md€ (5.8% PIB)"],
              ["Dette", "3 305 Md€ (113.2% PIB)"],
              ["Emploi total", "30.5 millions"],
              ["Salariés privés", "20 millions"],
              ["Population", "68 millions"],
              ["Croissance tendancielle", "1.1%/an (réel)"],
              ["Inflation baseline", "2%/an"],
            ].map(([k, v], i) => (
              <div key={i} className="flex justify-between py-1.5 border-b border-slate-100 text-sm">
                <span className="text-slate-500">{k}</span>
                <span className="font-mono font-medium text-slate-800">{v}</span>
              </div>
            ))}
          </div>
        </S>

        {/* ================================================================ */}
        <S title="11. Niveaux de confiance">
          <P>{"Chaque canal est étiqueté selon la robustesse de sa calibration."}</P>
          <div className="space-y-3 mt-3">
            {[
              ["Solide", "#10b981", "bg-emerald-50 text-emerald-700 border-emerald-200", "Calibré sur des données robustes, consensus académique. Ex: élasticité du revenu taxable (Saez et al.)."],
              ["Inférence", "#f59e0b", "bg-amber-50 text-amber-700 border-amber-200", "Basé sur des données réelles mais extrapolé. Ex: boost de croissance par type d'impôt (OCDE 2010, ranking qualitatif)."],
              ["Spéculation", "#ef4444", "bg-red-50 text-red-700 border-red-200", "Effet attesté qualitativement mais pas quantifié dans la littérature. Ex: canal signal (IDE, spread)."],
            ].map(([label, , cls, desc], i) => (
              <div key={i} className={`p-3 rounded-lg border ${cls}`}>
                <span className="font-semibold">{label}</span>
                <span className="ml-2 text-sm">{desc}</span>
              </div>
            ))}
          </div>
        </S>

        {/* ================================================================ */}
        <S title="12. Sources académiques">
          <div className="space-y-2 mt-3 text-sm text-slate-600">
            {[
              "Saez, E., Slemrod, J. & Giertz, S. (2012). \"The Elasticity of Taxable Income with Respect to Marginal Tax Rates: A Critical Review\". Journal of Economic Literature, 50(1), 3-50.",
              "Lefebvre, M., Lehmann, E. & Sicsic, M. (2025). \"Estimating the Laffer Tax Rate on Capital Income\". Scandinavian Journal of Economics, 127(2), 460-489. [Nos calibrations sont inspirées de cette étude mais n'engagent pas les auteurs.]",
              "Matray, A. (2022). \"Dividend Taxes, Firm Growth, and the Allocation of Capital\". NBER Working Paper No. 30099.",
              "Trabandt, M. & Uhlig, H. (2011). \"The Laffer Curve Revisited\". Journal of Monetary Economics, 58(4), 305-327.",
              "Crépon, B. & Desplatz, R. (2001). \"Évaluation des allègements de charges sur les bas salaires\". Économie et Statistique, 348(1), 3-24.",
              "Arnold, J. et al. (2008). \"Tax Policy for Economic Recovery and Growth\". OECD Working Papers No. 620.",
              "OCDE (2010). \"Tax Policy Reform and Economic Growth\". OECD Tax Policy Studies No. 20.",
              "Slemrod, J. (2001). \"A General Model of the Behavioral Response to Taxation\". International Tax and Public Finance, 8, 119-128.",
              "Chetty, R. (2009). \"Is the Taxable Income Elasticity Sufficient to Calculate Deadweight Loss?\". American Economic Journal: Economic Policy, 1(2), 31-52.",
              "Verdugo, G. (2016). \"Real Wage Cyclicality in the Eurozone\". European Economic Review, 82, 162-180.",
            ].map((ref, i) => (
              <p key={i} className="pl-4 border-l-2 border-slate-200">{ref}</p>
            ))}
          </div>
        </S>

        <div className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
          {"Simulateur Laffer France — Modèle v3 post-audit — Données INSEE/OCDE 2024"}
        </div>
      </div>
    </main>
  );
}

// ============================================================
// Sub-components
// ============================================================

function S({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] text-slate-700 leading-relaxed">{children}</p>;
}

function F({ label, formula }: { label: string; formula: string }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg px-5 py-3 my-3 flex items-center gap-4">
      <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider whitespace-nowrap">{label}</span>
      <span className="text-[15px] text-blue-900 font-medium">{formula}</span>
    </div>
  );
}

function Ex({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-100 border border-slate-200 rounded-lg px-4 py-2.5 my-2 text-sm text-slate-600">
      <span className="font-semibold text-slate-500 mr-1">{"Exemple :"}</span>{children}
    </div>
  );
}

function Src({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-slate-400 italic mt-1">{children}</p>;
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 mt-3 text-sm text-amber-800">
      <span className="font-semibold mr-1">{"Note :"}</span>{children}
    </div>
  );
}

function Ch({ num, name, speed, conf, children }: {
  num: number; name: string; speed: string; conf: string; children: React.ReactNode;
}) {
  const colors: Record<string, string> = {
    "Solide": "#10b981", "Solide/Inférence": "#10b981",
    "Inférence": "#f59e0b", "Spéculation": "#ef4444",
  };
  return (
    <div className="mt-5 p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: colors[conf] || "#64748b" }}>{num}</span>
        <div>
          <span className="font-semibold text-slate-800 text-[15px]">{name}</span>
          <span className="ml-2 text-xs text-slate-400">{speed}</span>
        </div>
        <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          conf.includes('Solide') ? 'bg-emerald-50 text-emerald-600' :
          conf === 'Inférence' ? 'bg-amber-50 text-amber-600' :
          'bg-red-50 text-red-500'
        }`}>{conf}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
