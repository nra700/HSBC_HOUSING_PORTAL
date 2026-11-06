import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { WhatIfTool } from "@/components/WhatIfTool";
import { marketServer } from "@/lib/server-api";

export const metadata: Metadata = { title: "What-if analysis" };

export default async function WhatIfPage() {
  // Start the scenario from the dataset's average size and school rating.
  const summary = await marketServer.summary({});
  return (
    <>
      <PageHeader title="What-if analysis" description="Change one property feature and see how the model’s estimate responds, all else equal." />
      <WhatIfTool defaults={{ square_footage: Math.round(summary.meanSquareFootage), school_rating: Number(summary.meanSchoolRating.toFixed(1)) }} />
    </>
  );
}
