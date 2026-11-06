import type { ReactNode } from "react";
import { NavLinks } from "@/components/Nav";

const SUB = [
  { href: "/market", label: "Dashboard" },
  { href: "/market/properties", label: "Data table" },
  { href: "/market/what-if", label: "What-if" },
];

export default function MarketLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="mb-6 border-b border-slate-200"><NavLinks items={SUB} label="Market Analysis sections" variant="sub" /></div>
      {children}
    </>
  );
}
