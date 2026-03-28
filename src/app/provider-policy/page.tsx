import { Navbar } from "@/components/navbar";
import Link from "next/link";

export default function ProviderPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold">BYO Provider Policy</h1>
          <p className="mt-2 text-sm text-white/40">Last updated: March 2026</p>

          <div className="mt-10 text-sm leading-relaxed text-white/60">
            <p>DeNovo may require that certain third-party services be provisioned, owned, or controlled by Customer, including domains, payment processors, transactional email providers, messaging providers, databases, storage services, and external APIs.</p>

            <h3 className="mt-8 text-base font-semibold text-white/80">Always customer-owned</h3>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Primary domain</li>
              <li>Payment processor / merchant account</li>
              <li>Brand assets</li>
            </ul>

            <h3 className="mt-6 text-base font-semibold text-white/80">Customer-owned preferred</h3>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Transactional email provider</li>
              <li>Messaging / SMS provider</li>
              <li>Database project</li>
              <li>External API vendors with recurring usage costs</li>
            </ul>

            <h3 className="mt-6 text-base font-semibold text-white/80">DeNovo-managed within quotas</h3>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Email relay (within monthly quota)</li>
              <li>Standard monitoring</li>
              <li>Standard backups</li>
              <li>Low-volume shared services</li>
            </ul>

            <p className="mt-6">DeNovo may require migration from DeNovo-managed to customer-owned services where usage, abuse risk, compliance burden, or variable cost materially exceeds standard plan assumptions.</p>
          </div>
          <p className="mt-12 text-xs text-white/25"><Link href="/" className="hover:text-white/40">Back to home</Link></p>
        </div>
      </main>
    </>
  );
}
