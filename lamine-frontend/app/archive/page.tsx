import type { Metadata } from "next";
import Link from "next/link";
import PhotoReel from "@/components/sections/archive/photo-reel";
import { ARCHIVE_PHOTOS } from "@/lib/content";

export const metadata: Metadata = {
  title: "Tư liệu — Lamine Yamal",
  description: "Album ảnh thời thơ ấu của Lamine Yamal ở Rocafonda, La Masia và các giải đấu trẻ.",
};

// /archive — the childhood photo album, on its own page.
export default function ArchivePage() {
  return (
    <main id="main" className="relative">
      <div className="mx-auto max-w-[1280px] border-x border-line">
        <header>
          <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-3 md:px-10">
            <Link href="/" className="hud-label text-muted hover:text-ink">
              ← Home
            </Link>
            <p className="hud-label text-faint">Tư liệu · {ARCHIVE_PHOTOS.length} ảnh</p>
          </div>
        </header>
        <PhotoReel />
      </div>
    </main>
  );
}
