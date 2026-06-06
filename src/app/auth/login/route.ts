/**
 * GET /auth/login
 *
 * Entry point for sign-in. Starts the OIDC auth-code + PKCE flow: mints a
 * `state` and PKCE `code_verifier`, stashes them in short-lived httpOnly
 * cookies, then redirects the browser to ae-platform's /auth/authorize.
 * ae-platform renders the login UI and redirects back to /auth/callback.
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  buildAuthorizeUrl,
  pkceChallenge,
  randomToken,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  OAUTH_RETURN_COOKIE,
} from "@/lib/oidc";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next") ?? "/dashboard";
  const state = randomToken();
  const verifier = randomToken();
  const challenge = pkceChallenge(verifier);

  const res = NextResponse.redirect(buildAuthorizeUrl(state, challenge));

  const secure = process.env.NODE_ENV === "production";
  const base = {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600, // 10 min — the user must complete login within this window
  };
  res.cookies.set(OAUTH_STATE_COOKIE, state, base);
  res.cookies.set(OAUTH_VERIFIER_COOKIE, verifier, base);
  // Only allow same-origin relative return paths (avoid open-redirect).
  res.cookies.set(OAUTH_RETURN_COOKIE, next.startsWith("/") ? next : "/dashboard", base);
  return res;
}
