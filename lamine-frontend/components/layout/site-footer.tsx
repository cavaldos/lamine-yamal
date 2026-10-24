import Link from "next/link";
import { BRAND, LINKS, Logo } from "@/components/layout/brand";
import SectionLink from "@/components/layout/section-link";
import { NAV_SECTIONS } from "@/lib/sections";

// Hrefs: "#id" is a home-page section, "/path" another page, "http…" external.
const COLUMNS: [string, [string, string][]][] = [
  ["Explore", [...NAV_SECTIONS.map(({ id, nav }): [string, string] => [nav, `#${id}`]), ["Goal videos", "/goals"]]],
  [
    "Video sources",
    [
      ["FC Barcelona", LINKS.barca],
      ["LALIGA", LINKS.laliga],
    ],
  ],
  ["Follow", [["Instagram", LINKS.instagram]]],
];

const footLink = "text-[17px] leading-6 text-muted hover:text-ink";

export default function SiteFooter() {
  return (
    <footer className="relative border-t border-line">
      <div className="mx-auto max-w-[1280px] border-x border-line">
        <div className="grid gap-px bg-line md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="bg-bg p-6 md:p-10">
            <Logo className="h-[26px] w-auto text-ink-strong" />
            <p className="mt-4 max-w-xs leading-relaxed text-muted">
              Trang fan tổng hợp hành trình của Lamine Yamal — từ Rocafonda tới đỉnh thế giới.
            </p>
            <div aria-hidden className="mt-6 flex h-1.5 w-24 overflow-hidden">
              <span className="flex-1 bg-accent" />
              <span className="flex-1 bg-garnet" />
              <span className="flex-1 bg-gold" />
            </div>
          </div>

          {COLUMNS.map(([heading, links]) => (
            <nav key={heading} aria-label={heading} className="bg-bg p-6 md:p-8">
              <p className="hud-label text-faint">{heading}</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {links.map(([label, href]) => (
                  <li key={label}>
                    {href.startsWith("#") ? (
                      <SectionLink id={href.slice(1)} className={footLink}>
                        {label}
                      </SectionLink>
                    ) : href.startsWith("/") ? (
                      <Link href={href} className={footLink}>
                        {label}
                      </Link>
                    ) : (
                      <a href={href} target="_blank" rel="noreferrer" className={footLink}>
                        {label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-2 border-x border-line px-6 py-4 md:flex-row md:items-center md:justify-between md:px-10">
          <p className="hud-label text-faint">Fan site · {BRAND} · Nº 10</p>
          <p className="hud-label text-faint">Video thuộc về chủ sở hữu trên YouTube</p>
        </div>
      </div>
    </footer>
  );
}
