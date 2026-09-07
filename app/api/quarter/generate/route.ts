import { NextRequest, NextResponse } from "next/server";
import { generateQuarterEntry } from "@/lib/analyst/quarter";

// Quarter synthesis is far heavier than a dispatch cycle (large context, big JSON output).
// 60s is the Vercel Hobby plan ceiling — if generation still times out in production,
// this needs to move to a queued/background job instead of a single request.
export const maxDuration = 60;

async function handle() {
  const result = await generateQuarterEntry();
  if (result && result.success) {
    return NextResponse.json({
      success: true,
      message:
        result.status === "published"
          ? `Successfully synthesized and published "${result.title}"`
          : `Skipped: ${result.skipReason}`,
      data: result,
    });
  }

  return NextResponse.json(
    { success: false, error: result?.skipReason || "Failed to generate Quarter entry" },
    { status: 500 }
  );
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return handle();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && key !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return handle();
}
