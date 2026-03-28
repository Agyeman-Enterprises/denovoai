import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "staff" && profile?.role !== "admin") redirect("/portal");

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/admin" className="text-lg font-bold text-white">{"{{APP_NAME}}"} <span className="text-xs text-white/30">Staff</span></Link>
        <div className="flex gap-4 text-sm">
          <Link href="/admin" className="text-white/40 hover:text-white">Overview</Link>
          <Link href="/admin/clients" className="text-white/40 hover:text-white">{"{{CLIENT_NOUN_PLURAL}}"}</Link>
          <Link href="/admin/projects" className="text-white/40 hover:text-white">{"{{SERVICE_NOUN_PLURAL}}"}</Link>
          <Link href="/admin/invoices" className="text-white/40 hover:text-white">Invoices</Link>
        </div>
      </nav>
      <main className="p-6 max-w-5xl mx-auto">{children}</main>
    </div>
  );
}
