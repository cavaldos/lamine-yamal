import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Archivo, Geist_Mono, Inter, Playfair_Display } from "next/font/google";
import GoalsSync from "@/components/layout/goals-sync";
import SiteFooter from "@/components/layout/site-footer";
import SmoothScroll from "@/components/layout/smooth-scroll";
import SiteNav from "@/components/layout/site-nav";
import VideoLightbox from "@/components/ui/video-lightbox";
import { hasLocale, localePath, LOCALES } from "@/lib/i18n/config";
import { getDictionary, getLocale, loadDictionary } from "@/lib/i18n/get-dictionary";
import { I18nProvider } from "@/lib/i18n/provider";
import { createPageMetadata, SITE_URL } from "@/lib/seo";
import "../globals.css";

// The wide display cut needs the width axis. Every face ships the Vietnamese subset; Latin covers French and Spanish.
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin", "vietnamese"], axes: ["wdth"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "vietnamese"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "vietnamese"] });
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "vietnamese"],
  style: ["normal", "italic"],
});

// Runs before paint so the theme never flashes. Dark unless the visitor picked light.
const themeScript = `try{document.documentElement.dataset.theme=localStorage.getItem("lamine-theme")||"dark"}catch(e){document.documentElement.dataset.theme="dark"}`;

export const generateStaticParams = () => LOCALES.map((lang) => ({ lang }));

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { meta } = await loadDictionary(lang);
  return createPageMetadata(lang, meta.title, meta.description);
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  const dict = await getDictionary();
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${archivo.variable} ${inter.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      {/* Extensions (e.g. "vsc-initialized") add classes to body before hydration. */}
      <body suppressHydrationWarning className="flex min-h-full flex-col font-body">
        {/* Plain <script> on purpose: it runs before paint. The layout is never rendered on the
            client (switching language is a full page load), so React never sees it there. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <I18nProvider locale={locale} dict={dict}>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": "Person",
                    "@id": `${new URL(localePath(locale), SITE_URL).toString()}#person`,
                    name: "Lamine Yamal",
                    givenName: "Lamine",
                    familyName: "Yamal Nasraoui Ebana",
                    birthDate: "2007-07-13",
                    birthPlace: {
                      "@type": "Place",
                      name: "Esplugues de Llobregat, Catalonia",
                    },
                    jobTitle: "Professional footballer",
                    nationality: "Spanish",
                    memberOf: [
                      { "@type": "SportsTeam", name: "FC Barcelona" },
                      { "@type": "SportsTeam", name: "Spain national football team" },
                    ],
                  },
                  {
                    "@type": "WebSite",
                    "@id": `${SITE_URL.toString()}#website`,
                    url: SITE_URL.toString(),
                    name: "Lamine Yamal",
                    description: dict.meta.description,
                    inLanguage: locale,
                    about: { "@id": `${new URL(localePath(locale), SITE_URL).toString()}#person` },
                  },
                ],
              }),
            }}
          />
          <SiteNav />
          <SmoothScroll />
          <GoalsSync />
          {children}
          <SiteFooter />
          <VideoLightbox />
        </I18nProvider>
      </body>
    </html>
  );
}
