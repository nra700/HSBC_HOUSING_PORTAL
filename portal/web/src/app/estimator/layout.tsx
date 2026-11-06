import type { ReactNode } from "react";
import { NavLinks } from "@/components/Nav";

const SUB = [
  { href: "/estimator", label: "Estimate" },
  { href: "/estimator/compare", label: "Compare" },
];

export default function EstimatorLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="mb-6 border-b border-slate-200"><NavLinks items={SUB} label="Value Estimator sections" variant="sub" /></div>
      {children}
    </>
  );
}
