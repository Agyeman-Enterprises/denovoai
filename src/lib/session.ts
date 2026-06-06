/**
 * Server-side session accessor for AE Design Studio.
 *
 * The OIDC access token (issued by ae-platform) is stored in the `ae_session`
 * httpOnly cookie by /auth/callback. The middleware (proxy.ts) verifies the
 * token's signature + expiry against ae-platform's JWKS on every protected
 * request, so by the time a server component or route handler runs, the cookie
 * is trusted — we only need to read the `sub` claim out of it for query scoping.
 *
 * Every data repo requires a userId; this is where that id comes from.
 */
import { cookies } from "next/headers";
import { decodeJwt } from "jose";

export const SESSION_COOKIE = "ae_session";

export class UnauthorizedError extends Error {
  constructor() {
    super("unauthorized");
    this.name = "UnauthorizedError";
  }
}

export interface SessionUser {
  id: string;            // OIDC sub
  email?: string;
}

/** Returns the current user (sub + email) or null if not signed in. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const claims = decodeJwt(token);
    if (typeof claims.sub !== "string") return null;
    return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : undefined };
  } catch {
    return null;
  }
}

/** Returns the current user id, or throws UnauthorizedError. Use in protected routes. */
export async function requireUserId(): Promise<string> {
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  return user.id;
}

/** Convenience for route handlers: 401 JSON helper. */
export function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
