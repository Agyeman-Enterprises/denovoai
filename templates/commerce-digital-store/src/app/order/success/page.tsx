import Link from "next/link";

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(16,185,129,0.15)" }}>
          <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 className="text-2xl font-bold">Order Confirmed!</h1>
        <p className="mt-3 text-sm text-white/40">Thank you for your purchase. Your order has been received.</p>
        <p className="mt-2 text-xs text-white/25">If you purchased a digital {"{{PRODUCT_NOUN}}"}, check your dashboard for download links.</p>
        <div className="mt-8 flex flex-col gap-3">
          <Link href="/dashboard" className="rounded-lg px-6 py-3 text-sm font-semibold text-white" style={{ background: "#8B5CF6" }}>
            Go to Dashboard
          </Link>
          <Link href="/shop" className="text-sm text-white/40 hover:text-white/70">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
