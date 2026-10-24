import { PLAYER } from "@/lib/content";

const LINES = ["LAMINE", "YAMAL"];

const glowText =
  "0 0 0.6vw color-mix(in srgb, var(--bg) 92%, transparent), 0 0.25vw 2.4vw color-mix(in srgb, var(--bg) 78%, transparent), 0 0.4vw 5vw color-mix(in srgb, var(--bg) 55%, transparent)";

// Two-line title; each letter rises in on load with a short stagger.
// Must sit inside a `container-type: inline-size` box: it sizes itself in cqw.
export default function Wordmark() {
  let k = 0;
  return (
    <div
      role="img"
      aria-label={PLAYER.name}
      className="relative text-ink-strong"
      style={{
        fontFamily: "var(--font-archivo), system-ui, sans-serif",
        fontWeight: 800,
        fontStretch: "125%",
        // Sized so "LAMINE" fills the column.
        fontSize: "17.2cqw",
        whiteSpace: "nowrap",
        lineHeight: 0.86,
        letterSpacing: "-0.02em",
      }}
    >
      {LINES.map((line, li) => (
        <div key={line}>
          {line.split("").map((char, ci, all) => (
            <span
              key={k}
              aria-hidden
              // Each letter animates on its own layer, so the blaugrana gradient is
              // painted per letter and offset to read as one continuous sweep.
              className={`wm-letter inline-block ${li === 1 ? "text-blaugrana-letter" : ""}`}
              style={{
                animationDelay: `${40 + k++ * 50}ms`,
                textShadow: li === 0 ? glowText : undefined,
                ...(li === 1 && {
                  backgroundSize: `${all.length * 100}% 100%`,
                  backgroundPosition: `${(ci / (all.length - 1)) * 100}% 0`,
                }),
              }}
            >
              {char}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
