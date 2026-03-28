import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#06060f]">
      <nav className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div className="flex gap-6 text-sm">
          <Link href="/admin" className="text-white/60 hover:text-white">Overview</Link>
          <Link href="/admin/users" className="text-white/60 hover:text-white">Users</Link>
          <Link href="/admin/content" className="text-white/60 hover:text-white">Content</Link>
          <Link href="/admin/logs" className="text-white/60 hover:text-white">Audit Log</Link>
        </div>
        <Link href="/dashboard" className="text-xs text-white/25 hover:text-white/40">Back to App</Link>
      </nav>
      <main className="p-6 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
