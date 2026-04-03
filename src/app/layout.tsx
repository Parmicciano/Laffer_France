import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simulateur Laffer France — Taxer plus, gagner moins ?",
  description:
    "Comprenez en 30 secondes pourquoi la France perd de l'argent en taxant trop. Simulateur interactif basé sur la recherche académique.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
