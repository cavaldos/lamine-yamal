"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Globe } from "@/components/ui/icons";
import { LOCALE_COOKIE, LOCALE_NAMES, LOCALES, switchLocale, type Locale } from "@/lib/i18n/config";
import { useDict, useLocale } from "@/lib/i18n/provider";

// `/` opens in the language picked last.
function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

// The language picker in the nav bar: the same page, in another language.
export default function LanguageSwitcher() {
  const locale = useLocale();
  const dict = useDict();
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  // Closes on Escape or a click outside.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (e: React.MouseEvent, to: Locale) => {
    e.preventDefault();
    setOpen(false);
    if (to === locale) return;
    rememberLocale(to);
    // A full page load, not a client navigation: the root layout (<html lang>, the theme
    // script) belongs to the language, so it is rendered fresh by the server.
    // A #hash (a goal, a video) survives the switch.
    window.location.assign(switchLocale(pathname, to) + window.location.hash);
  };

  return (
    <div ref={root} className="relative flex items-stretch">
      <button
        type="button"
        aria-label={dict.nav.language}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="hud-label flex items-center gap-1.5 border-l border-line px-2.5 text-muted transition-colors hover:text-ink aria-expanded:bg-invert-bg aria-expanded:text-invert-fg sm:px-3"
      >
        <Globe className="h-4 w-4" />
        <span className="uppercase">{locale}</span>
        <ChevronDown className={`hidden h-3.5 w-3.5 transition-transform sm:block ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={dict.nav.language}
          className="absolute top-full right-0 z-50 min-w-40 border border-line-strong bg-bg-raised py-1 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)]"
        >
          {LOCALES.map((l) => (
            <li key={l} role="option" aria-selected={l === locale}>
              <a
                href={switchLocale(pathname, l)}
                hrefLang={l}
                lang={l}
                onClick={(e) => choose(e, l)}
                className="hud-label flex items-center justify-between gap-4 px-3 py-2.5 whitespace-nowrap text-muted hover:bg-line hover:text-ink aria-selected:text-ink"
                aria-current={l === locale ? "true" : undefined}
              >
                {LOCALE_NAMES[l]}
                <span className="text-faint uppercase">{l}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
