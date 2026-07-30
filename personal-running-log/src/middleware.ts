import { type NextRequest } from "next/server";
import { updateSession } from "lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

/**
 * Only run on app/auth routes that need session refresh.
 * Skip `/`, `/login`, icons, and static assets so bots and guests
 * do not burn Function Invocations / Edge Requests.
 */
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/training-log/:path*",
    "/settings/:path*",
    "/reports/:path*",
    "/coach/:path*",
    "/auth/:path*",
  ],
};
