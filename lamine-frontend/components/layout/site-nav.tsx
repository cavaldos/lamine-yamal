import Link from "next/link";
import LanguageSwitcher from "@/components/layout/language-switcher";
import SectionLink from "@/components/layout/section-link";
import ThemeToggle from "@/components/layout/theme-toggle";
import { Menu } from "@/components/ui/icons";
import { Logo, WORDMARK } from "@/components/layout/brand";
import { localePath } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/get-dictionary";
import { navSectionsFor } from "@/lib/sections";

const link =
  "group flex h-full items-center px-2.5 hud-label whitespace-nowrap transition-colors text-muted hover:text-ink";

const cta =
  "inline-flex items-center justify-center gap-2 border-l border-line bg-invert-bg px-5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] whitespace-nowrap text-invert-fg transition-opacity hover:opacity-80";

export default async function SiteNav() {
  const dict = await getDictionary();
  const locale = await getLocale();
  const sections = navSectionsFor(dict);
  return (
    <nav id="site-nav" className="sticky top-0 left-0 z-50 w-full border-b border-line bg-bg/95">
      {/* A thin blaugrana stripe under the bar. */}
      <span
        aria-hidden
        className="absolute inset-x-0 -bottom-px h-px bg-linear-to-r from-transparent via-accent to-garnet opacity-60"
      />
      <div className="flex h-12 items-stretch justify-between">
        <div className="flex min-w-0 items-stretch">
          <SectionLink
            id="hero"
            label={WORDMARK}
            className="flex items-center gap-3 border-r border-line px-4 text-ink-strong hover:opacity-70 sm:px-5"
          >
            <Logo className="h-[18px] w-auto" />
            <span className="hud-label hidden text-ink sm:inline">{WORDMARK}</span>
          </SectionLink>

          <ul className="hidden min-w-0 items-stretch lg:flex">
            {sections.map(({ id, nav }) => (
              <li key={id} className="flex items-stretch">
                <SectionLink id={id} className={link}>
                  <span className="flex items-center gap-1.5 px-1.5 py-0.5 group-hover:bg-invert-bg group-hover:text-invert-fg">
                    {nav}
                  </span>
                </SectionLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex shrink-0 items-stretch">
          <p className="hud-label hidden items-center px-4 text-faint xl:flex">
            FC Barcelona <span className="mx-2 text-garnet-ink">·</span> Nº 10
          </p>
          <Link href={localePath(locale, "/goals")} className={cta}>
            {dict.nav.goalVideos}
          </Link>
          <ThemeToggle />
          <LanguageSwitcher />

          <details className="group flex items-stretch lg:hidden">
            <summary className="flex w-12 cursor-pointer list-none items-center justify-center border-l border-line text-muted hover:bg-invert-bg hover:text-invert-fg [&::-webkit-details-marker]:hidden">
              <span className="sr-only">{dict.nav.menu}</span>
              <Menu className="h-5 w-5 group-open:hidden" />
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                aria-hidden
                className="hidden h-5 w-5 group-open:block"
              >
                <path d="m5.5 5.5 13 13m0-13-13 13" />
              </svg>
            </summary>
            <div className="absolute top-full right-0 z-50 w-full border-b border-line bg-bg-raised p-2 lg:hidden">
              <ul className="flex flex-col">
                {sections.map(({ id, nav }) => (
                  <li key={id}>
                    <SectionLink
                      id={id}
                      className="block px-3 py-2.5 text-muted hover:bg-invert-bg hover:text-invert-fg"
                    >
                      {nav}
                    </SectionLink>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </div>
      </div>
    </nav>
  );
}
