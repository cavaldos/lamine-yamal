import type Lenis from "lenis";

// Magnetic section headers: when a slow scroll comes to rest with a section
// header just short of (or just past) the sticky nav, glide it flush under the
// nav. Fast scrolls are left alone so flinging through the page stays free.
//
// The decision is made as soon as input stops, not after Lenis's smoothing
// tail has finished: we look at where the page *will* land (targetScroll) and
// redirect the glide straight to the header, so the pull starts mid-motion.

const INPUT_IDLE_MS = 60; // no wheel/touch input for this long = the user let go
const NATIVE_IDLE_MS = 90; // keyboard / scrollbar / touch momentum: page still this long
const SLOW_PX_PER_S = 1800; // recent peak speed; above this = "fast", no snap
const PEAK_MEMORY_MS = 350; // how long a burst of speed keeps counting as "fast"
const RANGE_PX = 150; // how far (either side) a header can be and still get pulled in
const RANGE_VH = 0.15; // ...capped at this share of the viewport on short screens
const SNAP_DURATION = 0.5;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function attachScrollMagnet(lenis: Lenis, navH: number) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let lastY = lenis.animatedScroll;
  let lastT = performance.now();
  let speed = 0; // smoothed px/s
  let peak = 0; // recent fastest speed, fades out over PEAK_MEMORY_MS
  let moved = 0; // px the page moved since the last decision
  let byUser = false; // movement came from wheel/touch/keys, not a scrollTo
  let timer = 0;

  // Distance between the nav and the nearest header's section top, measured at
  // the point the page is heading to. Null when no header is close enough.
  const nearestOffset = (ahead: number) => {
    const range = Math.min(RANGE_PX, window.innerHeight * RANGE_VH);
    let best: number | null = null;
    for (const header of document.querySelectorAll<HTMLElement>("[data-snap-header]")) {
      const rect = (header.closest("section") ?? header).getBoundingClientRect();
      if (rect.height === 0) continue;
      const d = rect.top - ahead - navH;
      if (Math.abs(d) > range) continue;
      if (best === null || Math.abs(d) < Math.abs(best)) best = d;
    }
    return best;
  };

  const settle = () => {
    timer = 0;
    const snap = byUser && moved > 2 && peak < SLOW_PX_PER_S;
    moved = 0;
    byUser = false;
    if (!snap || reduceMotion.matches || lenis.isStopped || lenis.isTouching) return;

    // Where the current glide will stop (0 once the page is already still).
    const rest = lenis.isScrolling === "smooth" ? lenis.targetScroll : lenis.animatedScroll;
    const d = nearestOffset(rest - lenis.animatedScroll);
    if (d === null) return;
    const target = rest + d;
    if (Math.abs(target - lenis.animatedScroll) < 1) return;
    if (target < 0 || target > lenis.limit + 1) return;
    lenis.scrollTo(target, { duration: SNAP_DURATION, easing: easeOutCubic });
  };

  const arm = (ms: number) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(settle, ms);
  };

  const offScroll = lenis.on("scroll", () => {
    const now = performance.now();
    const y = lenis.animatedScroll;
    const dt = now - lastT;
    const dy = Math.abs(y - lastY);
    if (dt > 0) peak *= Math.exp(-dt / PEAK_MEMORY_MS);
    // Skip the first sample after a pause: its dt spans the pause, not motion.
    if (dt > 0 && dt < 100) {
      speed += ((dy / dt) * 1000 - speed) * 0.35;
      peak = Math.max(peak, speed);
    } else {
      speed = 0;
    }
    moved += dy;
    lastY = y;
    lastT = now;
    // Keyboard, scrollbar and touch momentum scroll natively. Lenis's own
    // smoothing tail ("smooth") must not re-arm, or we'd wait for it to end.
    if (lenis.isScrolling === "native") {
      byUser = true;
      arm(NATIVE_IDLE_MS);
    }
  });

  const offInput = lenis.on("virtual-scroll", () => {
    byUser = true;
    arm(INPUT_IDLE_MS);
  });

  return () => {
    window.clearTimeout(timer);
    offScroll();
    offInput();
  };
}
