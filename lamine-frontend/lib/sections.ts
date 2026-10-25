import type { Dictionary } from "@/lib/i18n/dictionaries/en";

// The page's sections, in the order they appear. The nav, the footer, the ruler
// rail and every section header read from this list, so reordering a section is
// done here (plus moving its component in app/[lang]/page.tsx).
// The words (`label` in the section header, `nav` in the nav bar, menu, footer and
// ruler, `hint` on the right of the header) are in dict.sections, per language.

export type SectionId = "hero" | "trophies" | "goals" | "highlights" | "archive" | "journey";

export type SectionMeta = {
  id: SectionId;
  num: string; // the "02" in the sticky header
  label: string;
  nav: string;
  hint?: string;
};

const NUMS: [SectionId, string][] = [
  ["hero", "00"],
  ["trophies", "01"],
  ["goals", "02"],
  ["highlights", "03"],
  ["archive", "04"],
  ["journey", "05"],
];

export const sectionsFor = (dict: Dictionary): SectionMeta[] =>
  NUMS.map(([id, num]) => ({ id, num, ...dict.sections[id], hint: dict.sections[id].hint || undefined }));

export const sectionMeta = (dict: Dictionary, id: SectionId) => sectionsFor(dict).find((s) => s.id === id)!;

// Everything except the hero, for menus.
export const navSectionsFor = (dict: Dictionary) => sectionsFor(dict).filter((s) => s.id !== "hero");
