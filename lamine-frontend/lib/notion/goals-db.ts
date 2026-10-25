import { Client, extractNotionId, isFullPage, iteratePaginatedAPI } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client";
import { COLUMNS } from "./goal-schema.ts";

// Talking to the goals database in Notion. Server side only: it needs NOTION_TOKEN.
// Plain relative imports so scripts/notion-sync.mts can use it too.

export type GoalsDb = {
  notion: Client;
  dataSourceId: string;
  titleColumn: string;
  // Column name → Notion property type, as the database has it now.
  columns: Record<string, string>;
};

export class NotionSetupError extends Error {}

export function notionEnv() {
  const token = process.env.NOTION_TOKEN?.trim();
  const raw = process.env.NOTION_GOALS_DATABASE_ID?.trim();
  const databaseId = raw ? (extractNotionId(raw) ?? raw) : "";
  return token && databaseId ? { token, databaseId } : null;
}

// Since Notion API 2025-09-03 a database holds one or more data sources, and rows
// and columns live on the data source. The goals database uses its first one.
export async function openGoalsDb(): Promise<GoalsDb> {
  const env = notionEnv();
  if (!env) throw new NotionSetupError("Set NOTION_TOKEN and NOTION_GOALS_DATABASE_ID in .env");
  const notion = new Client({ auth: env.token });

  let dataSourceId: string | undefined;
  try {
    const db = await notion.databases.retrieve({ database_id: env.databaseId });
    dataSourceId = "data_sources" in db ? db.data_sources[0]?.id : undefined;
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "object_not_found" || code === "unauthorized" || code === "restricted_resource") {
      throw new NotionSetupError(
        `Notion can't open database ${env.databaseId} (${code}). Check the token, and add the integration ` +
          `to the database: open it in Notion → ••• → Connections.`,
      );
    }
    throw e;
  }
  if (!dataSourceId) throw new NotionSetupError(`Database ${env.databaseId} has no data source.`);

  const source = await notion.dataSources.retrieve({ data_source_id: dataSourceId });
  const columns = Object.fromEntries(Object.entries(source.properties).map(([name, p]) => [name, p.type]));
  const titleColumn = Object.keys(columns).find((name) => columns[name] === "title") ?? "Name";
  return { notion, dataSourceId, titleColumn, columns };
}

// Every row, oldest goal first. Rows in the trash are not returned by the API.
export async function allRows(db: GoalsDb): Promise<PageObjectResponse[]> {
  const rows: PageObjectResponse[] = [];
  const sorts = COLUMNS.date in db.columns ? [{ property: COLUMNS.date, direction: "ascending" as const }] : undefined;
  for await (const row of iteratePaginatedAPI(db.notion.dataSources.query, {
    data_source_id: db.dataSourceId,
    page_size: 100,
    sorts,
  })) {
    if (row.object === "page" && isFullPage(row)) rows.push(row);
  }
  return rows;
}
