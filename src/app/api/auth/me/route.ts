/**
 * GET /api/auth/me
 *
 * Returns the current user (id, email, role) for client components — navbar,
 * client-side guards, role hooks. Public (under /api/auth) so it also works on
 * marketing pages where the visitor may be signed out; verifies the session
 * token's signature against ae-platform's JWKS before trusting it.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import { SESSION_COOKIE } from "@/lib/session";
import { profiles, userRoles } from "@/lib/db";
import type { AppRole } from "@/lib/rbac-server";

export const dynamic = "force-dynamic";

const ISSUER = (process.env.AE_AUTH_ISSUER ?? "").replace(/\/$/, "");
let _jwks: JWTVerifyGetKey | null = null;
function jwks(): JWTVerifyGetKey {
  if (!_jwks) _jwks = createRemoteJWKSet(new URL(`${ISSUER}/auth/jwks`));
  return _jwks;
}

const RANK: Record<AppRole, number> = { owner: 4, admin: 3, member: 2, viewer: 1 };

export async function GET() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ user: null });

  let sub: string;
  try {
    const { payload } = await jwtVerify(token, jwks(), { issuer: ISSUER });
    if (typeof payload.sub !== "string") return NextResponse.json({ user: null });
    sub = payload.sub;
  } catch {
    return NextResponse.json({ user: null });
  }

  const [profile, roles] = await Promise.all([profiles.get(sub), userRoles.forUser(sub)]);
  const globalRoles = roles.filter((r) => r.org_id == null).map((r) => r.role as AppRole);
  const role = globalRoles.length
    ? globalRoles.reduce((a, b) => (RANK[b] > RANK[a] ? b : a))
    : null;

  return NextResponse.json({
    user: {
      id: sub,
      email: profile?.email ?? null,
      display_name: profile?.display_name ?? null,
      role,
    },
  });
}
