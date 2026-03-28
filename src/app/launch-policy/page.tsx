import { Navbar } from "@/components/navbar";
import Link from "next/link";

export default function LaunchPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold">Launch Policy</h1>
          <p className="mt-2 text-sm text-white/40">Last updated: March 2026</p>

          <div className="mt-10 space-y-10 text-sm leading-relaxed text-white/60">
            <div>
              <h2 className="text-lg font-semibold text-white/80">Launch Scope and Exclusions</h2>
              <p className="mt-3">Standard Launch includes hosting, monitoring, backups, and routine operational support for ordinary commercial software workloads.</p>
              <p className="mt-3">Standard Launch does not include, unless expressly agreed in writing: regulated healthcare or financial workloads, custom data residency or compliance obligations, dedicated infrastructure, unlimited communications or storage, or custom legal review.</p>
              <p className="mt-3">DeNovo may suspend, restrict, or require migration of any workload that exceeds the scope of Standard Launch.</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/80">Ancillary Services and Billing</h2>
              <p className="mt-3">Certain services may be billed separately from Build and Launch fees, including transactional email, SMS, storage, bandwidth, webhook volume, external API usage, premium backups, premium monitoring, and third-party fees.</p>
              <p className="mt-3">These may be subject to quotas, metered usage, pass-through charges, or overage fees. DeNovo may throttle or require upgrades where usage materially exceeds standard plan assumptions.</p>
            </div>
          </div>
          <p className="mt-12 text-xs text-white/25"><Link href="/" className="hover:text-white/40">Back to home</Link></p>
        </div>
      </main>
    </>
  );
}
