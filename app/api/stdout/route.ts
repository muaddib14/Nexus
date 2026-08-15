import { NextResponse } from "next/server";
import { query, isDbConfigured } from "@/lib/db";

export async function GET() {
  if (!isDbConfigured) {
    return NextResponse.json({
      source: "fallback",
      data: [],
    });
  }

  try {
    const rows = await query(`
      SELECT 
        id,
        time_str as "time",
        cycle_id as "cycleId",
        actor,
        glyph,
        message,
        level as "cls",
        cost_usd as "cost"
      FROM agent_stdout
      ORDER BY created_at ASC
      LIMIT 60;
    `);

    return NextResponse.json({
      source: "neon",
      data: rows,
    });
  } catch (error) {
    console.error("[API Stdout Error]", error);
    return NextResponse.json({
      source: "fallback",
      data: [],
    });
  }
}
