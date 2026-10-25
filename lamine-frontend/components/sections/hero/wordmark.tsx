import DepthText from "@/components/ui/depth-text";
import { PLAYER } from "@/lib/content";

const LINES = ["LAMINE", "YAMAL"];

// Line one is white ink; line two is the blaugrana sweep. The extrusion behind
// each is a darker blend of the same colours, so it reads as solid type.
const LINE_STYLE = [
  {
    faceColor: "var(--ink-strong)",
    depthColor: "color-mix(in srgb, var(--accent) 38%, var(--bg))",
    faceStyle: undefined,
  },
  {
    faceColor: "var(--garnet)",
    depthColor: "color-mix(in srgb, var(--accent) 55%, black)",
    // Background-clipped text: the shadow would show through the transparent fill.
    faceStyle: {
      backgroundImage: "linear-gradient(100deg, var(--accent) 0%, var(--garnet) 60%, var(--gold) 100%)",
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
      textShadow: "none",
    },
  },
] as const;

// Two-line title in layered 3D type that tilts toward the pointer; each line rises in on load.
// Must sit inside a `container-type: inline-size` box: it sizes itself in cqw.
export default function Wordmark() {
  return (
    <div
      role="img"
      aria-label={PLAYER.name}
      className="relative text-ink-strong"
      style={{
        fontFamily: "var(--font-archivo), system-ui, sans-serif",
        fontStretch: "125%",
        lineHeight: 0.86,
      }}
    >
      {LINES.map((line, li) => (
        <div key={line} aria-hidden className="wm-letter" style={{ animationDelay: `${40 + li * 260}ms` }}>
          <DepthText
            text={line}
            // Sized so "LAMINE" fills the column.
            fontSize="17.2cqw"
            fontWeight={800}
            letterSpacing="-0.02em"
            layers={30}
            depth={2}
            tilt={9}
            {...LINE_STYLE[li]}
          />
        </div>
      ))}
    </div>
  );
}
