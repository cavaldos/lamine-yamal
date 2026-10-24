"use client";

import { useEffect, useState } from "react";
import FlatJourney from "@/components/sections/journey/flat-journey";
import FlightJourney from "@/components/sections/journey/flight-journey";

// The journey: a 3D scroll flight through each chapter, or a plain timeline
// for visitors who ask for reduced motion. Chapters live in JOURNEY (lib/content.ts).
export default function JourneySection() {
  const [flat, setFlat] = useState(false);

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setFlat(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return flat ? <FlatJourney /> : <FlightJourney />;
}
