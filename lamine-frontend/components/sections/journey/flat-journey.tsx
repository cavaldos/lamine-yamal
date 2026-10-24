import Station from "@/components/sections/journey/station";
import { SectionHeader } from "@/components/ui/section";
import { JOURNEY } from "@/lib/content";
import { sectionMeta } from "@/lib/sections";

// Reduced motion: the same chapters as a plain, readable timeline.
export default function FlatJourney() {
  const meta = sectionMeta("journey");
  return (
    <section id="journey" aria-label={meta.label} className="relative border-b border-line">
      <div className="mx-auto max-w-[1280px] border-x border-line">
        <SectionHeader num={meta.num} label={meta.label} />
        <ol className="grid gap-px bg-line">
          {JOURNEY.map((ch, i) => (
            <li key={i} className="bg-bg p-4 md:p-8">
              <Station chapter={ch} index={i} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
