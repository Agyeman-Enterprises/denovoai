"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/navbar";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });

    if (err) {
      setError(err.message);
    } else {
      window.location.href = "/dashboard";
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: "google" | "github") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <>
      <Navbar />
      <div className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="w-full max-w-sm">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Sign in to DeNovo</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Build and deploy apps with AI
            </p>
          </div>

          {sent ? (
            <div className="mt-8 space-y-4">
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-sm">Enter the code sent to your email</p>
                <p className="mt-1 text-xs text-muted-foreground">{email}</p>
              </div>
              <form onSubmit={handleVerifyCode} className="space-y-3">
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  required
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Verifying..." : "Verify"}
                </Button>
              </form>
              <button
                onClick={() => { setSent(false); setCode(""); setError(""); }}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                Back
              </button>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleOAuth("google")}
                >
                  Continue with Google
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleOAuth("github")}
                >
                  Continue with GitHub
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <form onSubmit={handleSendCode} className="space-y-3">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Code"}
                </Button>
              </form>
            </div>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Back to home</Link>
          </p>
        </div>
      </div>
    </>
  );
}
