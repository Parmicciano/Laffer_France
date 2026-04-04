import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simulateur Laffer France — Taxer moins pour gagner plus ? Simulez l'impact",
  description:
    "Simulateur interactif de la courbe de Laffer calibré sur les données françaises. Sources : INSEE, OCDE, Lefebvre et al. (2025), Trabandt & Uhlig (2011). Open source.",
  keywords: "courbe de Laffer, simulateur fiscal, France, impôts, prélèvements obligatoires, autofinancement, baisse d'impôt, élasticité, Lefebvre, Trabandt, OCDE, INSEE, politique fiscale, fiscalité française",
  authors: [{ name: "Jean-Marie", url: "https://laffer.quixotry.app" }],
  robots: "index, follow",
  alternates: {
    canonical: "https://laffer.quixotry.app/",
  },
  openGraph: {
    type: "website",
    url: "https://laffer.quixotry.app/",
    title: "Simulateur Laffer France — Le seul outil interactif calibré sur les données académiques",
    description: "La France prélève 43.5% de son PIB. Et si on ajustait ? Simulez l'impact d'une baisse d'impôt avec les élasticités de Lefebvre et al. (2025) et Trabandt & Uhlig (2011).",
    images: [
      {
        url: "https://laffer.quixotry.app/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "fr_FR",
    siteName: "Simulateur Laffer France",
  },
  twitter: {
    card: "summary_large_image",
    title: "Simulateur Laffer France — Simulez l'impact d'une réforme fiscale",
    description: "43.5% du PIB en prélèvements. Dernière en compétitivité fiscale OCDE. Et si on ajustait ?",
    images: ["https://laffer.quixotry.app/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Simulateur Laffer France",
              description: "Simulateur interactif de la courbe de Laffer calibré sur les données économiques françaises avec sources académiques vérifiables.",
              url: "https://laffer.quixotry.app",
              applicationCategory: "FinanceApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "EUR",
              },
              author: {
                "@type": "Person",
                name: "Jean-Marie",
                affiliation: {
                  "@type": "EducationalOrganization",
                  name: "ENSTA Paris",
                },
              },
              citation: [
                {
                  "@type": "ScholarlyArticle",
                  name: "Estimating the Laffer Tax Rate on Capital Income: Cross-Base Responses Matter!",
                  author: ["Marie-Noëlle Lefebvre", "Etienne Lehmann", "Michaël Sicsic"],
                  datePublished: "2025",
                  isPartOf: {
                    "@type": "Periodical",
                    name: "Scandinavian Journal of Economics",
                  },
                },
                {
                  "@type": "ScholarlyArticle",
                  name: "The Laffer Curve Revisited",
                  author: ["Mathias Trabandt", "Harald Uhlig"],
                  datePublished: "2011",
                  isPartOf: {
                    "@type": "Periodical",
                    name: "Journal of Monetary Economics",
                  },
                },
              ],
              inLanguage: "fr",
              isAccessibleForFree: true,
            }),
          }}
        />
      </head>
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
