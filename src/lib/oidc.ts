/**
 * OIDC client helpers for authenticating against ae-platform (ae-auth).
 *
 * Used by the auth route handlers (Node runtime — uses node:crypto). The
 * middleware (proxy.ts, Edge runtime) does JWKS verification with `jose`
 * directly and does NOT import this file.
 *
 * Flow: auth-code + PKCE (S256). The ae-platform token endpoint does NOT
 * verify client_secret on the authorization_code grant — PKCE is the
 * protection — so the login redirect MUST send a code_challenge and the
 * callback MUST send the matching code_verifier.
 *
 * Neither the access nor id token carries `email`; it is fetched from
 * /auth/userinfo with the access token.
 */
import { createHash, randomBytes } from "crypto";

function required(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`oidc: missing env ${key}`);
  return v;
}

export const oidcConfig = {
  get issuer() {
    return required("AE_AUTH_ISSUER").replace(/\/$/, "");
  },
  get clientId() {
    return required("AE_AUTH_CLIENT_ID");
  },
  get redirectUri() {
    return required("AE_AUTH_REDIRECT_URI");
  },
};

// Short-lived cookies that carry PKCE state across the redirect to ae-platform.
export const OAUTH_STATE_COOKIE = "ae_oauth_state";
export const OAUTH_VERIFIER_COOKIE = "ae_oauth_verifier";
export const OAUTH_RETURN_COOKIE = "ae_oauth_return";
export const REFRESH_COOKIE = "ae_refresh";

export interface TokenSet {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token: string;
  scope: string;
}

export interface OidcUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
}

/** base64url of a random 32-byte string — used for state and PKCE verifier. */
export function randomToken(): string {
  return randomBytes(32).toString("base64url");
}

/** PKCE S256: returns the challenge for a given verifier. */
export function pkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

/** Build the ae-platform /auth/authorize URL for the login redirect. */
export function buildAuthorizeUrl(state: string, codeChallenge: string): string {
  const u = new URL(`${oidcConfig.issuer}/auth/authorize`);
  u.searchParams.set("client_id", oidcConfig.clientId);
  u.searchParams.set("redirect_uri", oidcConfig.redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid profile email");
  u.searchParams.set("state", state);
  u.searchParams.set("code_challenge", codeChallenge);
  u.searchParams.set("code_challenge_method", "S256");
  return u.toString();
}

/** Exchange an authorization code (+ PKCE verifier) for tokens. */
export async function exchangeCode(code: string, codeVerifier: string): Promise<TokenSet> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: oidcConfig.clientId,
    redirect_uri: oidcConfig.redirectUri,
    code_verifier: codeVerifier,
  });
  const res = await fetch(`${oidcConfig.issuer}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`oidc: token exchange failed (${res.status}): ${detail}`);
  }
  return (await res.json()) as TokenSet;
}

/** Fetch the userinfo claims (email, name) for an access token. */
export async function fetchUserInfo(accessToken: string): Promise<OidcUserInfo> {
  const res = await fetch(`${oidcConfig.issuer}/auth/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`oidc: userinfo failed (${res.status}): ${detail}`);
  }
  return (await res.json()) as OidcUserInfo;
}
