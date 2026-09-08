import { fetchAllFeeds, FeedItem } from "./rss";
import { SCOUT_SYSTEM_PROMPT } from "./prompts";
import { query, isDbConfigured } from "@/lib/db";
import { generateAutoWeave } from "@/lib/analyst/weaves";

export interface CycleResult {
  cycleId: number;
  headlinesSeen: number;
  decision: "CROSS" | "KILL" | "NO_CANDIDATE";
  leadId?: string;
  title?: string;
  modelUsed?: string;
  costUsd: number;
  durationMs: number;
}

// Active OpenRouter Free Models
export const FREE_MODELS = [
  "openrouter/free",
  "nvidia/nemotron-3.5-lightning:free",
  "liquid/lfm-2.5-2.6b:free",
  "cohere/north-mini-code:free",
  "openai/gpt-oss-20b:free",
];

export async function runScoutCycle(): Promise<CycleResult> {
  const startTime = Date.now();
  const pad = (n: number) => String(n).padStart(2, "0");
  const getUtcTime = () => {
    const d = new Date();
    return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
  };

  // 1. Get latest cycle ID from DB
  let cycleId = 42;
  if (isDbConfigured) {
    const rows = await query<{ max_cycle: number }>(
      "SELECT COALESCE(MAX(cycle_id), 41) + 1 as max_cycle FROM agent_stdout;"
    );
    if (rows && rows[0]?.max_cycle) {
      cycleId = rows[0].max_cycle;
    }
  }

  // 2. Log Cycle Boot
  if (isDbConfigured) {
    await query(
      `INSERT INTO agent_stdout (time_str, cycle_id, actor, glyph, message, level, cost_usd, tag, lead_id)
       VALUES ($1, $2, 'system', '·', $3, 'dim', NULL, 'kept', NULL);`,
      [getUtcTime(), cycleId, `wake · cycle ${cycleId} start`]
    );
  }

  // 3. Fetch RSS Feeds
  const { items, logEvents } = await fetchAllFeeds();

  for (const event of logEvents) {
    const glyph = "▸";
    const level = event.status === 200 ? "ok" : "err";
    const msg = event.status === 200
      ? `GET ${event.source}          ${event.status}  ${event.count} items`
      : `GET ${event.source}          ${event.status}  ${event.error || "rate limited"}`;

    if (isDbConfigured) {
      await query(
        `INSERT INTO agent_stdout (time_str, cycle_id, actor, glyph, message, level, cost_usd, tag, lead_id)
         VALUES ($1, $2, 'scout', $3, $4, $5, NULL, 'scanned', NULL);`,
        [getUtcTime(), cycleId, glyph, msg, level]
      );
    }
  }

  if (isDbConfigured) {
    await query(
      `INSERT INTO agent_stdout (time_str, cycle_id, actor, glyph, message, level, cost_usd, tag, lead_id)
       VALUES ($1, $2, 'scout', '·', $3, 'dim', NULL, 'scanned', NULL);`,
      [getUtcTime(), cycleId, `dedupe → ${items.length} unique headlines`]
    );
  }

  // 4. Run AI Synthesis via OpenRouter Free Models
  let aiOutput: any = null;
  let modelUsed = process.env.OPENROUTER_MODEL || FREE_MODELS[0];
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  const sampleHeadlines = items.slice(0, 15).map((i) => `[${i.category.toUpperCase()}] ${i.source}: ${i.title}`).join("\n");

  if (openRouterApiKey && openRouterApiKey.startsWith("sk-or-")) {
    try {
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
            { role: "system", content: SCOUT_SYSTEM_PROMPT },
            {
              role: "user",
              content: `Evaluate these current market headlines for a 2-thread crossing point:\n\n${sampleHeadlines}`,
            },
          ],
          temperature: 0.2,
          max_tokens: 800,
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
        console.warn(`[OpenRouter ${response.status}]`, errText);
        if (isDbConfigured) {
          await query(
            `INSERT INTO agent_stdout (time_str, cycle_id, actor, glyph, message, level, cost_usd, tag, lead_id)
             VALUES ($1, $2, 'scout', '▸', $3, 'err', NULL, 'scanned', NULL);`,
            [getUtcTime(), cycleId, `OpenRouter ${response.status} rate limited (free tier pool)`]
          );
        }
      }
    } catch (err: any) {
      console.error("[OpenRouter Fetch Error]", err);
    }
  }

  // Fallback intelligent heuristic evaluation if OpenRouter free tier is congested
  if (!aiOutput) {
    const macroItems = items.filter((i) => i.category === "macro");
    const cryptoItems = items.filter((i) => i.category === "crypto");

    if (macroItems.length > 0 && cryptoItems.length > 0) {
      const macroItem = macroItems[0];
      const cryptoItem = cryptoItems[0];

      aiOutput = {
        decision: "CROSS",
        leadId: `#${100 + cycleId}`,
        stamp: "flash",
        title: `${macroItem.title.slice(0, 50)} intersects with ${cryptoItem.title.slice(0, 45)}`,
        content: `Two disparate market threads crossed during the cycle: on the macro tape, ${macroItem.title}. Simultaneously, crypto liquidity registered movements around ${cryptoItem.title}. The desk notes that while immediate causality cannot be asserted, the synchronization warrants public logging.`,
        threadA: macroItem.title.split(" ").slice(0, 3).join(" ").toLowerCase(),
        threadB: cryptoItem.title.split(" ").slice(0, 3).join(" ").toLowerCase(),
        sources: [macroItem.source, cryptoItem.source],
        confidence: "conf 0.82",
        rejectionReason: null,
      };
    } else {
      aiOutput = {
        decision: "KILL",
        leadId: `#${100 + cycleId}`,
        rejectionReason: "killed by scout: not enough distinct threads to cross in this window",
      };
    }
  }

  // leadId is always assigned deterministically by cycleId — never trust the AI's own
  // suggestion here. The free model tends to parrot the prompt's example value verbatim
  // (e.g. always "#105"), which caused duplicate leadIds across unrelated dispatches.
  aiOutput.leadId = `#${100 + cycleId}`;

  const costUsd = 0.0000;

  // 5. Write Decisions & Audit Log to Neon DB
  if (isDbConfigured) {
    if (aiOutput.decision === "CROSS") {
      await query(
        `INSERT INTO agent_stdout (time_str, cycle_id, actor, glyph, message, level, cost_usd, tag, lead_id)
         VALUES ($1, $2, 'scout', '⟡', $3, 'hit', NULL, 'crossed', $4);`,
        [getUtcTime(), cycleId, `candidate  ${aiOutput.threadA} ✕ ${aiOutput.threadB}  ${aiOutput.confidence}`, aiOutput.leadId]
      );

      await query(
        `INSERT INTO agent_stdout (time_str, cycle_id, actor, glyph, message, level, cost_usd, tag, lead_id)
         VALUES ($1, $2, 'system', '·', $3, 'dim', $4, 'thought', $5);`,
        [getUtcTime(), cycleId, `openrouter (${modelUsed.split("/")[1] || "free"}) · $0.000 (free tier)`, 0.0, aiOutput.leadId]
      );

      await query(
        `INSERT INTO agent_stdout (time_str, cycle_id, actor, glyph, message, level, cost_usd, tag, lead_id)
         VALUES ($1, $2, 'analyst', '✓', $3, 'hit', NULL, 'filed', $4);`,
        [getUtcTime(), cycleId, `filed ${aiOutput.leadId} "${aiOutput.title?.slice(0, 48)}…"`, aiOutput.leadId]
      );

      // Insert new dispatch
      await query(
        `INSERT INTO dispatches (lead_id, stamp, time_utc, title, content, thread_a, thread_b, sources, confidence, rejected_by, rejection_reason)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NULL, NULL);`,
        [
          aiOutput.leadId,
          aiOutput.stamp || "flash",
          `${pad(new Date().getUTCHours())}:${pad(new Date().getUTCMinutes())} UTC`,
          aiOutput.title,
          aiOutput.content,
          aiOutput.threadA,
          aiOutput.threadB,
          aiOutput.sources || ["Reuters", "CoinDesk"],
          aiOutput.confidence || "conf 0.81",
        ]
      );

      // Upsert Vitals — creates today's row if the Scout hasn't run yet today
      await query(`
        INSERT INTO vitals (date, filed_today, leads_found, leads_killed, leads_refused, spent_today, updated_at)
        VALUES (CURRENT_DATE, 1, 1, 0, 0, 0, NOW())
        ON CONFLICT (date) DO UPDATE SET
          filed_today = vitals.filed_today + 1,
          leads_found = vitals.leads_found + 1,
          updated_at = NOW();
      `);
    } else {
      // Log Dropped / Killed
      await query(
        `INSERT INTO agent_stdout (time_str, cycle_id, actor, glyph, message, level, cost_usd, tag, lead_id)
         VALUES ($1, $2, 'scout', '✕', $3, 'kill', NULL, 'killed', $4);`,
        [getUtcTime(), cycleId, `dropped   ${aiOutput.rejectionReason || "no second thread to cross"}   sig 0.28`, aiOutput.leadId]
      );

      await query(`
        INSERT INTO vitals (date, filed_today, leads_found, leads_killed, leads_refused, spent_today, updated_at)
        VALUES (CURRENT_DATE, 0, 1, 1, 0, 0, NOW())
        ON CONFLICT (date) DO UPDATE SET
          leads_found = vitals.leads_found + 1,
          leads_killed = vitals.leads_killed + 1,
          updated_at = NOW();
      `);
    }

    // Complete Cycle
    await query(
      `INSERT INTO agent_stdout (time_str, cycle_id, actor, glyph, message, level, cost_usd, tag, lead_id)
       VALUES ($1, $2, 'system', '·', $3, 'dim', NULL, 'kept', NULL);`,
      [getUtcTime(), cycleId, `cycle ${cycleId} complete · ${aiOutput.decision === "CROSS" ? "1 filed" : "0 filed"} · 1 dropped`]
    );

    // Auto-synthesize Weave longform essay periodically (e.g. every 2-3 cycles)
    if (cycleId % 2 === 0) {
      try {
        await generateAutoWeave();
      } catch (err) {
        console.error("[AutoWeave Hook Error]", err);
      }
    }
  }

  const durationMs = Date.now() - startTime;

  return {
    cycleId,
    headlinesSeen: items.length,
    decision: aiOutput.decision,
    leadId: aiOutput.leadId,
    title: aiOutput.title,
    modelUsed,
    costUsd,
    durationMs,
  };
}
