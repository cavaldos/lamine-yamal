import type { Metadata } from "next";
import { LOCALES, localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { loadDictionary } from "@/lib/i18n/get-dictionary";

export const SITE_URL = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
export const SITE_NAME = "Lamine Yamal";
export const OG_IMAGE_PATH = "/journey/2024-euro-champion.webp";

export const LOCALE_LANGUAGE_TAGS: Record<Locale, string> = {
  en: "en-US",
  vi: "vi-VN",
  fr: "fr-FR",
  es: "es-ES",
};

const OG_LOCALES: Record<Locale, string> = {
  en: "en_US",
  vi: "vi_VN",
  fr: "fr_FR",
  es: "es_ES",
};

// Every indexable page. The sitemap, the metadata and the breadcrumbs all read from here,
// so a new page only needs an entry (and its strings in the dictionaries' `meta`).
export const PAGES = {
  home: { path: "", title: (m: Meta) => m.title, description: (m: Meta) => m.description, crumb: null },
  goals: { path: "/goals", title: (m: Meta) => m.goalsTitle, description: (m: Meta) => m.goalsDescription, crumb: (m: Meta) => m.crumbs.goals },
  highlights: { path: "/highlights", title: (m: Meta) => m.highlightsTitle, description: (m: Meta) => m.highlightsDescription, crumb: (m: Meta) => m.crumbs.highlights },
  archive: { path: "/archive", title: (m: Meta) => m.archiveTitle, description: (m: Meta) => m.archiveDescription, crumb: (m: Meta) => m.crumbs.archive },
} as const;

export type PageKey = keyof typeof PAGES;
type Meta = Dictionary["meta"];

const absolute = (path: string) => new URL(path, SITE_URL).toString();
export const pageUrl = (locale: Locale, path = "") => absolute(localePath(locale, path));

// hreflang links: the same page in every language, plus x-default for everyone else.
// x-default is the path without a language ("/goals"): the proxy sends each visitor on
// to their own language from there (see proxy.ts), which is what Google expects of it.
export function languageAlternates(path = "") {
  return {
    ...Object.fromEntries(LOCALES.map((locale) => [locale, pageUrl(locale, path)])),
    "x-default": absolute(path || "/"),
  };
}

export async function createPageMetadata(locale: Locale, page: PageKey): Promise<Metadata> {
  const { meta } = await loadDictionary(locale);
  const { path } = PAGES[page];
  const title = PAGES[page].title(meta);
  const description = PAGES[page].description(meta);
  const url = pageUrl(locale, path);

  return {
    metadataBase: SITE_URL,
    title,
    description,
    applicationName: SITE_NAME,
    keywords: [...meta.keywords],
    category: "sports",
    alternates: { canonical: url, languages: languageAlternates(path) },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        // Lets Google show big image previews and full snippets in search and Discover.
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: OG_LOCALES[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALES[l]),
      url,
      title,
      description,
      images: [{ url: OG_IMAGE_PATH, width: 1020, height: 680, alt: meta.ogImageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: OG_IMAGE_PATH, alt: meta.ogImageAlt }],
    },
  };
}

// schema.org structured data. The site-wide part (the person and the website) is in the
// root layout; each page adds its own WebPage and breadcrumb.

const personId = absolute("/#person");
const websiteId = absolute("/#website");

export function siteJsonLd(locale: Locale, dict: Dictionary) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId,
        name: "Lamine Yamal",
        givenName: "Lamine",
        familyName: "Yamal Nasraoui Ebana",
        birthDate: "2007-07-13",
        birthPlace: { "@type": "Place", name: "Esplugues de Llobregat, Catalonia" },
        jobTitle: "Professional footballer",
        nationality: { "@type": "Country", name: "Spain" },
        image: absolute(OG_IMAGE_PATH),
        // Ties this page to the same person in Google's Knowledge Graph.
        sameAs: ["https://en.wikipedia.org/wiki/Lamine_Yamal"],
        memberOf: [
          { "@type": "SportsTeam", name: "FC Barcelona", sport: "Football" },
          { "@type": "SportsTeam", name: "Spain national football team", sport: "Football" },
        ],
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: absolute("/"),
        name: SITE_NAME,
        description: dict.meta.description,
        inLanguage: LOCALES.map((l) => LOCALE_LANGUAGE_TAGS[l]),
        about: { "@id": personId },
      },
    ],
  };
}

export function pageJsonLd(locale: Locale, dict: Dictionary, page: PageKey) {
  const { meta, common } = dict;
  const { path, crumb } = PAGES[page];
  const url = pageUrl(locale, path);
  const crumbs = [{ name: common.home, url: pageUrl(locale) }, ...(crumb ? [{ name: crumb(meta), url }] : [])];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": page === "home" ? "WebPage" : "CollectionPage",
        "@id": `${url}#webpage`,
        url,
        name: PAGES[page].title(meta),
        description: PAGES[page].description(meta),
        inLanguage: LOCALE_LANGUAGE_TAGS[locale],
        isPartOf: { "@id": websiteId },
        about: { "@id": personId },
        ...(page === "home" && { mainEntity: { "@id": personId } }),
        primaryImageOfPage: { "@type": "ImageObject", url: absolute(OG_IMAGE_PATH), caption: meta.ogImageAlt },
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url })),
      },
    ],
  };
}

// JSON for a <script type="application/ld+json">. "<" is escaped so no string in it can
// close the script tag early.
export const toJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
