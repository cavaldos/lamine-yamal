import Link from "next/link";
import { ArrowUpRight } from "@/components/ui/icons";
import LoopVideo from "@/components/ui/loop-video";
import Section from "@/components/ui/section";
import { HIGHLIGHT_LOOP, HIGHLIGHTS } from "@/lib/content";

// One clip loops, muted, across the whole section; the button goes to /highlights,
// where every highlight can be watched.
export default function HighlightsSection() {
  return (
    <Section id="highlights">
      <div data-reveal="true" className="relative aspect-video max-h-[80svh] min-h-[30rem] text-white">
        {/* This upload carries its own black bars either side; 1.1 crops them off. */}
        <LoopVideo id={HIGHLIGHT_LOOP.youtube} zoom={1.1} className="absolute inset-0" />
        <span aria-hidden className="absolute inset-0 bg-linear-to-t from-black/85 via-black/15 to-black/35" />

        <p className="hud-label absolute top-5 left-6 flex items-center gap-2 text-white/80 md:top-8 md:left-10">
          <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-garnet" />
          {HIGHLIGHT_LOOP.title}
          <span className="text-white/45">· {HIGHLIGHT_LOOP.source}</span>
        </p>

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-8 p-6 md:flex-row md:items-end md:justify-between md:p-10">
          <Link
            href="/highlights"
            className="inline-flex h-12 w-fit shrink-0 items-center justify-center gap-2 bg-white px-6 font-mono text-[11px] font-bold tracking-[0.12em] whitespace-nowrap text-black uppercase transition-opacity duration-150 hover:opacity-80"
          >
            Xem {HIGHLIGHTS.length} video highlight <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </Section>
  );
}
