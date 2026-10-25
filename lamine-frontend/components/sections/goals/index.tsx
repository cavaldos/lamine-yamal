import Link from "next/link";
import GoalMap from "@/components/sections/goals/goal-map";
import { Play } from "@/components/ui/icons";
import Section from "@/components/ui/section";

// Shot map of every goal with filters and per-goal detail.
export default function GoalsSection() {
  return (
    <Section id="goals">
      <GoalMap
        action={
          <Link
            href="/goals"
            className="inline-flex h-9 items-center gap-2 bg-invert-bg px-3.5 font-mono text-[11px] font-bold tracking-[0.12em] whitespace-nowrap text-invert-fg uppercase transition-opacity duration-150 hover:opacity-80"
          >
            <Play className="h-3 w-3" /> Tất cả video bàn thắng
          </Link>
        }
      />
      <p className="hud-label border-t border-line px-6 py-3 text-faint md:px-10">
        * Bản đồ cú sút chỉ có vị trí và xG của các bàn La Liga; danh sách gồm mọi giải đấu
      </p>
    </Section>
  );
}
