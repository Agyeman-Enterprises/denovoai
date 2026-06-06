/**
 * POST /auth/signout — clears the local session cookies and returns to home.
 *
 * The ae-platform session (refresh token) is dropped locally; the access token
 * is short-lived and expires on its own. (A platform-side revoke endpoint can
 * be wired later if global single-logout is needed.)
 */
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";
import { REFRESH_COOKIE } from "@/lib/oidc";

export async function POST(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.AE_INTERNAL_URL || origin).replace(/\/$/, "");
  const res = NextResponse.redirect(`${base}/`, { status: 302 });
  for (const name of [SESSION_COOKIE, REFRESH_COOKIE]) {
    res.cookies.set(name, "", { path: "/", maxAge: 0 });
  }
  return res;
}
