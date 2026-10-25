// The sticky "01 / <section name>" bar. Split from section.tsx so client components can use it.
export function SectionHeader({ num, label, hint }: { num: string; label: string; hint?: string }) {
  return (
    <div data-snap-header="true" className="sticky top-12 z-30 border-y border-line bg-bg/92">
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
