import Link from "next/link";
import { ArrowUpRight } from "@/components/ui/icons";
import Section from "@/components/ui/section";
import { ARCHIVE_PHOTOS } from "@/lib/content";
import { ctaPrimary } from "@/lib/styles";

// Childhood archive: a button to /archive, where the photo album lives.
export default function ArchiveSection() {
  return (
    <Section id="archive">
      <div data-reveal="true" className="border-t border-line px-6 py-10 md:px-10">
        <Link href="/archive" className={ctaPrimary}>
          Xem {ARCHIVE_PHOTOS.length} ảnh tư liệu <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Section>
  );
}
