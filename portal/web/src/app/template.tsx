import type { ReactNode } from "react";

/** Unlike layout.tsx, a template re-mounts on every navigation, so this gives each page a fade-in. */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
