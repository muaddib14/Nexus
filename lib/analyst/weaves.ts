import { query, isDbConfigured } from "@/lib/db";
import { WEAVE_SYSTEM_PROMPT } from "./prompts";

export interface GenerateWeaveResult {
  success: boolean;
  issueNumber?: number;
  slug?: string;
  title?: string;
  skipReason?: string;
}

// Brief requires "at least 3 distinct wire dispatches" woven per essay
const MIN_DISPATCHES_FOR_WEAVE = 3;

interface DispatchRow {
  id: string;
  leadId: string;
  title: string;
  content: string;
  threadA: string;
  threadB: string;
  sources: string[];
  createdAt: string;
}

async function logStdout(cycleId: number, tag: string, level: string, glyph: string, message: string, cost?: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const d = new Date();
  const timeStr = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
  await query(
    `INSERT INTO agent_stdout (time_str, cycle_id, actor, glyph, message, level, cost_usd, tag, lead_id)
     VALUES ($1, $2, 'analyst', $3, $4, $5, $6, $7, NULL);`,
    [timeStr, cycleId, glyph, message, level, cost ?? null, tag]
  );
}

export async function generateAutoWeave(): Promise<GenerateWeaveResult | null> {
  if (!isDbConfigured) {
    return null;
  }

  try {
    // 1. Pull dispatches from the last 7 days that haven't been woven into a Weave yet
    const dispatchRows = await query<DispatchRow>(
      `SELECT d.id, d.lead_id as "leadId", d.title, d.content, d.thread_a as "threadA",
              d.thread_b as "threadB", d.sources, d.created_at as "createdAt"
       FROM dispatches d
       WHERE d.rejected_by IS NULL
         AND d.created_at >= NOW() - INTERVAL '7 days'
         AND NOT EXISTS (
           SELECT 1 FROM weave_threads wt WHERE wt.dispatch_lead_id = d.lead_id
         )
       ORDER BY d.created_at ASC
       LIMIT 8;`
    );

    if (!dispatchRows || dispatchRows.length < MIN_DISPATCHES_FOR_WEAVE) {
      return {
        success: false,
        skipReason: `not enough unwoven dispatches (${dispatchRows?.length ?? 0}/${MIN_DISPATCHES_FOR_WEAVE})`,
      };
    }

    // 2. Call the AI with the real dispatch data — never fabricate the synthesis
    const dispatchContext = dispatchRows
      .map((d) => `[${d.leadId}] ${d.title}\n  thread A: ${d.threadA} | thread B: ${d.threadB}\n  ${d.content}`)
      .join("\n\n");

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    const modelUsed = process.env.OPENROUTER_MODEL || "openrouter/free";
    let aiOutput: any = null;

    if (openRouterApiKey && openRouterApiKey.startsWith("sk-or-")) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterApiKey}`,
          "HTTP-Referer": "https://nexus-iota-kohl.vercel.app",
          "X-Title": "NEXUS Autonomous Desk",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelUsed,
          messages: [
            { role: "system", content: WEAVE_SYSTEM_PROMPT },
            {
              role: "user",
              content: `Weave these ${dispatchRows.length} real dispatches into one longform essay:\n\n${dispatchContext}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 3000,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiOutput = JSON.parse(jsonMatch[0]);
        }
      } else {
        const errText = await response.text();
        console.error(`[Weave OpenRouter ${response.status}]`, errText);
      }
    }

    // No fabricated fallback — a templated essay pretending to synthesize dispatches
    // it never read would be exactly the kind of dressed-up fake the desk exists to avoid.
    if (!aiOutput) {
      console.error("[GenerateAutoWeave] AI synthesis failed — refusing to fabricate a fallback essay");
      return { success: false, skipReason: "AI synthesis unavailable" };
    }

    // 3. Determine next issue number
    const rows = await query<{ max_issue: number }>(
      "SELECT COALESCE(MAX(issue_number), 4) as max_issue FROM weaves;"
    );
    const nextIssue = (rows[0]?.max_issue || 4) + 1;
    const slugBase = String(aiOutput.title || "weave")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60);
    const uniqueSlug = `${slugBase}-issue-${nextIssue}`;

    const threadsSummary = `${dispatchRows.length} threads woven · ${dispatchRows.reduce((sum, d) => sum + (d.sources?.length || 0), 0)} sources`;

    // 4. Insert the Weave
    await query(
      `INSERT INTO weaves (issue_number, slug, title, dek, content, reading_minutes, threads_summary, tags, status, cost_usd)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'published', 0);`,
      [
        nextIssue,
        uniqueSlug,
        `[Issue ${String(nextIssue).padStart(3, "0")}] ${aiOutput.title}`,
        aiOutput.dek,
        Array.isArray(aiOutput.content) ? aiOutput.content : [aiOutput.content],
        aiOutput.readingMinutes || 6,
        threadsSummary,
        aiOutput.tags || ["macro", "crypto"],
      ]
    );

    // 5. Link the real source dispatches for traceability
    for (const d of dispatchRows) {
      const dateStr = new Date(d.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      await query(
        `INSERT INTO weave_threads (weave_slug, dispatch_lead_id, crossing_title, dispatch_date)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING;`,
        [uniqueSlug, d.leadId, `${d.threadA} ✕ ${d.threadB}`, dateStr]
      );
    }

    // 6. Log to agent_stdout
    const cycleRows = await query<{ max_cycle: number }>(
      "SELECT COALESCE(MAX(cycle_id), 0) as max_cycle FROM agent_stdout;"
    );
    const cycleId = (cycleRows[0]?.max_cycle || 0) + 1;
    await logStdout(cycleId, "thought", "dim", "✎", `synthesizing WEAVE ${String(nextIssue).padStart(3, "0")}… ${dispatchRows.length} dispatches woven`);
    await logStdout(cycleId, "filed", "hit", "✓", `published WEAVE ${String(nextIssue).padStart(3, "0")} "${aiOutput.title?.slice(0, 42)}…"`);

    return {
      success: true,
      issueNumber: nextIssue,
      slug: uniqueSlug,
      title: aiOutput.title,
    };
  } catch (error) {
    console.error("[GenerateAutoWeave Error]", error);
    return { success: false, skipReason: "internal error" };
  }
}
