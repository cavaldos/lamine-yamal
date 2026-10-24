export const BRAND = "Lamine Yamal";
export const WORDMARK = "LAMINE YAMAL";

export const LINKS = {
  barca: "https://www.youtube.com/@fcbarcelona",
  laliga: "https://www.youtube.com/@LaLiga",
  instagram: "https://www.instagram.com/lamineyamal/",
};

// "LY" monogram: a squared L and a Y whose stem carries the weight.
export const MARK_VIEWBOX = "0 0 120 84";
export const MARK_PATH = "M0 0H22V62H50V84H0ZM56 0H79L88 22L97 0H120L99 46V84H77V46Z";

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox={MARK_VIEWBOX} fill="currentColor" aria-hidden className={className}>
      <path d={MARK_PATH} />
    </svg>
  );
}
