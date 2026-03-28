import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"}</Link>
        <div className="flex gap-4 text-sm">
          <Link href="/dashboard" className="text-white/40 hover:text-white">Overview</Link>
          <Link href="/dashboard/orders" className="text-white/40 hover:text-white">Orders</Link>
          <Link href="/dashboard/listings" className="text-white/40 hover:text-white">Listings</Link>
          <Link href="/dashboard/earnings" className="text-white/40 hover:text-white">Earnings</Link>
          <Link href="/dashboard/settings" className="text-white/40 hover:text-white">Settings</Link>
        </div>
      </nav>
      <main className="p-6 max-w-5xl mx-auto">{children}</main>
    </div>
  );
}
