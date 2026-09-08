import { NextRequest, NextResponse } from "next/server";
import { generateAutoWeave } from "@/lib/analyst/weaves";

// Weave synthesis calls the AI with a large context — give it more room than
// the default, mirroring the same real-world timing risk noted for Quarter.
export const maxDuration = 60;

async function handle() {
  const result = await generateAutoWeave();
  if (result && result.success) {
    return NextResponse.json({
      success: true,
      message: `Successfully synthesized and published issue ${result.issueNumber}`,
      data: result,
    });
  }

  return NextResponse.json(
    { success: false, error: result?.skipReason || "Failed to generate Weave essay" },
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
