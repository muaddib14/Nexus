import { NextResponse } from "next/server";
import { query, isDbConfigured } from "@/lib/db";
import { dispatches as fallbackDispatches } from "@/components/WireFeed";

export async function GET() {
  if (!isDbConfigured) {
    return NextResponse.json({
      source: "fallback",
      data: fallbackDispatches,
    });
  }

  try {
    const rows = await query(`
      SELECT 
        id,
        lead_id as "leadId",
        stamp,
        time_utc as "time",
        title,
        content,
        thread_a as "threadA",
        thread_b as "threadB",
        sources,
        confidence,
        rejected_by as "rejectedBy",
        rejection_reason as "rejectionReason"
      FROM dispatches
      ORDER BY created_at DESC;
    `);

    if (rows && rows.length > 0) {
      return NextResponse.json({
        source: "neon",
        data: rows,
      });
    }

    return NextResponse.json({
      source: "fallback",
      data: fallbackDispatches,
    });
  } catch (error) {
    console.error("[API Dispatches Error]", error);
    return NextResponse.json({
      source: "fallback",
      data: fallbackDispatches,
    });
  }
}
