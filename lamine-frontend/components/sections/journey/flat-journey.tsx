import Station from "@/components/sections/journey/station";
import { SectionHeader } from "@/components/ui/section-header";
import { chaptersFor } from "@/lib/content";
import { useDict } from "@/lib/i18n/provider";
import { sectionMeta } from "@/lib/sections";

// Reduced motion: the same chapters as a plain, readable timeline.
export default function FlatJourney() {
  const dict = useDict();
  const meta = sectionMeta(dict, "journey");
  return (
    <section id="journey" aria-label={meta.label} className="relative border-b border-line">
      <div className="mx-auto max-w-[1280px] border-x border-line">
        <SectionHeader num={meta.num} label={meta.label} />
        <ol className="grid gap-px bg-line">
          {chaptersFor(dict).map((ch, i) => (
            <li key={i} className="bg-bg p-4 md:p-8">
              <Station chapter={ch} index={i} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
