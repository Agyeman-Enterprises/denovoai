export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { apps } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { DashboardShell } from "@/components/dashboard-shell";
import type { AppStatus } from "@/types/db";

const orange = "#F5530A";
const cardBg = "#0F0F18";
const border = "rgba(255,255,255,0.07)";
const muted = "rgba(255,255,255,0.4)";

const STATUS_STYLE: Record<AppStatus, { bg: string; color: string; label: string }> = {
  parsing:    { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", label: "Draft" },
  confirming: { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", label: "Draft" },
  assembling: { bg: "rgba(245,83,10,0.12)",   color: orange,                  label: "Building" },
  deploying:  { bg: "rgba(245,83,10,0.12)",   color: orange,                  label: "Deploying" },
  live:       { bg: "rgba(52,211,153,0.12)",  color: "#34d399",               label: "Live" },
  downloaded: { bg: "rgba(139,92,246,0.12)",  color: "#a78bfa",               label: "Delivered" },
  failed:     { bg: "rgba(248,113,113,0.12)", color: "#f87171",               label: "Failed" },
};

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const list = await apps.listByUser(user.id);

  return (
    <DashboardShell>
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(32px,5vw,52px) clamp(20px,4vw,48px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>My Apps</h1>
            <p style={{ fontSize: 13, color: muted, margin: "4px 0 0" }}>Manage all your projects in one place</p>
          </div>
          <Link href="/studio" data-testid="nav-studio" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: orange, color: "#fff", padding: "10px 20px", borderRadius: 9, fontSize: 14, fontWeight: 700, textDecoration: "none", boxShadow: `0 0 20px rgba(245,83,10,0.2)` }}>
            <span style={{ fontSize: 16 }}>+</span> New Project
          </Link>
        </div>

        {list.length === 0 ? (
          <div style={{ textAlign: "center", padding: "clamp(60px,10vw,100px) 20px" }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(245,83,10,0.08)", border: `1px solid rgba(245,83,10,0.15)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 6v16M6 14h16" stroke={orange} strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: "0 0 8px" }}>No projects yet</h2>
            <p style={{ fontSize: 14, color: muted, margin: "0 0 28px", maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
              Describe your idea and we&apos;ll design and build it for you.
            </p>
            <Link href="/studio" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: orange, color: "#fff", padding: "12px 28px", borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none" }} data-testid="nav-studio">
              Build your first project
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {list.map((app) => {
              const s = STATUS_STYLE[app.status] || STATUS_STYLE.parsing;
              return (
                <Link key={app.id} href={`/dashboard/app/${app.id}`} style={{ textDecoration: "none" }}>
                  <div className="card-glow" style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: "20px 22px", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.3 }}>{app.name || "Untitled Project"}</h3>
                      <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, flexShrink: 0, marginLeft: 8 }}>{s.label}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "rgba(245,83,10,0.7)", fontWeight: 600, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{app.template || "App"}</p>
                    {app.status === "failed" && app.error_message && (
                      <p style={{ fontSize: 12, color: "#f87171", margin: "0 0 10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.error_message}</p>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: `1px solid ${border}` }}>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", margin: 0 }}>{new Date(app.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      {app.status === "live" && (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke={orange} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </DashboardShell>
  );
}
