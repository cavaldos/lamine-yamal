import { connection } from "next/server";
import { COLUMNS, fromPage, type RawGoal } from "@/lib/notion/goal-schema";
import { allRows, NotionSetupError, notionEnv, openDb } from "@/lib/notion/db";

// GET /api/goals → every goal in the Notion database, in the JSON file's shape:
// { goals: RawGoal[], fetchedAt: number }. The browser keeps the result in
// localStorage (lib/goals-store.ts), so this runs about once a day per visitor.
// The token stays here on the server.
export async function GET() {
  // Read Notion when asked, never while building.
  await connection();
  const headers = { "Cache-Control": "no-store" };

  if (!notionEnv("goals")) {
    return Response.json({ error: "Notion is not configured" }, { status: 503, headers });
  }
  try {
    const db = await openDb("goals");
    const goals = (await allRows(db, COLUMNS.date)).map(fromPage).filter((g): g is RawGoal => g !== null);
    return Response.json({ goals, fetchedAt: Date.now() }, { headers });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[api/goals] Notion read failed:", message);
    return Response.json(
      { error: e instanceof NotionSetupError ? message : "Could not read goals from Notion" },
      { status: 502, headers },
    );
  }
}
