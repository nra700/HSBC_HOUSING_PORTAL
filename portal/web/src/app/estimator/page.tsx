import type { Metadata } from "next";
import { EstimatorClient } from "@/components/EstimatorClient";
import { PageHeader } from "@/components/ui";
import { estimatorServer } from "@/lib/server-api";

export const metadata: Metadata = { title: "Value Estimator" };
export const dynamic = "force-dynamic"; // history changes constantly

export default async function EstimatorPage() {
  const history = await estimatorServer.history(); // React Server Component data load
  return (
    <>
      <PageHeader title="Property Value Estimator" description="Describe a property block and get a model-based price estimate." />
      <EstimatorClient initialHistory={history} />
    </>
  );
}
