// Copies every goal from data/lamine_yamal_goals_assists.json into the Notion goals database.
//
//   npm run notion:sync              write to Notion
//   npm run notion:sync -- --dry-run show what would change, write nothing
//
// Safe to run again: rows are matched by their "Goal ID" column, so a goal is
// created once and updated after that. Missing columns are added first.
// The JSON wins for the columns it fills; YouTube / Clip Start / Clip End are
// left alone unless the JSON sets them, so clips added in Notion are kept.
// Rows that aren't in the JSON are never touched.

import { readFileSync } from "node:fs";
import { COLUMN_TYPES, COLUMNS, fromPage, goalKey, isRawGoal, toProperties } from "../lib/notion/goal-schema.ts";
import { allRows, NotionSetupError, openGoalsDb } from "../lib/notion/goals-db.ts";

const dryRun = process.argv.includes("--dry-run");

const file = new URL("../data/lamine_yamal_goals_assists.json", import.meta.url);
const goals = (JSON.parse(readFileSync(file, "utf8")).goals as unknown[]).filter(isRawGoal);

async function main() {
  const db = await openGoalsDb();
  console.log(`Notion database ready: ${Object.keys(db.columns).length} columns, title column "${db.titleColumn}".`);

  // 1. Columns. Add the missing ones; refuse to change the type of one that exists.
  const clashes = Object.entries(COLUMN_TYPES).filter(([name, type]) => db.columns[name] && db.columns[name] !== type);
  if (clashes.length) {
    throw new NotionSetupError(
      "These columns exist with a different type. Rename or delete them in Notion, then run again:\n" +
        clashes.map(([name, type]) => `  - "${name}" is ${db.columns[name]}, needs ${type}`).join("\n"),
    );
  }
  const missing = Object.entries(COLUMN_TYPES).filter(([name]) => !db.columns[name]);
  if (missing.length) {
    console.log(`${dryRun ? "Would add" : "Adding"} ${missing.length} columns: ${missing.map(([n]) => n).join(", ")}`);
    if (!dryRun) {
      await db.notion.dataSources.update({
        data_source_id: db.dataSourceId,
        properties: Object.fromEntries(missing.map(([name, type]) => [name, { [type]: {} }])),
      } as Parameters<typeof db.notion.dataSources.update>[0]);
      missing.forEach(([name, type]) => (db.columns[name] = type));
    }
  }

  // 2. Rows already in Notion, by Goal ID.
  const rows = await allRows(db);
  const byKey = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    const key = row.properties[COLUMNS.key];
    const id = key?.type === "rich_text" ? key.rich_text.map((t) => t.plain_text).join("") : "";
    if (id) byKey.set(id, row);
  }
  const others = rows.length - byKey.size;

  // 3. Create or update each goal, one request at a time (Notion allows ~3 per second;
  // the SDK waits and retries when it's told to slow down).
  let created = 0;
  let updated = 0;
  let same = 0;
  for (const [i, goal] of goals.entries()) {
    const key = goalKey(goal);
    const props = toProperties(goal, db.titleColumn);
    const row = byKey.get(key);
    const label = `${String(i + 1).padStart(3)}/${goals.length} ${goal.date} ${goal.team} vs ${goal.opponent} ${goal.minute}`;

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

    // Skip rows that already match, comparing only the columns this goal writes.
    const current = fromPage(row);
    const now = current
      ? toProperties({ ...current, youtube: goal.youtube, start: goal.start, end: goal.end }, db.titleColumn)
      : {};
    if (current && JSON.stringify(now) === JSON.stringify(props)) {
      same++;
      continue;
    }
    updated++;
    console.log(`~ ${label}`);
    if (!dryRun) await db.notion.pages.update({ page_id: row.id, properties: props });
  }

  const verb = dryRun ? "Dry run, nothing written:" : "Done:";
  console.log(
    `\n${verb} ${created} created, ${updated} updated, ${same} unchanged (${goals.length} goals in the JSON).`,
  );
  if (others) console.log(`${others} other row(s) in the database have no Goal ID; they were left as they are.`);
}

main().catch((e: unknown) => {
  console.error(`\nSync failed: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
