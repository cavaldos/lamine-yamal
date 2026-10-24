import type { Metadata } from "next";
import GoalBrowser from "@/components/goals-page/goal-browser";
import GoalsHero from "@/components/goals-page/goals-hero";

export const metadata: Metadata = {
  title: "Bàn thắng — Lamine Yamal",
  description:
    "Tất cả bàn thắng La Liga của Lamine Yamal: tìm, lọc, lướt từng bàn hoặc xem liền mạch như một thước phim.",
};

// /goals — every goal as a video: grid, search and filters, and two ways to watch.
export default function GoalsPage() {
  return (
    <main id="main" className="relative">
      <div className="mx-auto max-w-[1280px] border-x border-line">
        <GoalsHero />
        <GoalBrowser />
      </div>
    </main>
  );
}
