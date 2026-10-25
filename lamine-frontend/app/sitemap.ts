import type { MetadataRoute } from "next";
import { LOCALES, localePath } from "@/lib/i18n/config";
import { SITE_URL } from "@/lib/seo";

const routes = ["", "/goals", "/highlights", "/archive"];

export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.flatMap((locale) =>
    routes.map((route) => ({
      url: new URL(localePath(locale, route), SITE_URL).toString(),
      changeFrequency: route === "" ? "weekly" : "monthly",
      priority: route === "" ? 1 : 0.8,
    })),
  );
}
