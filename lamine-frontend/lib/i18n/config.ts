// The site's languages. English is the default: a first-time visitor whose country has no
// language here (see ./geo.ts) gets it.
// To add a language: add its code here, a dictionary in ./dictionaries/<code>.ts, and an
// entry in ./get-dictionary.ts.

export const LOCALES = ["en", "vi", "fr", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

// Remembers the visitor's last choice, so `/` opens in that language next time.
export const LOCALE_COOKIE = "lamine-lang";

// Each language written in itself, for the picker.
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  vi: "Tiếng Việt",
  fr: "Français",
  es: "Español",
};

export const hasLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value);

// Swaps the language segment of a pathname: switchLocale("/vi/goals", "fr") → "/fr/goals".
export function switchLocale(pathname: string, to: Locale) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] && hasLocale(parts[0])) parts.shift();
  return `/${[to, ...parts].join("/")}`;
}

// A path inside the site, in a language: localePath("fr", "/goals") → "/fr/goals".
export const localePath = (locale: Locale, path = "") => `/${locale}${path === "/" ? "" : path}`;

// "Goal #{n}" with { n: 3 } → "Goal #3".
export const format = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
