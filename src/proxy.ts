import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

type CookieToSet = { name: string; value: string; options?: Partial<ResponseCookie> };

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          // Mirror session cookies to the current request so any subsequent
          // Supabase calls in this middleware pass see the refreshed session.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            const safeOptions: Partial<ResponseCookie> = { ...options };
            const validSameSite = ["strict", "lax"] as const;
            type ValidSameSite = (typeof validSameSite)[number];
            const ss = safeOptions.sameSite as string | undefined;
            safeOptions.sameSite = (
              validSameSite.includes(ss as ValidSameSite) ? ss : "lax"
            ) as ValidSameSite;
            supabaseResponse.cookies.set(name, value, safeOptions);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/";

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export async function proxy(request: NextRequest) {
  return updateSession(request);
}
