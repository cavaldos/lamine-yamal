import { MARK_PATH, MARK_VIEWBOX } from "@/components/layout/brand";
import Section from "@/components/ui/section";
import { ctaGhost, ctaPrimary, serif } from "@/lib/styles";

// Sign-off after the journey: the outlined monogram and two ways onward.
export default function Closing() {
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
        <p className="hud-label relative text-faint">Chương tiếp theo đang được viết</p>
        <h2
          data-reveal="true"
          className="relative mt-6 max-w-4xl font-display text-5xl font-medium tracking-[-0.04em] text-ink-strong sm:text-6xl md:text-7xl"
        >
          Mới <span className={`${serif} text-blaugrana`}>chỉ là</span> bắt đầu.
        </h2>
        <div className="relative mt-10 flex flex-wrap items-center justify-center gap-3">
          <a href="#highlights" className={ctaPrimary}>
            Xem highlight
          </a>
          <a href="#hero" className={ctaGhost}>
            Lên đầu trang
          </a>
        </div>
      </div>
    </Section>
  );
}
