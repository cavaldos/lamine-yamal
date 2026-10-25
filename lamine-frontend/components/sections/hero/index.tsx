import HeroOrb from "@/components/sections/hero/hero-orb";
import HeroStats from "@/components/sections/hero/hero-stats";
import Wordmark from "@/components/sections/hero/wordmark";
import PauseOffscreen from "@/components/ui/pause-offscreen";
import { HERO_IMAGES } from "@/lib/content";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { ctaGhost, ctaPrimary } from "@/lib/styles";

// Full-screen opener: photo spiral (WebGL) behind the title, intro copy, CTAs, stats.
export default async function HeroSection() {
  const { hero } = await getDictionary();
  return (
    <section id="hero" className="relative">
      <div className="relative flex min-h-[calc(100svh-3rem)] flex-col overflow-hidden">
        <PauseOffscreen aria-hidden className="hero-glow" />
        <HeroOrb images={HERO_IMAGES} />

        <div className="pointer-events-none relative z-40 mx-auto flex w-full max-w-[1280px] flex-1 flex-col items-center justify-center px-6 py-10 md:px-10">
          <div className="relative flex w-full max-w-2xl flex-col items-center text-center">
            {/* Dark pool behind the title so it reads over the photos. */}
            <div
              aria-hidden
              className="absolute"
              style={{
                inset: "-88px -128px",
                background:
                  "radial-gradient(closest-side, color-mix(in srgb, var(--bg) 90%, transparent) 30%, transparent)",
              }}
            />

            <p data-intro="true" style={{ animationDelay: "0ms" }} className="hud-label relative mb-6 text-muted">
              FC Barcelona <span className="mx-2 text-garnet-ink">·</span> {hero.country}
              <span className="mx-2 text-garnet-ink">·</span> Nº 10
            </p>

            <div className="pointer-events-none relative z-40 w-full" style={{ containerType: "inline-size" }}>
              <Wordmark />
            </div>

            {/* The wordmark is drawn, so the page's heading is kept for screen readers. */}
            <h1 className="sr-only">Lamine Yamal</h1>

            <div
              data-intro="true"
              style={{ animationDelay: "960ms" }}
              className="pointer-events-auto relative mt-10 flex flex-wrap items-center justify-center gap-3"
            >
              <a href="#goals" className={ctaPrimary}>
                {hero.seeGoals}
              </a>
              <a href="#journey" className={ctaGhost}>
                {hero.journey}
              </a>
            </div>
          </div>
        </div>

        <HeroStats />
      </div>
    </section>
  );
}
