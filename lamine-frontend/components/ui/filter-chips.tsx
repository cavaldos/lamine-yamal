// A labelled row of toggle buttons; exactly one is pressed.
export default function FilterChips({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: string[];
  value: number;
  onChange: (i: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      <span className="hud-label w-20 shrink-0 text-faint">{label}</span>
      {items.map((it, i) => (
        <button
          key={it}
          type="button"
          aria-pressed={value === i}
          onClick={() => onChange(i)}
          className="hud-label border border-line px-2.5 py-1.5 text-muted transition-colors duration-150 hover:border-line-strong hover:text-ink aria-pressed:border-transparent aria-pressed:bg-invert-bg aria-pressed:text-invert-fg"
        >
          {it}
        </button>
      ))}
    </div>
  );
}
