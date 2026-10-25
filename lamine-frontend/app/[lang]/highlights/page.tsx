import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HighlightBrowser from "@/components/highlights-page/highlight-browser";
import HighlightsHero from "@/components/highlights-page/highlights-hero";
import { hasLocale } from "@/lib/i18n/config";
import JsonLd from "@/components/seo/json-ld";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[lang]/highlights">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return createPageMetadata(lang, "highlights");
}

// /<lang>/highlights — every highlight video: grid, search and filters, and a player that moves down the list.
export default function HighlightsPage() {
  return (
    <main id="main" className="relative">
      <JsonLd page="highlights" />
      <div className="mx-auto max-w-[1280px] border-x border-line">
        <HighlightsHero />
        <HighlightBrowser />
      </div>
    </main>
  );
}
