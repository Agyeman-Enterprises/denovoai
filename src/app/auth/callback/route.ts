/**
 * GET /auth/callback
 *
 * OIDC redirect target. Verifies `state` against the cookie set by /auth/login,
 * exchanges the code (+ PKCE verifier) for tokens, fetches userinfo for the
 * email, JIT-provisions this app's own profile + subscription rows (keyed on
 * the OIDC `sub`), then sets the `ae_session` (access token) cookie and
 * redirects to the originally requested page.
 */
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeCode,
  fetchUserInfo,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  OAUTH_RETURN_COOKIE,
  REFRESH_COOKIE,
} from "@/lib/oidc";
import { SESSION_COOKIE } from "@/lib/session";
import { profiles, subscriptions } from "@/lib/db";

export const dynamic = "force-dynamic";

function clearTemp(res: NextResponse) {
  for (const name of [OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE, OAUTH_RETURN_COOKIE]) {
    res.cookies.set(name, "", { path: "/", maxAge: 0 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  // Behind the Traefik/tunnel proxy, request.url's origin is the internal
  // container host. Build browser redirects on the public app URL instead.
  const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.AE_INTERNAL_URL || origin).replace(/\/$/, "");
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const jar = await cookies();
  const expectedState = jar.get(OAUTH_STATE_COOKIE)?.value;
  const verifier = jar.get(OAUTH_VERIFIER_COOKIE)?.value;
  const next = jar.get(OAUTH_RETURN_COOKIE)?.value || "/dashboard";

  const fail = (reason: string) => {
    const r = NextResponse.redirect(`${base}/auth/login?error=${encodeURIComponent(reason)}`);
    clearTemp(r);
    return r;
  };

  if (oauthError) return fail(oauthError);
  if (!code || !state || !expectedState || !verifier) return fail("missing_params");
  if (state !== expectedState) return fail("state_mismatch");

  let accessToken: string;
  let refreshToken: string | undefined;
  let expiresIn: number;
  try {
    const tokens = await exchangeCode(code, verifier);
    const info = await fetchUserInfo(tokens.access_token);
    // JIT-provision this app's own rows, keyed on the OIDC sub.
    await profiles.upsert({
      id: info.sub,
      email: info.email ?? null,
      display_name: info.name ?? null,
    });
    await subscriptions.ensure(info.sub);
    accessToken = tokens.access_token;
    refreshToken = tokens.refresh_token;
    expiresIn = tokens.expires_in;
  } catch {
    return fail("exchange_failed");
  }

  const res = NextResponse.redirect(`${base}${next.startsWith("/") ? next : "/dashboard"}`);
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(SESSION_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: expiresIn,
  });
  if (refreshToken) {
    res.cookies.set(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  clearTemp(res);
  return res;
}
