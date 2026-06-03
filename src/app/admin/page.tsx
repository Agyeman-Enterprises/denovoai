import { sql } from '@/lib/db'

const orange = "#F5530A";
const cardBg = "#0F0F18";
const border = "rgba(255,255,255,0.07)";
const muted = "rgba(255,255,255,0.4)";

type RecentProject = { id: string; name: string; template: string; status: string; created_at: string };
type RecentUser = { user_id: string; role: string; created_at: string };

export default async function AdminDashboardPage() {
  const [userCountRows, projectCountRows, recentProjects, recentUsers] = await Promise.all([
    sql<{ count: number }[]>`SELECT count(*)::int AS count FROM user_roles`,
    sql<{ count: number }[]>`SELECT count(*)::int AS count FROM apps`,
    sql<RecentProject[]>`SELECT id, name, template, status, created_at FROM apps ORDER BY created_at DESC LIMIT 5`,
    sql<RecentUser[]>`SELECT user_id, role, created_at FROM user_roles ORDER BY created_at DESC LIMIT 5`,
  ])
  const userCount = userCountRows[0]?.count ?? 0
  const projectCount = projectCountRows[0]?.count ?? 0

  const STATUS_COLOR: Record<string, string> = {
    live: "#34d399", assembling: orange, deploying: orange,
    parsing: muted, confirming: muted, downloaded: "#a78bfa", failed: "#f87171",
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 6px" }}>Admin Panel</h1>
        <p style={{ fontSize: 13, color: muted, margin: 0 }}>Platform overview and management</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 40 }}>
        {[
          { label: "Users", value: userCount ?? 0, icon: "👤" },
          { label: "Projects", value: projectCount ?? 0, icon: "⚡" },
          { label: "Active Builds", value: recentProjects?.filter(p => ["assembling","deploying"].includes(p.status)).length ?? 0, icon: "🔨" },
        ].map(stat => (
          <div key={stat.label} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: "20px 24px" }}>
            <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, fontWeight: 600, marginBottom: 8 }}>{stat.label}</p>
            <p style={{ fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-0.04em", color: "#fff", margin: 0 }}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Recent projects */}
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: `1px solid ${border}` }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Recent Projects</h2>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Name","Type","Status","Created"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(recentProjects || []).length === 0 ? (
                <tr><td colSpan={4} style={{ padding: "24px 16px", textAlign: "center", fontSize: 13, color: muted }}>No projects yet</td></tr>
              ) : recentProjects!.map(p => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${border}` }}>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#fff", fontWeight: 500 }}>{p.name || "Untitled"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: muted }}>{p.template || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: STATUS_COLOR[p.status] || muted, textTransform: "capitalize" }}>{p.status}</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: muted }}>{new Date(p.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent users */}
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: `1px solid ${border}` }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Users</h2>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["User ID","Role","Joined"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(recentUsers || []).length === 0 ? (
                <tr><td colSpan={3} style={{ padding: "24px 16px", textAlign: "center", fontSize: 13, color: muted }}>No users yet</td></tr>
              ) : recentUsers!.map(u => (
                <tr key={u.user_id} style={{ borderBottom: `1px solid ${border}` }}>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: muted, fontFamily: "monospace" }}>{u.user_id.slice(0, 14)}…</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: u.role === "admin" || u.role === "owner" ? `rgba(245,83,10,0.12)` : "rgba(255,255,255,0.05)", color: u.role === "admin" || u.role === "owner" ? orange : muted }}>{u.role}</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: muted }}>{new Date(u.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
