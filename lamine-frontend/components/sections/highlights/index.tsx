import Link from "next/link";
import { ArrowUpRight } from "@/components/ui/icons";
import LoopVideo from "@/components/ui/loop-video";
import Section from "@/components/ui/section";
import { HIGHLIGHT_LOOP, HIGHLIGHTS } from "@/lib/content";
import { format, localePath } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/get-dictionary";

// One clip loops, muted, across the whole section; the button goes to /highlights,
// where every highlight can be watched.
export default async function HighlightsSection() {
  const { highlights } = await getDictionary();
  const locale = await getLocale();
  return (
    <Section id="highlights">
      {/* w-full matters: without it, min-height stretches the 16:9 box wider than a phone screen. */}
      <div data-reveal="true" className="relative aspect-video max-h-[80svh] min-h-[24rem] w-full text-white sm:min-h-[30rem]">
        {/* This upload carries its own black bars either side; 1.1 crops them off. */}
        <LoopVideo id={HIGHLIGHT_LOOP.youtube} zoom={1.1} className="absolute inset-0" />
        <span aria-hidden className="absolute inset-0 bg-linear-to-t from-black/85 via-black/15 to-black/35" />

        <p className="hud-label absolute top-5 right-6 left-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-white/80 md:top-8 md:right-10 md:left-10">
          <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-garnet" />
          {highlights.loopTitle}
          <span className="text-white/45">· {HIGHLIGHT_LOOP.source}</span>
        </p>

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-8 p-6 md:flex-row md:items-end md:justify-between md:p-10">
          <Link
            href={localePath(locale, "/highlights")}
            className="inline-flex min-h-12 w-fit max-w-full shrink-0 items-center justify-center gap-2 bg-white px-6 py-3 text-center font-mono text-[11px] font-bold tracking-[0.12em] text-black uppercase transition-opacity duration-150 hover:opacity-80"
          >
            {format(highlights.watchAll, { count: HIGHLIGHTS.length })} <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </Section>
  );
}
