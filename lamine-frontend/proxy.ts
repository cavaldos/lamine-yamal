import { NextResponse, type NextRequest } from "next/server";
import { hasLocale, LOCALE_COOKIE } from "@/lib/i18n/config";
import { countryFromHeaders, localeForCountry } from "@/lib/i18n/geo";

// Every page lives under /<lang>. A path without one (like "/" or "/goals") goes to:
//   1. the language the visitor picked last in the language switcher (a cookie), else
//   2. the language of the country their IP is in (lib/i18n/geo.ts), else
//   3. English.
// A path that already has a language is never redirected: shared links and the URLs
// search engines index always open in the language they name.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (hasLocale(pathname.split("/")[1] ?? "")) return;

  const saved = request.cookies.get(LOCALE_COOKIE)?.value ?? "";
  const locale = hasLocale(saved) ? saved : localeForCountry(countryFromHeaders(request.headers));

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  // 307 (temporary): the target depends on who is asking, so browsers and search engines
  // must not remember it. For the same reason no shared cache may store it.
  const response = NextResponse.redirect(url, 307);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Vary", "Cookie");
  return response;
}

export const config = {
  // Skip Next internals and anything with a file extension (images, videos, favicon, robots.txt, sitemap.xml).
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
