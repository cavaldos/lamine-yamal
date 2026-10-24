import Link from "next/link";
import ThemeToggle from "./theme-toggle";
import { ChevronDown, Menu } from "./icons";
import { LINKS, Logo, WORDMARK } from "./brand";

const link =
  "group flex h-full items-center px-2.5 hud-label whitespace-nowrap transition-colors text-muted hover:text-ink";

function Item({
  href,
  children,
  current,
}: {
  href: string;
  children: React.ReactNode;
  current?: boolean;
}) {
  return (
    <li className="flex items-stretch">
      <a
        href={href}
        aria-current={current ? "page" : undefined}
        className={`${link} ${current ? "text-ink" : ""}`}
      >
        <span
          className={`flex items-center gap-1.5 px-1.5 py-0.5 group-hover:bg-invert-bg group-hover:text-invert-fg ${
            current ? "bg-invert-bg text-invert-fg" : ""
          }`}
        >
          {children}
        </span>
      </a>
    </li>
  );
}

const cta =
  "inline-flex items-center justify-center gap-2 border-l border-line bg-invert-bg px-5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] whitespace-nowrap text-invert-fg transition-opacity hover:opacity-80";

export default function SiteNav() {
  return (
    <nav
      id="site-nav"
      className="sticky top-0 left-0 z-50 w-full border-b border-line bg-bg/95 backdrop-blur-sm"
    >
      <div className="flex h-12 items-stretch justify-between">
        <div className="flex min-w-0 items-stretch">
          <Link
            href="/"
            aria-label={WORDMARK}
            className="flex items-center border-r border-line px-4 text-ink-strong hover:opacity-70 sm:px-5"
          >
            <Logo className="h-[22px] w-auto" />
          </Link>

          <ul className="hidden min-w-0 items-stretch lg:flex">
            <Item href="/" current>
              Home
            </Item>
            <Item href="/image">Image</Item>
            <Item href="/video">Video</Item>

            <li className="relative flex items-stretch">
              <details className="group flex">
                <summary
                  className={`${link} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
                >
                  <span className="flex items-center gap-1.5 px-1.5 py-0.5 group-hover:bg-invert-bg group-hover:text-invert-fg">
                    Resources
                    <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                  </span>
                </summary>
                <div className="absolute top-full left-0 z-50 hidden w-48 border border-line bg-bg-raised p-1 group-open:block">
                  {[
                    ["Tutorials", "/tutorials"],
                    ["News", "/news"],
                    ["FAQ", "/faq"],
                    ["Press kit", "/press-kit"],
                  ].map(([label, href]) => (
                    <a
                      key={href}
                      href={href}
                      className="block px-3 py-2 text-muted hover:bg-invert-bg hover:text-invert-fg"
                    >
                      {label}
                    </a>
                  ))}
                </div>
              </details>
            </li>
            <Item href="/download">Download</Item>
            <Item href="/support">Support</Item>

            <li className="ml-1.5 flex items-stretch border-l border-line pl-1.5">
              <a
                href="/apps"
                className="flex h-full items-center px-2.5 hud-label whitespace-nowrap text-muted transition-colors hover:text-ink"
              >
                <span className="flex items-center gap-1.5 px-1.5 py-0.5">
                  Apps
                </span>
              </a>
            </li>
          </ul>
        </div>

        <div className="flex shrink-0 items-stretch">
          <a
            href="/pricing"
            className={`${link} hidden md:flex`}
          >
            Pricing
          </a>

          <a
            href={LINKS.discord}
            aria-label="Discord"
            className="hidden w-12 items-center justify-center border-l border-line text-muted hover:bg-invert-bg hover:text-invert-fg md:flex"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-4 w-4">
              <path d="M19.3 5.6A16.4 16.4 0 0 0 15.4 4.4l-.2.4a12.9 12.9 0 0 1 3.8 1.9 14.6 14.6 0 0 0-13 0A12.9 12.9 0 0 1 9.8 4.8l-.2-.4A16.4 16.4 0 0 0 5.7 5.6C2.9 9.7 2.2 13.7 2.5 17.6a16.5 16.5 0 0 0 5 2.5l1-1.7c-.6-.2-1.1-.5-1.6-.8l.4-.3a11.7 11.7 0 0 0 11.4 0l.4.3c-.5.3-1 .6-1.6.8l1 1.7a16.5 16.5 0 0 0 5-2.5c.4-4.5-.7-8.4-3.2-12ZM8.9 15.2c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm6.2 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z" />
            </svg>
          </a>

          <div className="hidden items-stretch md:flex">
            <ThemeToggle />
          </div>
          <div className="flex items-stretch md:hidden">
            <ThemeToggle />
          </div>

          <a href={LINKS.app} className={cta}>
            Launch App
          </a>

          <details className="group flex items-stretch lg:hidden">
            <summary className="flex w-12 cursor-pointer list-none items-center justify-center border-l border-line text-muted hover:bg-invert-bg hover:text-invert-fg [&::-webkit-details-marker]:hidden">
              <span className="sr-only">Menu</span>
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
                {[
                  ["Home", "/"],
                  ["Image", "/image"],
                  ["Video", "/video"],
                  ["Download", "/download"],
                  ["Support", "/support"],
                  ["Apps", "/apps"],
                  ["Pricing", "/pricing"],
                ].map(([label, href]) => (
                  <li key={href}>
                    <a
                      href={href}
                      className="block px-3 py-2.5 text-muted hover:bg-invert-bg hover:text-invert-fg"
                    >
                      {label}
                    </a>
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
