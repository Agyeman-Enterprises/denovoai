"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const supabase = createClient();

  const handleSendCode = async () => {
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (err) setError(err.message);
    else setOtpSent(true);
    setLoading(false);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token: otpCode.trim(),
      type: "email",
    });
    if (err) setError(err.message);
    else window.location.href = "/dashboard";
    setLoading(false);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (mode === "signup") {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
      });
      if (err) setError(err.message);
      else window.location.href = "/dashboard";
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError(err.message);
      else window.location.href = "/dashboard";
    }
    setLoading(false);
  };

  if (otpSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#06060f] px-4">
        <div className="w-full max-w-sm rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-sm text-white/70 text-center">Enter the code sent to your email</p>
          <p className="mt-1 text-xs text-white/30 text-center">{email}</p>
          <form onSubmit={handleVerifyCode} className="mt-6 space-y-3">
            <input
              type="text"
              inputMode="numeric"
              placeholder="6-digit code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              required
              autoFocus
              className="w-full rounded-xl px-4 py-3 text-sm text-white text-center tracking-widest placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #7c3aed)" }}
            >
              {loading ? "..." : "Verify Code"}
            </button>
          </form>
          <button onClick={() => { setOtpSent(false); setOtpCode(""); setError(""); }} className="mt-4 w-full text-center text-xs text-violet-400 hover:text-violet-300">Back to login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#06060f] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#8B5CF6" }}>
            <span className="text-sm font-bold text-white">D</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Sign in to DeNovo</h1>
          <p className="mt-2 text-sm text-white/40">Build and deploy apps with AI</p>
        </div>

        <div className="mt-8 space-y-4">
          {/* Google OAuth */}
          <button
            onClick={handleGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-xl py-3 text-sm font-medium text-white/70 transition-all hover:text-white"
            style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} /></div>
            <div className="relative flex justify-center"><span className="bg-[#06060f] px-3 text-xs text-white/25">or</span></div>
          </div>

          {/* Email/Password form */}
          <form onSubmit={handleEmailPassword} className="space-y-3">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={mode === "signup" || (mode === "signin" && password.length > 0)}
                className="w-full rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30 hover:text-white/50"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #7c3aed)" }}
            >
              {loading ? "..." : mode === "signup" ? "Create Account" : "Sign In"}
            </button>
          </form>

          {/* Send code */}
          {email && mode === "signin" && (
            <button
              onClick={handleSendCode}
              disabled={loading}
              className="w-full rounded-xl py-2.5 text-xs font-medium text-violet-400 transition-all hover:text-violet-300"
              style={{ border: "1px solid rgba(139,92,246,0.2)" }}
            >
              Send verification code instead
            </button>
          )}

          {/* Toggle mode */}
          <p className="text-center text-xs text-white/30">
            {mode === "signin" ? (
              <>No account? <button onClick={() => setMode("signup")} className="text-violet-400 hover:text-violet-300">Sign up</button></>
            ) : (
              <>Already have an account? <button onClick={() => setMode("signin")} className="text-violet-400 hover:text-violet-300">Sign in</button></>
            )}
          </p>
        </div>

        <Link href="/" className="mt-8 block text-center text-xs text-white/20 hover:text-white/40">Back to home</Link>
      </div>
    </div>
  );
}
