import { sectionMeta, type SectionId } from "@/lib/sections";

// The framed column every content section sits in: a hairline that draws in,
// corner ticks, and a sticky "01 / <section name>" header.
// Pass `id` to get the anchor and header from lib/sections.ts; leave it out for
// a continuation block that should not get its own header.
export default function Section({
  id,
  children,
}: {
  id?: SectionId;
  children: React.ReactNode;
}) {
  const meta = id ? sectionMeta(id) : null;
  return (
    <section id={id} data-choreo="true" className="relative">
      <span aria-hidden data-draw-rule="true" className="absolute inset-x-0 top-0 h-px origin-left bg-line" />
      <div className="relative mx-auto max-w-[1280px] border-x border-line">
        <span aria-hidden data-draw-tick="true" className="tick tick-half z-[31] -top-[5px] -left-[6px]" />
        <span aria-hidden data-draw-tick="true" className="tick tick-half z-[31] -top-[5px] -right-[5px]" />
        {meta && <SectionHeader num={meta.num} label={meta.label} hint={meta.hint} />}
        {children}
      </div>
    </section>
  );
}

export function SectionHeader({ num, label, hint }: { num: string; label: string; hint?: string }) {
  return (
    <div className="sticky top-12 z-30 border-y border-line bg-bg/92">
      <div className="flex items-center justify-between gap-4 px-6 py-3 md:px-10">
        <p className="hud-label text-muted">
          <span className="text-faint">{num}</span>
          <span aria-hidden className="mx-2 text-faint">
            /
          </span>
          {label}
        </p>
        {hint && <p className="hud-label hidden text-faint sm:block">{hint}</p>}
      </div>
    </div>
  );
}

// Title + intro paragraph at the top of a section.
export function SectionIntro({ children }: { children: React.ReactNode }) {
  return <div className="px-6 py-14 md:px-10 md:py-20">{children}</div>;
}
