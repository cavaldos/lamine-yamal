import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { hasLocale, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

// Server side only. Client components read the same dictionary from I18nProvider.
const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("@/lib/i18n/dictionaries/en").then((m) => m.en),
  vi: () => import("@/lib/i18n/dictionaries/vi").then((m) => m.vi),
  fr: () => import("@/lib/i18n/dictionaries/fr").then((m) => m.fr),
  es: () => import("@/lib/i18n/dictionaries/es").then((m) => m.es),
};

export const loadDictionary = (locale: Locale) => dictionaries[locale]();

// The language of the current request, from the /[lang] segment. An unknown one is a 404.
export async function getLocale(): Promise<Locale> {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();
  return locale;
}

export async function getDictionary() {
  return loadDictionary(await getLocale());
}
