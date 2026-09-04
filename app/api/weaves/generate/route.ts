import { NextRequest, NextResponse } from "next/server";
import { generateAutoWeave } from "@/lib/analyst/weaves";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await generateAutoWeave();
  if (result && result.success) {
    return NextResponse.json({
      success: true,
      message: `Successfully synthesized and published issue ${result.issueNumber}`,
      data: result,
    });
  }

  return NextResponse.json(
    { success: false, error: "Failed to generate Weave essay" },
    { status: 500 }
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && key !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await generateAutoWeave();
  if (result && result.success) {
    return NextResponse.json({
      success: true,
      message: `Successfully synthesized and published issue ${result.issueNumber}`,
      data: result,
    });
  }

  return NextResponse.json(
    { success: false, error: "Failed to generate Weave essay" },
    { status: 500 }
  );
}
