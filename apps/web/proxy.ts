import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
<<<<<<< HEAD
import { documentIsHebrew } from "./hub-request";
=======
>>>>>>> cursor/support-wzhk-landing-e06f
import { isPrivatePlannerPath, privatePagesEnabled } from "./private-pages";

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (isPrivatePlannerPath(pathname) && !privatePagesEnabled()) {
    return new NextResponse(null, { status: 404 });
  }
<<<<<<< HEAD
  const he = documentIsHebrew(pathname, searchParams.get("lang"));
=======
  const he =
    pathname === "/today" ||
    pathname === "/plan" ||
    pathname.startsWith("/today/") ||
    pathname.startsWith("/plan/") ||
    searchParams.get("lang") === "he";
>>>>>>> cursor/support-wzhk-landing-e06f
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-clearpill-lang", he ? "he" : "en");
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
