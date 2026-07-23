import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Handles ?code= from Supabase verify redirects (default email templates).
 * Prefer /auth/confirm + token_hash templates for SSR reliability.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const nextParam = searchParams.get("next");
  const next =
    nextParam && nextParam.startsWith("/")
      ? nextParam
      : "/auth/update-password";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const fail = (message: string) => {
    const dest = request.nextUrl.clone();
    dest.pathname = "/login";
    dest.searchParams.set("error", message);
    return NextResponse.redirect(dest);
  };

  if (!url || !key) {
    return fail("Supabase env vars are missing. Restart the dev server.");
  }

  // token_hash links should use /auth/confirm; support them here too
  if (token_hash && type) {
    const dest = request.nextUrl.clone();
    dest.pathname = "/auth/confirm";
    // keep token_hash, type, next query params
    return NextResponse.redirect(dest);
  }

  if (!code) {
    const supabaseError = searchParams.get("error_description") ||
      searchParams.get("error");
    return fail(
      supabaseError ||
        "Reset link had no auth code. Add http://localhost:3000/** under Authentication → URL Configuration → Redirect URLs, then request a new reset email."
    );
  }

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.search = "";

  let response = NextResponse.redirect(redirectTo);

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.redirect(redirectTo);
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    // Fall back to client exchange on the update-password page (same-browser PKCE)
    const dest = request.nextUrl.clone();
    dest.pathname = "/auth/update-password";
    dest.searchParams.set("code", code);
    if (nextParam) dest.searchParams.set("next", next);
    return NextResponse.redirect(dest);
  }

  return response;
}
