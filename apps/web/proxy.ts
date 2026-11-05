import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { documentIsHebrew } from "./hub-request";

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const he = documentIsHebrew(pathname, searchParams.get("lang"));
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-clearpill-lang", he ? "he" : "en");
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
