import ChildhoodVideos from "@/components/sections/archive/childhood-videos";
import PhotoReel from "@/components/sections/archive/photo-reel";
import Section, { SectionIntro } from "@/components/ui/section";
import { h2, lead, serif } from "@/lib/styles";

// Childhood archive: intro, a pinned horizontal photo reel, then youth videos.
// The reel sits between two framed blocks because it needs the full page width.
export default function ArchiveSection() {
  return (
    <>
      <Section id="archive">
        <SectionIntro>
          <h2 data-reveal="true" className={h2}>
            Trước khi <span className={serif}>cả thế giới</span> biết tên.
          </h2>
          <p data-reveal="true" className={lead}>
            Rocafonda, La Masia và những giải đấu trẻ — album ảnh và các thước phim từ khi Lamine còn là một cậu bé.
          </p>
        </SectionIntro>
      </Section>
      <PhotoReel />
      <ChildhoodVideos />
    </>
  );
}
