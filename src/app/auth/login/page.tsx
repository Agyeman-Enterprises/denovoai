"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/navbar";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    if (mode === "signin") {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setError(err.message);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } else {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (err) {
        setError(err.message);
      } else {
        setInfo("Check your email to confirm your account, then sign in.");
        setMode("signin");
      }
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: "google" | "github") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <>
      <Navbar />
      <div className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="w-full max-w-sm">
          <div className="text-center">
            <h1 className="text-2xl font-bold">
              {mode === "signin" ? "Sign in to DeNovo" : "Create your account"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">Build and deploy apps with AI</p>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="w-full" onClick={() => handleOAuth("google")}>
                Continue with Google
              </Button>
              <Button variant="outline" className="w-full" onClick={() => handleOAuth("github")}>
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

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium">Email address</label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="password" className="text-sm font-medium">
                  {mode === "signup" ? "Create a password" : "Password"}
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              {info && <p className="text-xs text-muted-foreground">{info}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              {mode === "signin" ? (
                <>
                  No account?{" "}
                  <button
                    type="button"
                    className="underline hover:text-foreground"
                    onClick={() => { setMode("signup"); setError(""); setInfo(""); }}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="underline hover:text-foreground"
                    onClick={() => { setMode("signin"); setError(""); setInfo(""); }}
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Back to home</Link>
          </p>
        </div>
      </div>
    </>
  );
}
