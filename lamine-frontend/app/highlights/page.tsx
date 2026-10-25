import type { Metadata } from "next";
import HighlightBrowser from "@/components/highlights-page/highlight-browser";
import HighlightsHero from "@/components/highlights-page/highlights-hero";

export const metadata: Metadata = {
  title: "Highlight — Lamine Yamal",
  description: "Những video hay nhất về Lamine Yamal: tìm, lọc và xem liền mạch ngay trên trang.",
};

// /highlights — every highlight video: grid, search and filters, and a player that moves down the list.
export default function HighlightsPage() {
  return (
    <main id="main" className="relative">
      <div className="mx-auto max-w-[1280px] border-x border-line">
        <HighlightsHero />
        <HighlightBrowser />
      </div>
    </main>
  );
}
