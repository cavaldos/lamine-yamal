// A photo slot. With `src` it shows the picture; without one it shows a styled
// "ẢNH DEMO" plate so the layout reads correctly until real photos arrive.
export default function PhotoFrame({
  src,
  alt,
  label,
  year,
  tag = true,
  className = "",
}: {
  src?: string;
  alt: string;
  label?: string;
  year?: string;
  tag?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-bg-sunken ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div role="img" aria-label={`Ảnh demo: ${alt}`} className="absolute inset-0">
          <div className="stripes absolute inset-0 opacity-35" />
          <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_30%_25%,color-mix(in_srgb,var(--gold)_22%,transparent),transparent_70%)]" />
          <div className="absolute inset-0 bg-linear-to-t from-bg-sunken via-bg-sunken/40 to-transparent" />
          {year && (
            <span
              aria-hidden
              className="text-outline absolute -right-[0.06em] -bottom-[0.2em] font-display text-[clamp(4rem,14vw,9rem)] leading-none font-bold tracking-[-0.04em]"
            >
              {year}
            </span>
          )}
          {tag && <span className="hud-label absolute top-3 left-3 border border-line-strong bg-bg/80 px-2 py-1 text-muted">
            Ảnh demo
          </span>}
          {label && <span className="hud-label absolute bottom-3 left-3 max-w-[70%] text-faint">{label}</span>}
        </div>
      )}
      <div className="grain" />
    </div>
  );
}
