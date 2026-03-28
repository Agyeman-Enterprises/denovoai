import { Navbar } from "@/components/navbar";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="mt-2 text-sm text-white/40">Last updated: March 2026</p>

          <div className="mt-10 space-y-8 text-sm leading-relaxed text-white/60">
            <div>
              <h2 className="text-lg font-semibold text-white/80">Information We Collect</h2>
              <p className="mt-3">We collect information you provide directly (name, email, payment information) and information generated through your use of the service (usage data, application configurations, generated code metadata).</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/80">How We Use Your Information</h2>
              <p className="mt-3">We use your information to provide, maintain, and improve our services, process payments, communicate with you about your account, and comply with legal obligations.</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/80">Third-Party Services</h2>
              <p className="mt-3">We use third-party services for payment processing (Stripe), authentication (Supabase), hosting infrastructure, and analytics. Each operates under their own privacy policies.</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/80">Your Rights</h2>
              <p className="mt-3">You may request access to, correction of, or deletion of your personal data by contacting us. We will respond within 30 days of receiving your request.</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/80">Compliance Disclaimer</h2>
              <p className="mt-3">DeNovo provides software generation, hosting, and operational services and does not provide legal, tax, accounting, regulatory, security certification, or compliance advice. Standard plans are not intended for regulated healthcare, financial, insurance, money transmission, or other high-compliance use cases unless explicitly contracted.</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/80">Contact</h2>
              <p className="mt-3">For privacy inquiries, contact privacy@denovoai.co.</p>
            </div>
          </div>
          <p className="mt-12 text-xs text-white/25"><Link href="/" className="hover:text-white/40">Back to home</Link></p>
        </div>
      </main>
    </>
  );
}
