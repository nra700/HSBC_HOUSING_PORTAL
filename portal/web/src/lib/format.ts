const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 });

export const formatUsd = (n: number) => usd.format(n);
export const formatUsdCompact = (n: number) => compact.format(n);
export const formatNumber = (n: number, digits = 2) =>
  n.toLocaleString("en-US", { maximumFractionDigits: digits });
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
