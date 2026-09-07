import { NextResponse } from "next/server";
import { query, isDbConfigured } from "@/lib/db";

export async function GET() {
  if (!isDbConfigured) {
    return NextResponse.json({ source: "fallback", data: [] });
  }

  try {
    const rows = await query(`
      SELECT
        id, kind, period_label as "periodLabel", slug, title, dek,
        what_changed as "whatChanged", forces, tensions,
        watch_list as "watchList", status, skip_reason as "skipReason",
        published_at as "publishedAt"
      FROM quarter_entries
      WHERE status IN ('published', 'skipped')
      ORDER BY published_at DESC;
    `);

    return NextResponse.json({ source: "neon", data: rows || [] });
  } catch (error) {
    console.error("[API Quarter Error]", error);
    return NextResponse.json({ source: "fallback", data: [] });
  }
}
