import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { NavLinks } from "@/components/Nav";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: { default: "Housing Portal", template: "%s · Housing Portal" },
  description: "Property value estimator and market analysis, powered by one ML model.",
};

const MAIN_NAV = [
  { href: "/", label: "Home" },
  { href: "/estimator", label: "Value Estimator" },
  { href: "/market", label: "Market Analysis" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-brand-800 focus:ring-2 focus:ring-brand-700">
          Skip to main content
        </a>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span className="text-lg font-bold text-brand-800">🏠 Housing Portal</span>
            <NavLinks items={MAIN_NAV} label="Applications" />
          </div>
        </header>
        <Providers>
          <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-8 focus:outline-none">
            {children}
          </main>
        </Providers>
        <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-slate-600">
          Estimates come from a simple regression model and are for demonstration only.
        </footer>
      </body>
    </html>
  );
}
