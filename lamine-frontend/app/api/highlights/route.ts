import { connection } from "next/server";
import { allRows, NotionSetupError, notionEnv, openDb } from "@/lib/notion/db";
import { COLUMNS, fromPage, type RawHighlight } from "@/lib/notion/highlight-schema";

// GET /api/highlights → every highlight in the Notion database, in the JSON file's
// shape: { highlights: RawHighlight[], fetchedAt: number }. The browser keeps the
// result in localStorage (lib/highlights-store.ts), so this runs about once a day
// per visitor. The token stays here on the server. Same as /api/goals.
export async function GET() {
  // Read Notion when asked, never while building.
  await connection();
  const headers = { "Cache-Control": "no-store" };

  if (!notionEnv("highlights")) {
    return Response.json({ error: "Notion is not configured" }, { status: 503, headers });
  }
  try {
    const db = await openDb("highlights");
    const highlights = (await allRows(db, COLUMNS.order))
      .map(fromPage)
      .filter((h): h is RawHighlight => h !== null);
    return Response.json({ highlights, fetchedAt: Date.now() }, { headers });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[api/highlights] Notion read failed:", message);
    return Response.json(
      { error: e instanceof NotionSetupError ? message : "Could not read highlights from Notion" },
      { status: 502, headers },
    );
  }
}
