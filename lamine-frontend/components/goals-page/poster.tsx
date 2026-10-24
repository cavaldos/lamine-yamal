import { poster, thumb, type GoalVideo } from "@/lib/goals";

// A clip's YouTube poster. Not every upload has the larger sizes, so a missing
// one falls back to the small default that always exists.
export default function Poster({
  video,
  large = false,
  className = "",
  eager = false,
}: {
  video: GoalVideo;
  large?: boolean;
  className?: string;
  eager?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={poster(video, large)}
      onError={(e) => {
        const img = e.currentTarget;
        const fallback = thumb(video.id);
        if (img.src !== fallback) img.src = fallback;
      }}
      alt=""
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={className}
    />
  );
}
