"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCompareStore } from "@/store/compare";
import { useHydrated } from "@/hooks/useHydrated";

export type NavItem = { href: string; label: string };

export function NavLinks({ items, label, variant = "main" }: { items: NavItem[]; label: string; variant?: "main" | "sub" }) {
  const pathname = usePathname();
  const basket = useCompareStore((s) => s.items.length);
  const hydrated = useHydrated();
  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap gap-1">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname === item.href || (variant === "main" && pathname.startsWith(item.href + "/"));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "block rounded-md px-3 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700",
                  variant === "main"
                    ? active ? "bg-brand-50 text-brand-800" : "text-slate-700 hover:bg-slate-100"
                    : active ? "border-b-2 border-brand-700 text-brand-800 rounded-none" : "text-slate-700 hover:text-slate-900")}
              >
                {item.label}
                {item.href === "/estimator/compare" && hydrated && basket > 0 && (
                  <span className="ml-1.5 rounded-full bg-brand-700 px-1.5 py-0.5 text-xs text-white" aria-label={`${basket} in basket`}>{basket}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
