import { LEGEND } from "@/lib/goals";
import { useDict } from "@/lib/i18n/provider";

export default function ShotLegend() {
  const t = useDict().goals;
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {LEGEND.map(([key, color]) => (
        <span key={key} className="hud-label flex items-center gap-2 text-muted">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          {t[key]}
        </span>
      ))}
      <span className="hud-label text-faint">{t.legendSize}</span>
    </div>
  );
}
