/** Client-side PDF export (CSV comes from the Java backend). Loaded lazily to keep the bundle small. */
import type { MarketRow, Summary } from "./types";
import { formatUsd } from "./format";

export async function exportMarketPdf(summary: Summary, rows: MarketRow[], filterText: string) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Property market report", 14, 18);
  doc.setFontSize(10);
  doc.text(`Filters: ${filterText || "none"}`, 14, 26);
  autoTable(doc, {
    startY: 32,
    head: [["Metric", "Value"]],
    body: [
      ["Properties", summary.count.toLocaleString()],
      ["Mean price", formatUsd(summary.meanPrice)],
      ["Median price", formatUsd(summary.medianPrice)],
      ["10th – 90th percentile", `${formatUsd(summary.p10Price)} – ${formatUsd(summary.p90Price)}`],
      ["Mean square footage", Math.round(summary.meanSquareFootage).toLocaleString()],
      ["Mean school rating", summary.meanSchoolRating.toFixed(1)],
    ],
  });
  autoTable(doc, {
    head: [["ID", "Sq ft", "Beds", "Baths", "Built", "Lot", "Dist (km)", "School", "Price"]],
    body: rows.map((r) => [r.id, r.squareFootage, r.bedrooms, r.bathrooms, r.yearBuilt, r.lotSize,
      r.distanceToCityCentre, r.schoolRating, formatUsd(r.price)]),
    styles: { fontSize: 8 },
  });
  doc.save("market-report.pdf");
}
