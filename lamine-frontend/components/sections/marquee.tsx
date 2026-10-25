import PauseOffscreen from "@/components/ui/pause-offscreen";
import { getDictionary } from "@/lib/i18n/get-dictionary";

// Endless ticker under the hero. Two copies of the list make the loop seamless.
export default async function Marquee() {
  const { marquee } = await getDictionary();
  return (
    <PauseOffscreen className="marquee relative z-10 border-y border-line bg-bg">
      {[0, 1].map((copy) => (
        <ul key={copy} aria-hidden={copy === 1} className="marquee-track items-center">
          {marquee.map((item, i) => (
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
