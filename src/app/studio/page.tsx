"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ChatMessage } from "@/types/denovo";
import Link from "next/link";

const orange = "#F5530A";
const bg = "#08080D";
const cardBg = "#0F0F18";
const border = "rgba(255,255,255,0.07)";
const muted = "rgba(255,255,255,0.4)";

const SUGGESTIONS = [
  "An e-commerce store for handmade jewelry with Stripe payments",
  "A fitness tracking app with workout logs and progress charts",
  "A restaurant booking system with table management",
  "A SaaS dashboard for freelancers to manage clients and invoices",
  "A community platform with membership tiers and gated content",
];

export default function StudioPage() {
  const router = useRouter();
  const [sessionId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! Tell me about the app you want to build.\nWhat does it do, and who is it for?", timestamp: new Date().toISOString() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<string>("intake");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  // Auth is enforced by middleware (proxy.ts) — no client-side check needed.

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage: ChatMessage = { role: "user", content: input.trim(), timestamp: new Date().toISOString() };
    setMessages(p => [...p, userMessage]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/denovo/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: userMessage.content }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages(p => [...p, { role: "assistant", content: `Error: ${data.error}`, timestamp: new Date().toISOString() }]);
      } else {
        setMessages(p => [...p, { role: "assistant", content: data.message, timestamp: new Date().toISOString() }]);
        if (data.stage) setStage(data.stage);
        if (data.stage === "confirming") setTimeout(() => router.push(`/studio/${sessionId}/design`), 1500);
      }
    } catch {
      setMessages(p => [...p, { role: "assistant", content: "Something went wrong. Please try again.", timestamp: new Date().toISOString() }]);
    }
    setLoading(false);
  };

  const isFirst = messages.length === 1;

  return (
    <div style={{ minHeight: "100svh", background: bg, color: "#fff", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 clamp(20px,4vw,40px)", height: 56, borderBottom: `1px solid ${border}`, background: "rgba(8,8,13,0.9)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 40, flexShrink: 0 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: orange, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: "#fff" }}>AE</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>AE Studio</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/dashboard" style={{ fontSize: 13, color: muted, textDecoration: "none" }}>Dashboard</Link>
          <Link href="/studio" style={{ background: orange, color: "#fff", padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>New Project</Link>
        </div>
      </header>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "clamp(24px,5vw,48px) clamp(20px,4vw,40px)" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>

          {/* First message / hero prompt area */}
          {isFirst && (
            <div style={{ marginBottom: 40 }}>
              <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>
                What do you want to build?
              </h1>
              <p style={{ fontSize: 14, color: muted, marginBottom: 32 }}>
                Describe your idea in plain English. The more detail, the better the proposal.
              </p>
              {/* Suggestion chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => setInput(s)} style={{ padding: "8px 14px", borderRadius: 100, border: `1px solid ${border}`, background: "rgba(255,255,255,0.02)", color: muted, fontSize: 12, cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={e => { (e.currentTarget.style.borderColor = "rgba(245,83,10,0.35)"); (e.currentTarget.style.color = "rgba(255,255,255,0.7)"); }}
                    onMouseLeave={e => { (e.currentTarget.style.borderColor = border); (e.currentTarget.style.color = muted); }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat messages */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                {msg.role === "assistant" && (
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: orange, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10, flexShrink: 0, alignSelf: "flex-start", marginTop: 2 }}>
                    <span style={{ fontSize: 8, fontWeight: 800, color: "#fff" }}>AE</span>
                  </div>
                )}
                <div style={{
                  maxWidth: "80%", padding: "12px 16px", borderRadius: msg.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                  background: msg.role === "user" ? orange : cardBg,
                  border: msg.role === "user" ? "none" : `1px solid ${border}`,
                  fontSize: 14, lineHeight: 1.65, color: msg.role === "user" ? "#fff" : "rgba(255,255,255,0.75)",
                  whiteSpace: "pre-wrap",
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: orange, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 8, fontWeight: 800, color: "#fff" }}>AE</span>
                </div>
                <div style={{ padding: "12px 16px", borderRadius: "12px 12px 12px 4px", background: cardBg, border: `1px solid ${border}`, display: "flex", gap: 5 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: orange, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div style={{ borderTop: `1px solid ${border}`, background: "rgba(8,8,13,0.95)", padding: "16px clamp(20px,4vw,40px)", backdropFilter: "blur(10px)", flexShrink: 0 }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", gap: 12 }}>
          <input
            data-testid="describe-the-app-you-want-to-build-input"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Describe the app you want to build..."
            disabled={loading || stage === "confirming"}
            style={{ flex: 1, padding: "12px 16px", borderRadius: 10, background: cardBg, border: `1px solid ${border}`, color: "#fff", fontSize: 14, outline: "none", fontFamily: "inherit" }}
            onFocus={e => (e.target.style.borderColor = "rgba(245,83,10,0.4)")}
            onBlur={e => (e.target.style.borderColor = border)}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim() || stage === "confirming"}
            style={{ padding: "12px 24px", borderRadius: 10, background: !input.trim() || loading ? "rgba(245,83,10,0.3)" : orange, color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: !input.trim() || loading ? "not-allowed" : "pointer", flexShrink: 0 }}
          >
            Send
          </button>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:0.3}50%{opacity:1}}`}</style>
    </div>
  );
}
