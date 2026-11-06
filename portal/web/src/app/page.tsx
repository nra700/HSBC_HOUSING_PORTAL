import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { estimatorServer, marketServer } from "@/lib/server-api";

export const dynamic = "force-dynamic";

async function status(p: Promise<unknown>) {
  try { await p; return true; } catch { return false; }
}

export default async function Home() {
  const [estimator, market] = await Promise.all([status(estimatorServer.health()), status(marketServer.health())]);
  const apps = [
    { href: "/estimator", title: "Property Value Estimator", stack: "Next.js · Python / FastAPI", up: estimator,
      text: "Enter a property, get a price estimate, review your history and compare properties side by side." },
    { href: "/market", title: "Property Market Analysis", stack: "Next.js · Java / Spring Boot", up: market,
      text: "Explore market segments, filter and export data, and run what-if scenarios against the model." },
  ];
  return (
    <>
      <PageHeader title="Housing Portal" description="Two independent applications, two backend stacks, one shared machine-learning model." />
      <div className="grid gap-4 md:grid-cols-2">
        {apps.map((a) => (
          <Link key={a.href} href={a.href} className="group block rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-600 hover:shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700">
            <h2 className="text-lg font-semibold group-hover:text-brand-800">{a.title}</h2>
            <p className="mt-1 text-xs font-medium text-slate-600">{a.stack}</p>
            <p className="mt-3 text-slate-700">{a.text}</p>
            <p className={a.up ? "mt-4 text-sm font-medium text-green-800" : "mt-4 text-sm font-medium text-red-700"}>
              {a.up ? "● Backend online" : "● Backend unreachable"}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
