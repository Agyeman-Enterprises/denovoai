import { Navbar } from "@/components/navbar";
import Link from "next/link";

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="mt-2 text-sm text-white/40">Last updated: March 2026</p>

          <div className="mt-10 space-y-10 text-sm leading-relaxed text-white/60">
            <Section title="1. Launch Scope and Exclusions">
              <p>Standard Launch includes hosting, monitoring, backups, and routine operational support for ordinary commercial software workloads.</p>
              <p className="mt-3">Standard Launch does not include, and Customer may not use Standard Launch for, unless expressly agreed in writing:</p>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>regulated healthcare workloads involving protected health information</li>
                <li>regulated financial, insurance, lending, custody, advisory, or money transmission workflows</li>
                <li>custom data residency, retention, audit, or compliance obligations</li>
                <li>dedicated or isolated infrastructure</li>
                <li>unlimited or unmetered email, SMS, storage, bandwidth, webhooks, or third-party API usage</li>
                <li>custom legal, regulatory, or compliance review</li>
                <li>unlawful, deceptive, abusive, or high-risk use cases as determined by DeNovo acting reasonably</li>
              </ul>
              <p className="mt-3">DeNovo may suspend, restrict, reclassify, or require migration of any workload that exceeds the operational, legal, security, or compliance scope of Standard Launch.</p>
            </Section>

            <Section title="2. Ancillary Services and Billing">
              <p>Certain services associated with a generated, hosted, or operated application may be billed separately from Build and Launch fees. Such services may include:</p>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>transactional email</li>
                <li>SMS or messaging services</li>
                <li>file storage</li>
                <li>bandwidth or egress</li>
                <li>webhook volume</li>
                <li>external API relay or proxy usage</li>
                <li>premium backups</li>
                <li>premium monitoring or SLA coverage</li>
                <li>third-party software and infrastructure fees</li>
              </ul>
              <p className="mt-3">Ancillary services may be subject to quotas, metered usage, pass-through charges, or overage fees.</p>
            </Section>

            <Section title="3. Acceptable Use">
              <p>Customer shall not use the Services or any application generated, deployed, or operated through the Services to:</p>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>transmit spam, malware, or abusive communications</li>
                <li>host unlawful, infringing, deceptive, or harmful content</li>
                <li>facilitate fraud, impersonation, harassment, or unauthorized surveillance</li>
                <li>circumvent quotas, rate limits, billing controls, or technical protections</li>
                <li>interfere with DeNovo systems, shared infrastructure, or other customer environments</li>
                <li>use shared services in a manner that harms sender reputation, degrades service quality, or creates abnormal operational risk</li>
                <li>process regulated data or operate regulated workflows outside the scope of Customer{"'"}s contracted plan</li>
              </ul>
            </Section>

            <Section title="4. Ownership and Intellectual Property">
              <p>Subject to Customer{"'"}s payment of all amounts due, Customer owns the specific code delivered to Customer through Build plans, excluding DeNovo{"'"}s pre-existing intellectual property, including without limitation DeNovo{"'"}s platform materials, generalized templates, tooling, orchestration systems, methods, know-how, and infrastructure.</p>
              <p className="mt-3">Customer retains ownership of its business data, domains, branding assets, and customer-facing content.</p>
              <p className="mt-3">For Launch plans: infrastructure components may be customer-owned or DeNovo-managed depending on the applicable configuration. Customer may be required to maintain customer-owned domains, payment processor accounts, email providers, messaging providers, databases, or external APIs.</p>
            </Section>

            <Section title="5. Compliance Disclaimer">
              <p>DeNovo provides software generation, hosting, and operational services and does not provide legal, tax, accounting, regulatory, security certification, or compliance advice.</p>
              <p className="mt-3">Customer is solely responsible for determining whether its use case is subject to applicable laws or regulations, obtaining appropriate legal or regulatory advice, reviewing generated policies and disclosures, and ensuring that its actual business practices match the representations made in its applications.</p>
            </Section>

            <Section title="6. Suspension and Protection Rights">
              <p>DeNovo may implement quotas, caps, throttles, suspensions, or plan changes where reasonably necessary to prevent abuse, contain cost exposure, preserve shared infrastructure, protect sender reputation, satisfy provider requirements, or reduce legal, security, or compliance risk.</p>
            </Section>
          </div>

          <p className="mt-12 text-xs text-white/25"><Link href="/" className="hover:text-white/40">Back to home</Link></p>
        </div>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-white/80">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}
