// The page's sections, in the order they appear. The nav, the footer, the ruler
// rail and every section header read from this list, so reordering or renaming a
// section is done here (plus moving its component in app/page.tsx).
// `label` is the Vietnamese title in the section header; `nav` is the English
// name used by navigation (nav bar, menu, footer, ruler).

export type SectionId = "hero" | "trophies" | "goals" | "highlights" | "archive" | "journey";

export type SectionMeta = {
  id: SectionId;
  num: string; // the "02" in the sticky header
  label: string;
  nav: string;
  hint?: string; // right side of the sticky header
};

export const SECTIONS: SectionMeta[] = [
  { id: "hero", num: "00", label: "Lamine", nav: "Lamine" },
  { id: "trophies", num: "01", label: "Danh hiệu", nav: "Trophies", hint: "CLB · Đội tuyển · Cá nhân" },
  { id: "goals", num: "02", label: "Bàn thắng", nav: "Goals", hint: "Bản đồ cú sút · La Liga" },
  { id: "highlights", num: "03", label: "Highlight", nav: "Highlights", hint: "Bấm để xem ngay trên trang" },
  { id: "archive", num: "04", label: "Tư liệu", nav: "Archive", hint: "Ảnh & video thời thơ ấu" },
  { id: "journey", num: "05", label: "Hành trình", nav: "Journey" },
];

export const sectionMeta = (id: SectionId) => SECTIONS.find((s) => s.id === id)!;

// Everything except the hero, for menus.
export const NAV_SECTIONS = SECTIONS.filter((s) => s.id !== "hero");
