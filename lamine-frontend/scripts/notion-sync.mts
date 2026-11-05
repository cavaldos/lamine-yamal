// Copies the site's JSON data into its Notion databases:
//   goals       data/lamine_yamal_goals_assists.json → NOTION_GOALS_DATABASE_ID
//   highlights  data/lamine_yamal_highlights.json    → NOTION_HIGHLIGHTS_DATABASE_ID
//
//   npm run notion:sync                     every database whose id is set in .env
//   npm run notion:sync -- highlights       just one (goals | highlights)
//   npm run notion:sync -- --dry-run        show what would change, write nothing
//
// Safe to run again: rows are matched by their key column ("Goal ID" / "Highlight ID"),
// so an item is created once and updated after that. Missing columns are added first.
// The JSON wins for the columns it fills; optional columns (YouTube / Clip Time for a
// goal, translations / Clip Time for a highlight) are left alone unless the JSON sets
// them, so what was added in Notion is kept. Rows that aren't in the JSON are never touched.

import { readFileSync } from "node:fs";
import type { PageObjectResponse } from "@notionhq/client";
import * as goals from "../lib/notion/goal-schema.ts";
import * as highlights from "../lib/notion/highlight-schema.ts";
import { allRows, DATABASES, notionEnv, NotionSetupError, openDb, type DatabaseName } from "../lib/notion/db.ts";
import type { ColumnType, Properties } from "../lib/notion/props.ts";

type Table<R> = {
  file: string; // under data/
  list: string; // the array's name in that file
  keyColumn: string;
  columnTypes: Record<string, ColumnType>;
  isRaw: (v: unknown) => v is R;
  key: (r: R) => string;
  label: (r: R) => string;
  toProperties: (r: R, titleColumn: string) => Properties;
  fromPage: (page: PageObjectResponse) => R | null;
};

const TABLES: { [N in DatabaseName]: Table<N extends "goals" ? goals.RawGoal : highlights.RawHighlight> } = {
  goals: {
    file: "lamine_yamal_goals_assists.json",
    list: "goals",
    keyColumn: goals.COLUMNS.key,
    columnTypes: goals.COLUMN_TYPES,
    isRaw: goals.isRawGoal,
    key: goals.goalKey,
    label: (g) => `${g.date} ${g.team} vs ${g.opponent} ${g.minute}`,
    toProperties: goals.toProperties,
    fromPage: goals.fromPage,
  },
  highlights: {
    file: "lamine_yamal_highlights.json",
    list: "highlights",
    keyColumn: highlights.COLUMNS.key,
    columnTypes: highlights.COLUMN_TYPES,
    isRaw: highlights.isRawHighlight,
    key: highlights.highlightKey,
    label: (h) => `${highlights.highlightKey(h)} ${h.title}`,
    toProperties: highlights.toProperties,
    fromPage: highlights.fromPage,
  },
};

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

async function sync<R>(name: DatabaseName, table: Table<R>) {
  console.log(`\n== ${name}`);
  const file = new URL(`../data/${table.file}`, import.meta.url);
  const items = (JSON.parse(readFileSync(file, "utf8"))[table.list] as unknown[]).filter(table.isRaw);

  const db = await openDb(name);
  console.log(`Notion database ready: ${Object.keys(db.columns).length} columns, title column "${db.titleColumn}".`);

  // 1. Columns. Add the missing ones; refuse to change the type of one that exists.
  const clashes = Object.entries(table.columnTypes).filter(
    ([col, type]) => db.columns[col] && db.columns[col] !== type,
  );
  if (clashes.length) {
    throw new NotionSetupError(
      "These columns exist with a different type. Rename or delete them in Notion, then run again:\n" +
        clashes.map(([col, type]) => `  - "${col}" is ${db.columns[col]}, needs ${type}`).join("\n"),
    );
  }
  const missing = Object.entries(table.columnTypes).filter(([col]) => !db.columns[col]);
  if (missing.length) {
    console.log(`${dryRun ? "Would add" : "Adding"} ${missing.length} columns: ${missing.map(([c]) => c).join(", ")}`);
    if (!dryRun) {
      await db.notion.dataSources.update({
        data_source_id: db.dataSourceId,
        properties: Object.fromEntries(missing.map(([col, type]) => [col, { [type]: {} }])),
      } as Parameters<typeof db.notion.dataSources.update>[0]);
      missing.forEach(([col, type]) => (db.columns[col] = type));
    }
  }

  // 2. Rows already in Notion, by key.
  const rows = await allRows(db);
  const byKey = new Map<string, PageObjectResponse>();
  for (const row of rows) {
    const cell = row.properties[table.keyColumn];
    const id = cell?.type === "rich_text" ? cell.rich_text.map((t) => t.plain_text).join("") : "";
    if (id) byKey.set(id, row);
  }
  const others = rows.length - byKey.size;

  // 3. Create or update each item, one request at a time (Notion allows ~3 per second;
  // the SDK waits and retries when it's told to slow down).
  let created = 0;
  let updated = 0;
  let same = 0;
  for (const [i, item] of items.entries()) {
    const props = table.toProperties(item, db.titleColumn);
    const row = byKey.get(table.key(item));
    const label = `${String(i + 1).padStart(3)}/${items.length} ${table.label(item)}`;

    if (!row) {
      created++;
      console.log(`+ ${label}`);
      if (!dryRun) {
        await db.notion.pages.create({
          parent: { type: "data_source_id", data_source_id: db.dataSourceId },
          properties: props,
        });
      }
      continue;
    }

    // Skip rows that already match, comparing only the columns this item writes.
    const current = table.fromPage(row);
    const now: Properties = current ? table.toProperties(current, db.titleColumn) : {};
    if (current && Object.keys(props).every((col) => JSON.stringify(now[col]) === JSON.stringify(props[col]))) {
      same++;
      continue;
    }
    updated++;
    console.log(`~ ${label}`);
    if (!dryRun) await db.notion.pages.update({ page_id: row.id, properties: props });
  }

  const verb = dryRun ? "Dry run, nothing written:" : "Done:";
  console.log(`${verb} ${created} created, ${updated} updated, ${same} unchanged (${items.length} in the JSON).`);
  if (others) console.log(`${others} other row(s) have no ${table.keyColumn}; they were left as they are.`);
}

async function main() {
  const asked = args.filter((a) => !a.startsWith("--"));
  const unknown = asked.filter((a) => !(a in TABLES));
  if (unknown.length) {
    throw new NotionSetupError(`Unknown database "${unknown.join(", ")}". Use: ${Object.keys(TABLES).join(" | ")}`);
  }
  const all = Object.keys(TABLES) as DatabaseName[];
  // Without a name, sync every database that is set up and say which were skipped.
  const names = asked.length ? (asked as DatabaseName[]) : all.filter((n) => notionEnv(n));
  for (const n of all.filter((n) => !asked.length && !names.includes(n))) {
    console.log(`Skipping ${n}: ${DATABASES[n]} is not set in .env.`);
  }
  if (!names.length) throw new NotionSetupError("Set NOTION_TOKEN and a database id in .env first.");
  for (const n of names) await sync(n, TABLES[n] as Table<unknown>);
}

main().catch((e: unknown) => {
  console.error(`\nSync failed: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
