import Link from "next/link";
import GoalMap from "@/components/sections/goals/goal-map";
import { Play } from "@/components/ui/icons";
import Section, { SectionIntro } from "@/components/ui/section";
import { ctaPrimary, h2, lead, serif } from "@/lib/styles";

// Shot map of every goal with filters and per-goal detail.
export default function GoalsSection() {
  return (
    <Section id="goals">
      <SectionIntro>
        <h2 data-reveal="true" className={h2}>
          Mọi bàn thắng, <span className={serif}>đúng chỗ</span> nó được ghi.
        </h2>
        <p data-reveal="true" className={lead}>
          Rê chuột lên một chấm để xem thông tin, bấm vào là phát ngay video bàn thắng đó. Lọc theo mùa giải hoặc chân
          sút — cái chân trái ấy chiếm gần như tất cả.
        </p>
        <Link href="/goals" data-reveal="true" className={`mt-8 ${ctaPrimary}`}>
          <Play className="h-3.5 w-3.5" /> Xem tất cả video bàn thắng
        </Link>
      </SectionIntro>
      <GoalMap />
      <p className="hud-label border-t border-line px-6 py-3 text-faint md:px-10">
        * Bản đồ cú sút chỉ có vị trí và xG của các bàn La Liga; danh sách gồm mọi giải đấu
      </p>
    </Section>
  );
}
