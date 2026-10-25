import Link from "next/link";
import { ArrowUpRight } from "@/components/ui/icons";
import Section from "@/components/ui/section";
import { ARCHIVE_PHOTOS } from "@/lib/content";
import { format, localePath } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/get-dictionary";
import { ctaPrimary } from "@/lib/styles";

// Childhood archive: a button to /archive, where the photo album lives.
export default async function ArchiveSection() {
  const { archive } = await getDictionary();
  const locale = await getLocale();
  return (
    <Section id="archive">
      <div data-reveal="true" className="border-t border-line px-6 py-10 md:px-10">
        <Link href={localePath(locale, "/archive")} className={ctaPrimary}>
          {format(archive.cta, { count: ARCHIVE_PHOTOS.length })} <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Section>
  );
}
