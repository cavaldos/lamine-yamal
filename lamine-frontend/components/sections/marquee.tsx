import PauseOffscreen from "@/components/ui/pause-offscreen";

const ITEMS = [
  "Rocafonda · 304",
  "La Masia",
  "Nº 10",
  "EURO 2024",
  "Golden Boy",
  "Kopa Trophy ×2",
  "World Cup 2026",
  "La Liga ×3",
  "Copa del Rey",
  "Supercopa ×2",
];

// Endless ticker under the hero. Two copies of the list make the loop seamless.
export default function Marquee() {
  return (
    <PauseOffscreen className="marquee relative z-10 border-y border-line bg-bg">
      {[0, 1].map((copy) => (
        <ul key={copy} aria-hidden={copy === 1} className="marquee-track items-center">
          {ITEMS.map((item, i) => (
            <li key={item} className="hud-label flex items-center px-6 py-3 whitespace-nowrap text-muted">
              <span aria-hidden className={`mr-6 ${i % 2 ? "text-garnet-ink" : "text-accent-ink"}`}>
                ▪
              </span>
              {item}
            </li>
          ))}
        </ul>
      ))}
    </PauseOffscreen>
  );
}
