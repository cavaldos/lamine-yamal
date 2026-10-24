import { LINKS, MARK_PATH, MARK_VIEWBOX, WORDMARK } from "@/components/brand";
import HeroOrb from "@/components/hero-orb";
import { Apple, ArrowUpRight, Github, Monitor, Play } from "@/components/icons";
import SceneArt from "@/components/scene-art";

// Feature demo clips live in /public/videos/features — replace them with your own footage.
const src = (name: string) => `/videos/features/${name}.webm`;

const ctaPrimary =
  "inline-flex h-12 w-fit items-center justify-center gap-2 bg-invert-bg px-6 font-mono text-[11px] font-bold tracking-[0.12em] whitespace-nowrap text-invert-fg uppercase transition-opacity duration-150 hover:opacity-80";

const ctaGhost =
  "invert-block inline-flex h-12 w-fit items-center justify-center gap-2 border border-line-strong bg-bg px-6 font-mono text-[11px] font-bold tracking-[0.12em] whitespace-nowrap text-ink uppercase transition-colors duration-150 hover:border-transparent";

const h2 =
  "max-w-3xl font-display text-4xl font-medium tracking-[-0.035em] text-ink-strong sm:text-5xl md:text-6xl";
const lead = "mt-5 max-w-xl text-lg leading-relaxed text-muted";
const serif = "font-serif font-normal italic";

const MARQUEE = [
  "Scene Blocking",
  "Depth Layers",
  "Photo to Set",
  "Camera Paths",
  "Pose Rigs",
  "Photo to Mesh",
  "Matte Cutouts",
  "Light Painting",
  "Shot Boards",
];

// [eyebrow, title, body, clip]
const FEATURES: [string, string, string, string][] = [
  [
    "Worlds",
    "Photo to set",
    "Turn a single photo into a set you can walk around. Shoot several angles in the same room and every object stays exactly where you left it.",
    "WorldLabs_Demo_2",
  ],
  [
    "Depth",
    "Stage it in 3D",
    "Arrange backdrops, props and foreground cutouts on real depth planes, so a handful of flat images settles into one believable scene.",
    "Panel",
  ],
  [
    "Layers",
    "Paint over the frame",
    "Stack images, mask them, cut them out and sketch on top until the composition finally matches the one in your head.",
    "Editor",
  ],
  [
    "Mesh",
    "Photo to mesh",
    "Lift any picture into rough geometry and block the shot with solid shapes instead of piling on adjectives.",
    "Make_3D",
  ],
  [
    "Mixed",
    "One canvas, any asset",
    "Cutouts, captured sets and meshes share a single canvas, so the layout stays deliberate from the first sketch to the final frame.",
    "Mixed",
  ],
  [
    "Posing",
    "Pose your cast",
    "Bend arms, turn heads and lock the eyeline before you render, so the performance and the camera agree on the first try.",
    "Character-Pose",
  ],
  [
    "Mattes",
    "One-click cutouts",
    "Lift a clean subject off any background and drop it into the scene as an asset you can reuse anywhere.",
    "Background",
  ],
];

const OWNERSHIP: [string, string, string, boolean][] = [
  ["A", "Open code", "Every line is public. Audit it, fork it, bend it to fit your pipeline.", true],
  ["B", "No meter", "No plan tiers and no credit counter ticking down while you experiment.", false],
  [
    "C",
    "Direct line",
    "Requests go from your machine to the model you choose. Nothing is kept in between.",
    false,
  ],
];

// Add a YouTube id to link a real film; without one the card shows a generated still.
const FILMS: { title: string; youtube?: string; seed: number }[] = [
  { title: "Community film #1", seed: 4 },
  { title: "Community film #2", seed: 11 },
  { title: "Community film #3", seed: 19 },
];

function Section({
  id,
  num,
  label,
  hint,
  eyebrow = true,
  children,
}: {
  id: string;
  num: string;
  label: string;
  hint?: string;
  eyebrow?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} data-choreo="true" className="relative">
      <span
        aria-hidden
        data-draw-rule="true"
        className="absolute inset-x-0 top-0 h-px origin-left bg-line"
      />
      <div className="relative mx-auto max-w-[1280px] border-x border-line">
        <span
          aria-hidden
          data-draw-tick="true"
          className="tick tick-half z-[31] -top-[5px] -left-[6px]"
        />
        <span
          aria-hidden
          data-draw-tick="true"
          className="tick tick-half z-[31] -top-[5px] -right-[5px]"
        />
        {eyebrow && (
          <div
            data-draw-eyebrow="true"
            className="sticky top-12 z-30 border-y border-line bg-bg/60 backdrop-blur-md"
          >
            <div className="flex items-center justify-between gap-4 px-6 py-3 md:px-10">
              <p className="hud-label text-muted">
                <span className="text-faint">{num}</span>
                <span aria-hidden className="mx-2 text-faint">
                  /
                </span>
                {label}
              </p>
              {hint && <p className="hud-label hidden text-faint sm:block">{hint}</p>}
            </div>
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

const glowText =
  "0 0 0.6vw color-mix(in srgb, var(--bg) 92%, transparent), 0 0.25vw 2.4vw color-mix(in srgb, var(--bg) 78%, transparent), 0 0.4vw 5vw color-mix(in srgb, var(--bg) 55%, transparent)";

function Wordmark() {
  const [, ...rest] = WORDMARK.split("");
  return (
    <div
      role="img"
      aria-label={WORDMARK}
      className="relative whitespace-pre text-ink-strong"
      style={{
        fontFamily: "var(--font-archivo), system-ui, sans-serif",
        fontWeight: 750,
        fontStretch: "125%",
        // Sized so the wordmark fills the 672px column exactly.
        fontSize: "15.1cqw",
        lineHeight: 1,
      }}
    >
      <span
        aria-hidden
        className="wm-letter inline-block text-center"
        style={{ paddingRight: "0.05em", animationDelay: "25ms", textShadow: glowText }}
      >
        <svg
          viewBox={MARK_VIEWBOX}
          fill="currentColor"
          aria-hidden
          style={{
            display: "inline-block",
            width: "0.83em",
            height: "0.7em",
            verticalAlign: "-0.006em",
            filter:
              "drop-shadow(0 0 0.3vw color-mix(in srgb, var(--bg) 85%, transparent)) drop-shadow(0 0.2vw 1.6vw color-mix(in srgb, var(--bg) 60%, transparent))",
          }}
        >
          <path d={MARK_PATH} />
        </svg>
      </span>
      {rest.map((char, i) => (
        <span
          key={i}
          aria-hidden
          className="wm-letter inline-block text-center"
          style={{ animationDelay: `${70 + i * 45}ms`, textShadow: glowText }}
        >
          {char}
        </span>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <main id="main">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section id="hero" className="relative">
        <div className="relative flex min-h-[calc(100svh-3rem)] flex-col">
          <HeroOrb />
          <div className="pointer-events-none relative z-40 mx-auto flex w-full max-w-[1280px] flex-1 flex-col items-center justify-center px-6 py-10 md:px-10">
            <div className="relative flex w-full max-w-2xl flex-col items-center text-center">
              <div
                aria-hidden
                className="absolute"
                style={{
                  inset: "-88px -128px",
                  background:
                    "radial-gradient(closest-side, color-mix(in srgb, var(--bg) 78%, transparent), transparent)",
                }}
              />

              <div className="pointer-events-none relative z-40 w-full" style={{ containerType: "inline-size" }}>
                <div
                  aria-hidden
                  className="absolute -inset-x-[6%] -inset-y-[34%]"
                  style={{
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    maskImage: "radial-gradient(closest-side, black 45%, transparent 100%)",
                    WebkitMaskImage: "radial-gradient(closest-side, black 45%, transparent 100%)",
                  }}
                />
                <Wordmark />
              </div>

              <h1
                data-intro="true"
                style={{ animationDelay: "620ms" }}
                className="relative mt-8 font-display text-3xl font-medium tracking-[-0.03em] text-ink-strong sm:text-4xl"
              >
                Direct the shot, <span className={`${serif} text-muted`}>not the prompt.</span>
              </h1>
              <p
                data-intro="true"
                style={{ animationDelay: "760ms" }}
                className="relative mt-4 max-w-md text-lg leading-relaxed text-muted"
              >
                Aircraft is a free, open studio for composing AI images and video by hand. Stage
                it, light it, then render.
              </p>

              <div
                data-intro="true"
                style={{ animationDelay: "880ms" }}
                className="pointer-events-auto relative mt-7 flex flex-wrap items-center justify-center gap-3"
              >
                <a href="/download" className={ctaPrimary}>
                  <Apple className="h-4 w-4" /> <Monitor className="h-4 w-4" />
                  Download free
                </a>
                <a href={LINKS.app} className={ctaGhost}>
                  Open in browser
                </a>
              </div>

              <div
                data-intro="true"
                style={{ animationDelay: "1000ms" }}
                className="pointer-events-auto relative mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
              >
                <a
                  href={LINKS.repo}
                  className="hud-label flex items-center gap-1.5 text-faint hover:text-ink"
                >
                  <Github className="h-3.5 w-3.5" /> Source on GitHub
                </a>
                <p className="hud-label text-faint">macOS · Windows · Web</p>
                <p className="hud-label text-faint">Free, no account</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="marquee relative z-10 border-t border-line bg-bg">
        {[0, 1].map((copy) => (
          <ul key={copy} aria-hidden={copy === 1} className="marquee-track items-center">
            {MARQUEE.map((item) => (
              <li key={item} className="hud-label flex items-center px-6 py-3 whitespace-nowrap text-muted">
                <span aria-hidden className="mr-6 text-accent-ink">
                  ▪
                </span>
                {item}
              </li>
            ))}
          </ul>
        ))}
      </div>

      {/* ── 01 Toolkit ───────────────────────────────────────── */}
      <Section id="features" num="01" label="Toolkit" hint="Recorded in the app">
        <div className="px-6 py-14 md:px-10 md:py-20">
          <h2 data-reveal="true" className={`${h2} leading-[1.02]`}>
            Frame it <span className={serif}>yourself,</span> then hit render.
          </h2>
          <p data-reveal="true" className={lead}>
            A text box guesses. A stage does what it is told. Move the camera, stack the layers,
            set the light, and let the model fill in the pixels.
          </p>
        </div>

        <div className="grid gap-px border-t border-line bg-line md:grid-cols-2">
          {FEATURES.map(([label, title, body, video], i) => (
            <article key={title} data-reveal="true" className="bg-bg">
              <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-2.5 md:px-8">
                <p className="hud-label text-muted">{label}</p>
                <p className="hud-label text-faint">{String(i + 1).padStart(2, "0")}</p>
              </div>
              <div className="relative aspect-video w-full overflow-hidden bg-bg-sunken">
                <video
                  src={src(video)}
                  className="absolute inset-0 h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label={`${title} demo`}
                />
              </div>
              <div className="px-6 py-6 md:px-8">
                <h3 className="font-display text-2xl font-medium tracking-[-0.02em] text-ink-strong">
                  {title}
                </h3>
                <p className="mt-2 max-w-xl leading-relaxed text-muted">{body}</p>
              </div>
            </article>
          ))}

          <a data-reveal="true" href={LINKS.app} className="group flex flex-col bg-bg">
            <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-2.5 md:px-8">
              <p className="hud-label text-muted">Everything else</p>
              <p className="hud-label text-faint">08</p>
            </div>
            <div className="relative flex aspect-video w-full flex-col items-center justify-center gap-4 overflow-hidden bg-bg-sunken">
              <span className="flex h-14 w-14 items-center justify-center border border-line-strong text-ink transition-colors group-hover:bg-invert-bg group-hover:text-invert-fg">
                <ArrowUpRight className="h-6 w-6" />
              </span>
              <p className="hud-label text-faint">Open in browser</p>
              <span aria-hidden className="tick top-2 left-2 opacity-60" />
              <span aria-hidden className="tick right-2 bottom-2 opacity-60" />
            </div>
            <div className="px-6 py-6 md:px-8">
              <h3 className="font-display text-2xl font-medium tracking-[-0.02em] text-ink-strong">
                Open the full studio
              </h3>
              <p className="mt-2 max-w-xl leading-relaxed text-muted">
                Every model and every tool runs in a browser tab. Nothing to install.
              </p>
            </div>
          </a>
        </div>
      </Section>

      {/* ── 02 Ownership ─────────────────────────────────────── */}
      <Section id="ownership" num="02" label="Ownership" hint="Open source · Free">
        <div className="px-6 py-14 md:px-10 md:py-20">
          <h2 data-reveal="true" className={`${h2} leading-[1.02]`}>
            Own your <span className={serif}>tools</span> outright.
          </h2>
          <p data-reveal="true" className={lead}>
            No seats, no meters, no platform skimming the middle. Install it once and it keeps
            working on your machine.
          </p>
        </div>

        <div className="grid gap-px border-t border-line bg-line md:grid-cols-3">
          {OWNERSHIP.map(([letter, title, body, cta]) => (
            <article key={letter} data-reveal="true" className="bg-bg p-6 md:p-8">
              <p className="hud-label text-faint">{letter}</p>
              <h3 className="mt-6 font-display text-2xl font-medium tracking-[-0.02em] text-ink-strong">
                {title}
              </h3>
              <p className="mt-2 leading-relaxed text-muted">{body}</p>
              {cta && (
                <a
                  href={LINKS.repo}
                  className="invert-block mt-6 inline-flex w-fit items-center gap-1.5 border border-line-strong bg-bg px-3 py-1.5 font-mono text-[11px] font-medium tracking-[0.12em] whitespace-nowrap text-ink uppercase transition-colors duration-150 hover:border-transparent"
                >
                  <Github className="h-3.5 w-3.5" /> View source
                </a>
              )}
            </article>
          ))}
        </div>
      </Section>

      {/* ── 03 Showcase ──────────────────────────────────────── */}
      <Section id="made-with" num="03" label="Showcase" hint="Community reel">
        <div className="px-6 py-14 md:px-10 md:py-20">
          <h2 data-reveal="true" className={`${h2} leading-[1.02]`}>
            Made <span className={serif}>in</span> Aircraft.
          </h2>
        </div>

        <div className="grid gap-px border-t border-line bg-line md:grid-cols-3">
          {FILMS.map((film, i) => (
            <figure key={film.title} data-reveal="true" className="bg-bg">
              <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-2.5">
                <figcaption className="hud-label text-muted">Community film</figcaption>
                <p className="hud-label text-faint">{String(i + 1).padStart(2, "0")}</p>
              </div>
              <div className="relative aspect-video w-full overflow-hidden bg-bg-sunken">
                <a
                  href={film.youtube ? `https://www.youtube.com/watch?v=${film.youtube}` : "#"}
                  className="group absolute inset-0 h-full w-full"
                  aria-label={`Play video: ${film.title}`}
                >
                  {film.youtube ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://i.ytimg.com/vi/${film.youtube}/hqdefault.jpg`}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <SceneArt
                      seed={film.seed}
                      className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  )}
                  <span className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/10" />
                  <span className="hud-label absolute bottom-3 left-3 flex items-center gap-1.5 bg-invert-bg px-3 py-1.5 font-bold text-invert-fg">
                    <Play className="h-3.5 w-3.5" /> Play
                  </span>
                </a>
              </div>
            </figure>
          ))}
        </div>
      </Section>

      {/* ── Get started ──────────────────────────────────────── */}
      <Section id="start" num="04" label="Get started" eyebrow={false}>
        <div className="flex flex-col items-center px-6 py-24 text-center md:py-32">
          <p className="hud-label text-faint">Free to start · Nothing to renew</p>
          <h2
            data-reveal="true"
            className="mt-6 max-w-4xl font-display text-5xl font-medium tracking-[-0.04em] text-ink-strong sm:text-6xl md:text-7xl"
          >
            Ready for <span className={serif}>takeoff</span>.
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
            Grab the desktop build or open the studio in your browser. Your first frame is a few
            clicks away.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a href="/download" className={ctaPrimary}>
              Download for desktop
            </a>
            <a href={LINKS.app} className={ctaGhost}>
              Open in browser
            </a>
          </div>
        </div>
      </Section>
    </main>
  );
}
