import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex">
      <aside className="w-56 shrink-0 px-4 py-6" style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white block mb-8">{"{{APP_NAME}}"}</Link>
        <nav className="space-y-1">
          {[
            { label: "My Posts", href: "/dashboard" },
            { label: "Settings", href: "/dashboard/settings" },
          ].map(n => (
            <Link key={n.href} href={n.href} className="block rounded-lg px-3 py-2 text-sm text-white/40 hover:text-white hover:bg-white/5">{n.label}</Link>
          ))}
        </nav>
        <div className="mt-8 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <Link href="/feed" className="block rounded-lg px-3 py-2 text-sm text-white/25 hover:text-white/50">Browse {"{{POST_NOUN_PLURAL}}"}</Link>
          <Link href="/upgrade" className="block rounded-lg px-3 py-2 text-sm text-white/25 hover:text-white/50">Upgrade</Link>
        </div>
        <form action="/auth/signout" method="POST" className="mt-auto pt-8">
          <button type="submit" className="text-xs text-white/20 hover:text-white/40">Sign Out</button>
        </form>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
