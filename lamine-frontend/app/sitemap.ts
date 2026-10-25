import type { MetadataRoute } from "next";
import { LOCALES } from "@/lib/i18n/config";
import { languageAlternates, OG_IMAGE_PATH, PAGES, pageUrl, SITE_URL } from "@/lib/seo";

// One entry per page per language. Each lists its other languages (hreflang), so search
// engines show every visitor the version in their own language.
export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.flatMap((locale) =>
    Object.values(PAGES).map(({ path }) => ({
      url: pageUrl(locale, path),
      changeFrequency: path === "" ? "weekly" : "monthly",
      priority: path === "" ? 1 : 0.8,
      alternates: { languages: languageAlternates(path) },
      ...(path === "" && { images: [new URL(OG_IMAGE_PATH, SITE_URL).toString()] }),
    })),
  );
}
