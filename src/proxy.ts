/**
 * Auth middleware.
 *
 * Verifies the `ae_session` cookie (an ae-platform RS256 access token) against
 * ae-platform's JWKS on every protected request. Public marketing + auth routes
 * pass through. Unauthenticated requests to pages redirect to /auth/login;
 * to API routes they get a 401 JSON.
 *
 * Edge-compatible: uses only `jose` (no node:crypto). The remote JWKS is
 * fetched + cached by `createRemoteJWKSet`.
 */
import { type NextRequest, NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import { SESSION_COOKIE } from "@/lib/session";

const ISSUER = (process.env.AE_AUTH_ISSUER ?? "").replace(/\/$/, "");

let _jwks: JWTVerifyGetKey | null = null;
function jwks(): JWTVerifyGetKey {
  if (!_jwks) _jwks = createRemoteJWKSet(new URL(`${ISSUER}/auth/jwks`));
  return _jwks;
}

function isPublic(pathname: string): boolean {
  return (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/" ||
    pathname === "/pricing" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let valid = false;
  if (token) {
    try {
      await jwtVerify(token, jwks(), { issuer: ISSUER });
      valid = true;
    } catch {
      valid = false;
    }
  }

  if (valid) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return new NextResponse(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/auth/login";
  url.searchParams.set("next", pathname);
  const res = NextResponse.redirect(url);
  // Drop the stale/invalid session cookie so the next attempt is clean.
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

// Required by Next.js — the exported function must be named `middleware`
export { proxy as middleware };

// Exclude _next/static, _next/image, favicon, and public assets from auth checks
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|eot)$).*)",
  ],
};
