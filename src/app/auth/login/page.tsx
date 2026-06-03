"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

const orange = "#F5530A";
const bg = "#08080D";
const cardBg = "#0F0F18";
const border = "rgba(255,255,255,0.07)";
const muted = "rgba(255,255,255,0.4)";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) setError(err.message);
        else { router.push("/dashboard"); router.refresh(); }
      } else {
        if (password !== confirm) { setError("Passwords do not match."); setLoading(false); return; }
        const { error: err } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (err) setError(err.message);
        else { setInfo("Check your email to confirm your account, then sign in."); setMode("signin"); }
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: "google" | "github") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 14px", borderRadius: 8,
    background: "rgba(255,255,255,0.04)", border: `1px solid ${border}`,
    color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s",
  };
  const labelStyle: React.CSSProperties = { fontSize: 13, color: muted, marginBottom: 6, display: "block" };

  return (
    <div style={{ minHeight: "100svh", background: bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 40 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: orange, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>AE</span>
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Design Studio</span>
      </Link>

      {/* Card */}
      <div style={{ width: "100%", maxWidth: 400, background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: "36px 32px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", margin: "0 0 6px" }}>
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p style={{ fontSize: 13, color: muted, margin: "0 0 28px" }}>
          {mode === "signin" ? "Log in to your account" : "Sign up to get started"}
        </p>

        {/* OAuth */}
        <button
          onClick={() => handleOAuth("google")}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "11px 0", borderRadius: 9, background: "rgba(255,255,255,0.04)", border: `1px solid ${border}`, color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 500, cursor: "pointer", marginBottom: 8 }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
          <div style={{ flex: 1, height: 1, background: border }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>or</span>
          <div style={{ flex: 1, height: 1, background: border }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input data-testid="email-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={inputStyle} />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
              {mode === "signin" && <Link href="/auth/confirm" style={{ fontSize: 12, color: orange, textDecoration: "none" }}>Forgot password?</Link>}
            </div>
            <input data-testid="password-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} style={inputStyle} />
          </div>
          {mode === "signup" && (
            <div>
              <label style={labelStyle}>Confirm Password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={8} style={inputStyle} data-testid="password-input" />
            </div>
          )}

          {error && <p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>{error}</p>}
          {info && <p style={{ fontSize: 13, color: "#34d399", margin: 0 }}>{info}</p>}

          <button
            data-testid="submit-btn"
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "12px 0", borderRadius: 9, background: orange, color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, boxShadow: `0 0 20px rgba(245,83,10,0.25)`, marginTop: 4 }}
          >
            {loading ? "Please wait..." : mode === "signin" ? "Log in" : "Create account"}
          </button>
        </form>

        <p style={{ fontSize: 13, color: muted, textAlign: "center", marginTop: 20 }}>
          {mode === "signin" ? (
            <>Don&apos;t have an account?{" "}
              <button type="button" onClick={() => { setMode("signup"); setError(""); setInfo(""); }} style={{ background: "none", border: "none", color: orange, cursor: "pointer", fontSize: 13, fontWeight: 600, padding: 0 }}>Create one</button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button type="button" onClick={() => { setMode("signin"); setError(""); setInfo(""); }} style={{ background: "none", border: "none", color: orange, cursor: "pointer", fontSize: 13, fontWeight: 600, padding: 0 }}>Log in</button>
            </>
          )}
        </p>
      </div>

      <Link href="/" style={{ marginTop: 24, fontSize: 13, color: "rgba(255,255,255,0.2)", textDecoration: "none" }}>← Back to home</Link>
    </div>
  );
}
