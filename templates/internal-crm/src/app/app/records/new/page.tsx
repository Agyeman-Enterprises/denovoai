"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewRecordPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("New Lead");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, status, priority }),
    });
    if (res.ok) router.push("/app/records");
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">New {"{{PRIMARY_ENTITY}}"}</h1>
      <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
        <div>
          <label className="block text-xs text-white/40 mb-1">Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
            className="w-full rounded-xl px-4 py-2.5 text-sm text-white"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm text-white"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <option>New Lead</option><option>Contacted</option><option>Qualified</option>
            <option>Proposal Sent</option><option>Closed Won</option><option>Closed Lost</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Priority</label>
          <select value={priority} onChange={e => setPriority(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm text-white"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <option value="low">Low</option><option value="medium">Medium</option>
            <option value="high">High</option><option value="urgent">Urgent</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ background: "#1E40AF" }}>
          {loading ? "Creating..." : "Create"}
        </button>
      </form>
    </div>
  );
}
