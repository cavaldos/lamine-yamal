import type { CreatePageParameters, PageObjectResponse } from "@notionhq/client";

// Reading and writing Notion row properties, shared by every database schema.
// No imports beyond types: scripts/notion-sync.mts loads this file directly.

export type Properties = NonNullable<CreatePageParameters["properties"]>;
export type Prop = PageObjectResponse["properties"][string];

// The property types our columns use. Select options are created on first use.
export type ColumnType = "rich_text" | "date" | "select" | "checkbox" | "url" | "number";

// ---- writing ----

// Notion caps one rich text item at 2000 characters.
export const text = (s: string | null | undefined) => ({
  rich_text: s ? [{ type: "text" as const, text: { content: s.slice(0, 2000) } }] : [],
});
export const title = (s: string) => ({ title: [{ type: "text" as const, text: { content: s.slice(0, 2000) } }] });
// Select option names can't contain commas.
export const select = (s: string | null | undefined) => ({ select: s ? { name: s.replace(/,/g, " ") } : null });

// ---- reading ----

export const readText = (p: Prop | undefined) =>
  p?.type === "rich_text"
    ? p.rich_text.map((t) => t.plain_text).join("")
    : p?.type === "title"
      ? p.title.map((t) => t.plain_text).join("")
      : "";
export const readSelect = (p: Prop | undefined) => (p?.type === "select" ? (p.select?.name ?? "") : "");
export const readUrl = (p: Prop | undefined) => (p?.type === "url" ? p.url : null);
export const readNumber = (p: Prop | undefined) => (p?.type === "number" ? p.number : null);
export const readCheckbox = (p: Prop | undefined) => (p?.type === "checkbox" ? p.checkbox : false);
// The row's title, whatever the title column is called.
export const readTitle = (page: PageObjectResponse) =>
  readText(Object.values(page.properties).find((p) => p.type === "title"));

export const orNull = (s: string) => s || null;
