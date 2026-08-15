import { NextRequest, NextResponse } from "next/server";
import { runScoutCycle } from "@/lib/scout/engine";

export const maxDuration = 15; // Hobby plan safe execution limit

export async function POST(req: NextRequest) {
  // Authorization check for external cron services (e.g. cron-job.org, Upstash)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runScoutCycle();
    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("[Scout Cycle Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute Scout cycle" },
      { status: 500 }
    );
  }
}

// Support GET for external cron services that only trigger via GET
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && key !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runScoutCycle();
    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("[Scout Cycle Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute Scout cycle" },
      { status: 500 }
    );
  }
}
