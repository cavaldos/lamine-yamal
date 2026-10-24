import { LEGEND } from "@/lib/goals";

export default function ShotLegend() {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
      {LEGEND.map(([label, color]) => (
        <span key={label} className="hud-label flex items-center gap-2 text-muted">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          {label}
        </span>
      ))}
      <span className="hud-label text-faint">Kích thước = xG</span>
    </div>
  );
}
