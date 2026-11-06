import { useEffect, useState } from "react";

/** False on the server and first client render; true afterwards. Avoids hydration mismatches with localStorage state. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
