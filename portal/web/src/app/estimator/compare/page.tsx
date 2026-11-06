import type { Metadata } from "next";
import { CompareView } from "@/components/CompareView";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Compare properties" };

export default function ComparePage() {
  return (
    <>
      <PageHeader title="Compare properties" description="Properties you add from the estimator appear here side by side." />
      <CompareView />
    </>
  );
}
