/** One place to ask "should this move at all?" — every effect in components/ checks it. */
export const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;