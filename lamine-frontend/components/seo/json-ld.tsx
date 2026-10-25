import { getDictionary, getLocale } from "@/lib/i18n/get-dictionary";
import { pageJsonLd, siteJsonLd, toJsonLd, type PageKey } from "@/lib/seo";

// Structured data for search engines, in the language of the page.
// No `page`: the site-wide part (the person, the website), rendered once by the root layout.
export default async function JsonLd({ page }: { page?: PageKey }) {
  const locale = await getLocale();
  const dict = await getDictionary();
  const data = page ? pageJsonLd(locale, dict, page) : siteJsonLd(locale, dict);
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(data) }} />;
}
