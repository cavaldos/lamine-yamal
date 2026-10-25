import { MARK_PATH, MARK_VIEWBOX } from "@/components/layout/brand";
import Section from "@/components/ui/section";
import WarpText from "@/components/ui/warp-text";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { ctaGhost, ctaPrimary } from "@/lib/styles";

// Sign-off after the journey: the outlined monogram and two ways onward.
export default async function Closing() {
  const { closing } = await getDictionary();
  const [before, accent, after] = closing.title;
  return (
    <Section>
      <div className="relative flex flex-col items-center overflow-hidden px-6 py-24 text-center md:py-36">
        <svg
          viewBox={MARK_VIEWBOX}
          aria-hidden
          className="absolute top-1/2 left-1/2 w-[70%] max-w-[760px] -translate-x-1/2 -translate-y-1/2 opacity-60"
        >
          <path d={MARK_PATH} fill="none" stroke="var(--line)" strokeWidth="0.6" />
        </svg>
        <p className="hud-label relative text-faint">{closing.eyebrow}</p>
        {/* The title is drawn on a canvas, so the heading is kept for screen readers. */}
        <h2 className="sr-only">{closing.title.join("")}</h2>
        <div data-reveal="true" className="relative mt-6 w-full max-w-4xl text-ink-strong">
          <WarpText
            text={`${before}${accent}\n${after.trim()}`}
            fontFamily="var(--font-archivo), system-ui, sans-serif"
            fontSize="clamp(2.75rem, 9vw, 6.5rem)"
            fontWeight={700}
            letterSpacing="-0.04em"
            lineHeight={1}
            lens="swirl"
            chromatic={0.35}
            className="h-[260px] md:h-[340px]"
          />
        </div>
        <div className="relative mt-10 flex flex-wrap items-center justify-center gap-3">
          <a href="#highlights" className={ctaPrimary}>
            {closing.seeHighlights}
          </a>
          <a href="#hero" className={ctaGhost}>
            {closing.backToTop}
          </a>
        </div>
      </div>
    </Section>
  );
}
