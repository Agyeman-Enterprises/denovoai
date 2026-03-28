import { Navbar } from "@/components/navbar";
import Link from "next/link";

export default function AcceptableUsePage() {
  return (
    <>
      <Navbar />
      <main className="px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold">Acceptable Use Policy</h1>
          <p className="mt-2 text-sm text-white/40">Last updated: March 2026</p>

          <div className="mt-10 text-sm leading-relaxed text-white/60">
            <p>Customer shall not use the Services or any application generated, deployed, or operated through the Services to:</p>
            <ul className="mt-4 list-disc pl-5 space-y-2">
              <li>transmit spam, malware, or abusive communications</li>
              <li>host unlawful, infringing, deceptive, or harmful content</li>
              <li>facilitate fraud, impersonation, harassment, or unauthorized surveillance</li>
              <li>circumvent quotas, rate limits, billing controls, or technical protections</li>
              <li>interfere with DeNovo systems, shared infrastructure, or other customer environments</li>
              <li>use shared services in a manner that harms sender reputation, degrades service quality, or creates abnormal operational risk</li>
              <li>process regulated data or operate regulated workflows outside the scope of Customer{"'"}s contracted plan</li>
            </ul>
            <p className="mt-6">DeNovo may investigate suspected misuse and may suspend, throttle, remove content, disable functionality, or terminate access where reasonably necessary to protect DeNovo, its providers, other customers, or the public.</p>
          </div>
          <p className="mt-12 text-xs text-white/25"><Link href="/" className="hover:text-white/40">Back to home</Link></p>
        </div>
      </main>
    </>
  );
}
