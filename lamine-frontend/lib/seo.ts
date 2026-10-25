import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALES, localePath, type Locale } from "@/lib/i18n/config";

export const SITE_URL = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
export const SITE_NAME = "Lamine Yamal";
export const OG_IMAGE_PATH = "/journey/2024-euro-champion.webp";

export function createPageMetadata(locale: Locale, title: string, description: string, path = ""): Metadata {
  const url = new URL(localePath(locale, path), SITE_URL);
  const localeAlternates = Object.fromEntries(
    LOCALES.map((alternateLocale) => [
      alternateLocale,
      new URL(localePath(alternateLocale, path), SITE_URL).toString(),
    ]),
  );

  return {
    metadataBase: SITE_URL,
    title,
    description,
    keywords: ["Lamine Yamal", "FC Barcelona", "football", "goals", "highlights", "La Masia"],
    alternates: {
      canonical: url,
      languages: {
        ...localeAlternates,
        "x-default": new URL(localePath(DEFAULT_LOCALE, path), SITE_URL).toString(),
      },
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale,
      url,
      title,
      description,
      images: [
        {
          url: OG_IMAGE_PATH,
          width: 1020,
          height: 680,
          alt: "Lamine Yamal celebrating Spain's UEFA EURO 2024 victory",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE_PATH],
    },
  };
}
