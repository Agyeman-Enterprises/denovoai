import { Navbar } from "@/components/navbar";
import Link from "next/link";

export default function SecurityPage() {
  return (
    <>
      <Navbar />
      <main className="px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold">Security</h1>
          <p className="mt-2 text-sm text-white/40">Last updated: March 2026</p>

          <div className="mt-10 space-y-8 text-sm leading-relaxed text-white/60">
            <div>
              <h2 className="text-lg font-semibold text-white/80">Infrastructure</h2>
              <p className="mt-3">Applications are deployed on isolated container infrastructure with automated backups, monitoring, and SSL/TLS encryption in transit.</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/80">Authentication</h2>
              <p className="mt-3">All authentication is handled through industry-standard protocols including OAuth 2.0, magic links, and password-based auth with bcrypt hashing. Session tokens are HTTP-only, secure, and SameSite-protected.</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/80">Data Protection</h2>
              <p className="mt-3">Row-level security is enforced at the database level. All API endpoints verify authentication and authorization before processing requests.</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/80">Payment Security</h2>
              <p className="mt-3">All payment processing is handled by Stripe. DeNovo never stores, processes, or transmits raw payment card data.</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/80">Reporting Vulnerabilities</h2>
              <p className="mt-3">To report a security vulnerability, contact security@denovoai.co.</p>
            </div>
          </div>
          <p className="mt-12 text-xs text-white/25"><Link href="/" className="hover:text-white/40">Back to home</Link></p>
        </div>
      </main>
    </>
  );
}
