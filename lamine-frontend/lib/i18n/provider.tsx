"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

type Value = { locale: Locale; dict: Dictionary };

const I18nContext = createContext<Value | null>(null);

// Hands the page's language and dictionary to client components.
export function I18nProvider({
  locale,
  dict,
  children,
}: Value & {
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ locale, dict }), [locale, dict]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useDict / useLocale must be used inside <I18nProvider>");
  return value;
}

export const useDict = () => useI18n().dict;
export const useLocale = () => useI18n().locale;
