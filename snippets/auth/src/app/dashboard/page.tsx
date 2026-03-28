import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user!.id)
    .single();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#06060f] px-4">
      <div className="w-full max-w-md rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-white/40">You are authenticated.</p>

        <div className="mt-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-white/40">Email</span>
            <span className="text-white/80">{user!.email}</span>
          </div>
          <div className="flex justify-between text-sm" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12 }}>
            <span className="text-white/40">User ID</span>
            <span className="text-white/50 font-mono text-xs">{user!.id.slice(0, 12)}...</span>
          </div>
          {profile && (
            <>
              <div className="flex justify-between text-sm" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12 }}>
                <span className="text-white/40">Display Name</span>
                <span className="text-white/80">{profile.display_name || "—"}</span>
              </div>
              <div className="flex justify-between text-sm" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12 }}>
                <span className="text-white/40">Role</span>
                <span className="text-white/80">{profile.role}</span>
              </div>
            </>
          )}
        </div>

        <form action="/auth/signout" method="POST" className="mt-8">
          <button
            type="submit"
            className="w-full rounded-xl py-3 text-sm font-medium text-white/60 transition-all hover:text-white"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
