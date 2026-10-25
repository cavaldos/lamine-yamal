import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PhotoReel from "@/components/sections/archive/photo-reel";
import { ARCHIVE_PHOTOS } from "@/lib/content";
import { format, hasLocale, localePath } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/get-dictionary";
import JsonLd from "@/components/seo/json-ld";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[lang]/archive">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return createPageMetadata(lang, "archive");
}

// /<lang>/archive — the childhood photo album, on its own page.
export default async function ArchivePage() {
  const { archive, common } = await getDictionary();
  const locale = await getLocale();
  return (
    <main id="main" className="relative">
      <JsonLd page="archive" />
      <div className="mx-auto max-w-[1280px] border-x border-line">
        <header>
          <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-3 md:px-10">
            <Link href={localePath(locale)} className="hud-label text-muted hover:text-ink">
              {common.home}
            </Link>
            <p className="hud-label text-faint">{format(archive.badge, { count: ARCHIVE_PHOTOS.length })}</p>
          </div>
        </header>
        <PhotoReel />
      </div>
    </main>
  );
}
