import { type EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Default destination for Supabase email redirects (?code= from PKCE).
 * Also accepts token_hash + type.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next");
  const next =
    nextParam && nextParam.startsWith("/")
      ? nextParam
      : type === "recovery"
        ? "/auth/update-password"
        : "/settings";

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

  if (token_hash && type) {
    const dest = request.nextUrl.clone();
    dest.pathname = "/auth/confirm";
    return NextResponse.redirect(dest);
  }

  if (!code) {
    const supabaseError =
      searchParams.get("error_description") || searchParams.get("error");
    return fail(
      supabaseError ||
        "Auth link had no code. Set Site URL to http://localhost:3000 and Redirect URLs to http://localhost:3000/**, then use a fresh email link in this browser."
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
    const dest = request.nextUrl.clone();
    dest.pathname = next.includes("update-password")
      ? "/auth/update-password"
      : "/login";
    dest.search = "";
    if (next.includes("update-password")) {
      dest.searchParams.set("code", code);
    } else {
      dest.searchParams.set(
        "error",
        `${error.message} Open the newest email link in the same browser you used to sign up / reset.`
      );
    }
    return NextResponse.redirect(dest);
  }

  return response;
}
