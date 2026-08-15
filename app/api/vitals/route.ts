import { NextResponse } from "next/server";
import { query, isDbConfigured } from "@/lib/db";

const fallbackVitals = {
  filedToday: 7,
  leadsFound: 19,
  leadsKilled: 10,
  leadsRefused: 2,
  spentToday: 3.87,
  budgetLimit: 10.00,
  uplinkStatus: "filing live",
};

export async function GET() {
  if (!isDbConfigured) {
    return NextResponse.json({
      source: "fallback",
      data: fallbackVitals,
    });
  }

  try {
    const rows = await query(`
      SELECT 
        filed_today as "filedToday",
        leads_found as "leadsFound",
        leads_killed as "leadsKilled",
        leads_refused as "leadsRefused",
        spent_today as "spentToday",
        budget_limit as "budgetLimit",
        uplink_status as "uplinkStatus"
      FROM vitals
      WHERE date = CURRENT_DATE
      LIMIT 1;
    `);

    if (rows && rows.length > 0) {
      return NextResponse.json({
        source: "neon",
        data: rows[0],
      });
    }

    return NextResponse.json({
      source: "fallback",
      data: fallbackVitals,
    });
  } catch (error) {
    console.error("[API Vitals Error]", error);
    return NextResponse.json({
      source: "fallback",
      data: fallbackVitals,
    });
  }
}
