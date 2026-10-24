// Brand + link placeholders. Swap these for your own product.
export const BRAND = "Aircraft";
export const WORDMARK = "AIRCRAFT";

export const LINKS = {
  app: "#",
  repo: "#",
  discord: "#",
  email: "hello@example.com",
};

// Delta-wing "A": the first letter of the wordmark and the logo.
export const MARK_VIEWBOX = "0 0 100 84";
export const MARK_PATH = "M50 0 100 84 66 84 50 58 34 84 0 84Z";

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox={MARK_VIEWBOX} fill="currentColor" aria-hidden className={className}>
      <path d={MARK_PATH} />
    </svg>
  );
}
