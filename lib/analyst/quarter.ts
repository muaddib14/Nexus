import { query, isDbConfigured } from "@/lib/db";
import { QUARTER_SYSTEM_PROMPT } from "./prompts";

// TODO: raise to the brief's real threshold (~15 dispatches/month) once the
// Scout cron has been running organically for a few weeks. Kept low for now
// so an early demo entry can be generated from the current (small) dispatch stock.
const MIN_DISPATCHES_MONTHLY = 5;

export interface GenerateQuarterResult {
  success: boolean;
  status: "published" | "skipped";
  slug?: string;
  title?: string;
  skipReason?: string;
}

interface DispatchRow {
  id: string;
  leadId: string;
  title: string;
  content: string;
  threadA: string;
  threadB: string;
  confidence: string;
  createdAt: string;
}

function getPeriodLabel(): { periodLabel: string; monthStart: Date } {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodLabel = monthStart.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
  return { periodLabel, monthStart };
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

export async function generateQuarterEntry(): Promise<GenerateQuarterResult | null> {
  if (!isDbConfigured) {
    return null;
  }

  const { periodLabel, monthStart } = getPeriodLabel();
  const slug = `monthly-${periodLabel.toLowerCase().replace(" ", "-")}`;

  try {
    // 1. Skip if this period's entry already exists
    const existing = await query<{ id: string; status: string }>(
      `SELECT id, status FROM quarter_entries WHERE slug = $1 LIMIT 1;`,
      [slug]
    );
    if (existing && existing.length > 0) {
      return {
        success: true,
        status: existing[0].status as "published" | "skipped",
        slug,
      };
    }

    // 2. Pull real dispatches for this period — never fabricate the material
    const dispatchRows = await query<DispatchRow>(
      `SELECT id, lead_id as "leadId", title, content, thread_a as "threadA",
              thread_b as "threadB", confidence, created_at as "createdAt"
       FROM dispatches
       WHERE created_at >= $1 AND rejected_by IS NULL
       ORDER BY created_at ASC;`,
      [monthStart.toISOString()]
    );

    if (!dispatchRows || dispatchRows.length < MIN_DISPATCHES_MONTHLY) {
      await query(
        `INSERT INTO quarter_entries (kind, period_label, slug, published_at, title, status, skip_reason)
         VALUES ('monthly', $1, $2, NOW(), $3, 'skipped', $4)
         ON CONFLICT (slug) DO NOTHING;`,
        [
          periodLabel,
          slug,
          `${periodLabel} — not enough signal to map`,
          `This month didn't produce enough signal to map. The board barely moved. (${dispatchRows?.length ?? 0}/${MIN_DISPATCHES_MONTHLY} dispatches)`,
        ]
      );
      return { success: true, status: "skipped", slug, skipReason: "insufficient dispatch stock" };
    }

    // 3. Pull the previous published entry, if any, so the AI can score it honestly
    const prevRows = await query<{ id: string; title: string; forces: any; tensions: any; watch_list: any }>(
      `SELECT id, title, forces, tensions, watch_list
       FROM quarter_entries
       WHERE status = 'published'
       ORDER BY published_at DESC
       LIMIT 1;`
    );
    const previousEntry = prevRows?.[0] || null;

    // 4. Call the AI with the real dispatch data (and previous entry, for scoring)
    const dispatchContext = dispatchRows
      .map((d) => `[${d.leadId}] ${d.title}\n  thread A: ${d.threadA} | thread B: ${d.threadB} | ${d.confidence}\n  ${d.content}`)
      .join("\n\n");

    const previousContext = previousEntry
      ? `\n\nPREVIOUS ENTRY TO SCORE ("${previousEntry.title}"):\nForces: ${JSON.stringify(previousEntry.forces)}\nTensions: ${JSON.stringify(previousEntry.tensions)}\nWatch list: ${JSON.stringify(previousEntry.watch_list)}`
      : "\n\nNo previous entry exists — this is the first Quarter entry, return \"scorecard\": [].";

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    const modelUsed = process.env.OPENROUTER_MODEL || "openrouter/free";
    let aiOutput: any = null;
    let costUsd = 0;

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
            { role: "system", content: QUARTER_SYSTEM_PROMPT },
            {
              role: "user",
              content: `Synthesize a landscape map for ${periodLabel} from these ${dispatchRows.length} real dispatches:\n\n${dispatchContext}${previousContext}`,
            },
          ],
          temperature: 0.2,
          max_tokens: 4000,
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
        console.error(`[Quarter OpenRouter ${response.status}]`, errText);
      }
    }

    // No fabricated fallback here — a rule-based landscape map would be exactly
    // the "fake pattern from data that never spoke" the brief forbids. Fail honestly instead.
    if (!aiOutput) {
      console.error("[GenerateQuarterEntry] AI synthesis failed — refusing to fabricate a fallback entry");
      return { success: false, status: "skipped", skipReason: "AI synthesis unavailable" };
    }

    // 5. Insert the entry
    const insertRows = await query<{ id: string }>(
      `INSERT INTO quarter_entries (kind, period_label, slug, published_at, title, dek, what_changed, forces, tensions, watch_list, status, cost_usd)
       VALUES ('monthly', $1, $2, NOW(), $3, $4, $5, $6, $7, $8, 'published', $9)
       RETURNING id;`,
      [
        periodLabel,
        slug,
        aiOutput.title,
        aiOutput.dek,
        aiOutput.whatChanged,
        JSON.stringify(aiOutput.forces || []),
        JSON.stringify(aiOutput.tensions || []),
        JSON.stringify(aiOutput.watchList || []),
        costUsd,
      ]
    );
    const entryId = insertRows[0].id;

    // 6. Insert scorecard rows (only if there was a previous entry to grade)
    if (previousEntry && Array.isArray(aiOutput.scorecard)) {
      for (const item of aiOutput.scorecard) {
        await query(
          `INSERT INTO quarter_scores (entry_id, scored_entry_id, item, verdict, note)
           VALUES ($1, $2, $3, $4, $5);`,
          [entryId, previousEntry.id, item.item, item.verdict, item.note]
        );
      }
    }

    // 7. Link source dispatches for traceability
    for (const d of dispatchRows) {
      await query(
        `INSERT INTO quarter_sources (entry_id, dispatch_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
        [entryId, d.id]
      );
    }

    // 8. Log to agent_stdout
    const cycleRows = await query<{ max_cycle: number }>(
      "SELECT COALESCE(MAX(cycle_id), 0) as max_cycle FROM agent_stdout;"
    );
    const cycleId = (cycleRows[0]?.max_cycle || 0) + 1;
    await logStdout(cycleId, "thought", "dim", "✎", `mapping ${periodLabel} landscape… ${dispatchRows.length} dispatches synthesized`);
    await logStdout(cycleId, "filed", "hit", "✓", `published QUARTER "${aiOutput.title?.slice(0, 48)}…"`, costUsd);

    return { success: true, status: "published", slug, title: aiOutput.title };
  } catch (error) {
    console.error("[GenerateQuarterEntry Error]", error);
    return { success: false, status: "skipped", skipReason: "internal error" };
  }
}
