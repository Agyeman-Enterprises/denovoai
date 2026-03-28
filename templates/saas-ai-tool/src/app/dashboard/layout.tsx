import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("usage_count, usage_limit, plan_id")
    .eq("user_id", user.id)
    .single();

  const usagePercent = sub ? Math.min(100, Math.round((sub.usage_count / sub.usage_limit) * 100)) : 0;

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"}</Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="text-white/40 hover:text-white">{"{{PRIMARY_ENTITY_PLURAL}}"}</Link>
          <Link href="/dashboard/billing" className="text-white/40 hover:text-white">Billing</Link>
          <Link href="/dashboard/settings" className="text-white/40 hover:text-white">Settings</Link>
          <div className="flex items-center gap-2 ml-4">
            <div className="h-1.5 w-16 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${usagePercent}%`, background: usagePercent >= 90 ? "#ef4444" : "#7C3AED" }} />
            </div>
            <span className="text-xs text-white/30">{sub?.usage_count || 0}/{sub?.usage_limit || 0}</span>
          </div>
        </div>
      </nav>
      <main className="p-6 max-w-5xl mx-auto">{children}</main>
    </div>
  );
}
