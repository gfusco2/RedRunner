import { type EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Handles both:
 * - Default Supabase emails → ?code= (PKCE)
 * - Custom templates → ?token_hash=&type=
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = (searchParams.get("type") as EmailOtpType | null) ?? null;
  const nextParam = searchParams.get("next");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const fail = (message: string) => {
    const dest = request.nextUrl.clone();
    dest.pathname = "/login";
    dest.search = "";
    dest.searchParams.set("error", message);
    return NextResponse.redirect(dest);
  };

  if (!url || !key) {
    return fail("Supabase env vars are missing. Restart the dev server.");
  }

  const next =
    nextParam && nextParam.startsWith("/")
      ? nextParam
      : type === "recovery"
        ? "/auth/update-password"
        : "/settings";

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.search = "";

  // Recovery emails should always land on update-password
  if (type === "recovery") {
    redirectTo.pathname = "/auth/update-password";
  }

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

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (error) return fail(error.message);
    return response;
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      if (redirectTo.pathname === "/auth/update-password") {
        const dest = request.nextUrl.clone();
        dest.pathname = "/auth/update-password";
        dest.search = "";
        dest.searchParams.set("code", code);
        return NextResponse.redirect(dest);
      }
      return fail(
        `${error.message} Open the newest email link in the same browser you used on /login.`
      );
    }
    return response;
  }

  const supabaseError =
    searchParams.get("error_description") || searchParams.get("error");
  return fail(
    supabaseError ||
      "Email link was incomplete. In Supabase → Authentication → URL Configuration set Site URL to http://localhost:3000 and add http://localhost:3000/** to Redirect URLs, then request a new email and open it in this browser."
  );
}
