import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

// Picks a language from the visitor's country, which the host works out from their IP.
// A country not listed here (or no country at all) gets the default language, English.

// ISO 3166-1 alpha-2 country codes. English-speaking countries are left out on purpose:
// they fall through to English anyway.
const COUNTRY_LOCALES: Record<string, Locale> = {
  // Vietnamese
  VN: "vi",

  // Spanish
  ES: "es", AD: "es", MX: "es", AR: "es", CO: "es", CL: "es", PE: "es", VE: "es", EC: "es",
  GT: "es", CU: "es", BO: "es", DO: "es", HN: "es", PY: "es", SV: "es", NI: "es", CR: "es",
  PA: "es", UY: "es", PR: "es", GQ: "es",

  // French (Canada stays English: most of it speaks English)
  FR: "fr", MC: "fr", LU: "fr", BE: "fr",
  // French overseas departments and territories
  GP: "fr", MQ: "fr", GF: "fr", RE: "fr", YT: "fr", PM: "fr", BL: "fr", MF: "fr", NC: "fr",
  PF: "fr", WF: "fr",
  // Francophone Africa and the Caribbean
  SN: "fr", CI: "fr", ML: "fr", BF: "fr", NE: "fr", TG: "fr", BJ: "fr", GN: "fr", CM: "fr",
  GA: "fr", CG: "fr", CD: "fr", CF: "fr", TD: "fr", MG: "fr", DJ: "fr", KM: "fr", BI: "fr",
  HT: "fr", MA: "fr", DZ: "fr", TN: "fr",
};

// Geo headers set by common hosts and CDNs, first match wins. Each holds a 2-letter country
// code worked out from the visitor's IP. Vercel (where this site runs) sets the first one.
const COUNTRY_HEADERS = [
  "x-vercel-ip-country", // Vercel
  "cf-ipcountry", // Cloudflare
  "cloudfront-viewer-country", // AWS CloudFront
  "x-country-code", // generic, e.g. set by a reverse proxy
];

export function countryFromHeaders(headers: Headers): string | null {
  for (const name of COUNTRY_HEADERS) {
    const value = headers.get(name)?.trim().toUpperCase();
    // Cloudflare sends "XX" for unknown and "T1" for Tor: neither is a real country.
    if (value && /^[A-Z]{2}$/.test(value) && value !== "XX") return value;
  }
  return null;
}

export const localeForCountry = (country: string | null): Locale =>
  (country && COUNTRY_LOCALES[country]) || DEFAULT_LOCALE;
