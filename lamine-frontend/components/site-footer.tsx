import { LINKS, Logo, BRAND } from "./brand";

const COLUMNS: [string, [string, string][]][] = [
  [
    "Product",
    [
      ["Download", "/download"],
      ["Pricing", "/pricing"],
      ["Open App", LINKS.app],
    ],
  ],
  [
    "Apps",
    [
      ["All apps", "/apps"],
      ...[
        "Photo",
        "Vector",
        "Film",
        "Light",
        "PDF",
        "Effects",
        "Layout",
        "Frames",
        "Words",
        "Sound",
        "Slides",
        "CAD",
        "Sheets",
      ].map((n): [string, string] => [`${n} Lab`, `/apps/${n.toLowerCase()}`]),
    ],
  ],
  [
    "Resources",
    [
      ["Tutorials", "/tutorials"],
      ["News", "/news"],
      ["FAQ", "/faq"],
      ["Press Kit", "/press-kit"],
      ["Support", "/support"],
    ],
  ],
  [
    "Community",
    [
      ["Discord", LINKS.discord],
      ["GitHub", LINKS.repo],
      ["YouTube", "#youtube"],
      ["Instagram", "#instagram"],
      ["TikTok", "#tiktok"],
    ],
  ],
];

export default function SiteFooter() {
  return (
    <footer className="relative border-t border-line">
      <div className="mx-auto max-w-[1280px] border-x border-line">
        <div className="grid gap-px bg-line md:grid-cols-4 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
          <div className="bg-bg p-6 md:col-span-4 md:p-10 lg:col-span-1">
            <Logo className="h-[30px] w-auto text-ink-strong" />
            <p className="mt-4 max-w-xs leading-relaxed text-muted">
              An open studio for directing AI images and video.
            </p>
            <a
              href={`mailto:${LINKS.email}`}
              className="hud-label mt-6 inline-block text-faint hover:text-ink"
            >
              {LINKS.email}
            </a>
          </div>

          {COLUMNS.map(([heading, links]) => (
            <nav key={heading} aria-label={heading} className="bg-bg p-6 md:p-8">
              <p className="hud-label text-faint">{heading}</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {links.map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="text-[17px] leading-6 text-muted hover:text-ink">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-2 border-x border-line px-6 py-4 md:flex-row md:items-center md:justify-between md:px-10">
          <p className="hud-label text-faint">
            © 2026 {BRAND}
          </p>
          <p className="hud-label text-faint">Built by makers, for makers</p>
        </div>
      </div>
    </footer>
  );
}
