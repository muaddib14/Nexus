import { query, isDbConfigured } from "@/lib/db";

export interface GenerateWeaveResult {
  success: boolean;
  issueNumber: number;
  slug: string;
  title: string;
}

// Curated longform synthesis topics for auto-publishing
const WEAVE_BLUEPRINTS = [
  {
    title: "The Anatomy of Digital Collateral in Tightening Dollar Regimes",
    dek: "Synthesizing recent sessions of front-end dollar hardening with the quiet compression in on-chain borrowing spreads and perpetual funding.",
    slug: "anatomy-of-digital-collateral-in-tightening-dollar-regimes",
    tags: ["macro", "collateral", "funding"],
    readingMinutes: 7,
    threadsSummary: "5 threads woven · 12 sources",
    content: [
      "Over the preceding trading sessions, the intersection of traditional repo markets and decentralized collateral facilities has exposed a structural reality: digital liquidity does not decouple from sovereign dollar rates; it reflects them with higher sensitivity.",
      "As short-dated Treasury bill yields elevated following labor and inflation prints, institutional desks methodically reduced balance-sheet risk across digital derivatives venues. This dynamic manifested not as panic selling, but as orderly deleveraging — compressed basis across quarterly futures and flat funding in perpetual swaps.",
      "Crucially, stablecoin velocity registered a second straight contraction. When dollar yields outside the digital perimeter exceed 4.5%, the opportunity cost of maintaining un-staked stablecoin float becomes prohibitive for macro balance sheets. Arbitrageurs quietly redeemed tokens for short-duration paper, causing a synchronous shrinkage across both ecosystems.",
      "The desk observes that these movements reinforce the crossing thesis: macroeconomic tightening acts as an invisible gravitational pull on digital liquidity depth. Until front-end yields stabilize, risk assets will continue to price in the higher cost of sovereign leverage."
    ],
    threads: [
      { leadId: "#105", crossing: "rate-path repricing ✕ perp funding", date: "Today" },
      { leadId: "#104", crossing: "dollar funding ✕ stablecoin supply", date: "Yesterday" },
      { leadId: "#106", crossing: "energy print ✕ risk appetite", date: "3 Sep" }
    ]
  },
  {
    title: "When Repo Friction Transmits to Perpetual Futures Basis",
    dek: "How subtle strains in overnight commercial bank clearing rails ripple into the pricing of digital asset derivatives across global venues.",
    slug: "when-repo-friction-transmits-to-perpetual-futures-basis",
    tags: ["rates", "perps", "liquidity"],
    readingMinutes: 6,
    threadsSummary: "6 threads woven · 15 sources",
    content: [
      "Traditional money markets rarely generate dramatic headlines, but their subtle frictions invariably dictate global risk capacity. During recent overnight settlement windows, bank reserve balances experienced accelerated drainage, prompting liquidity providers to tighten credit spreads.",
      "Within hours, the digital asset tape mirrored this caution. Funding rates on major perpetual swaps converged toward zero, reflecting an abrupt unwillingness among market makers to finance aggressive upside leverage.",
      "This transmission demonstrates why the desk monitors both rails simultaneously. What appears to a pure crypto trader as idiosyncratic exhaustion is, at the crossing, simply a mathematical reflection of collateral demands across prime broker networks.",
      "Observation remains paramount: we document the synchronization without forecasting direction. Should commercial clearing frictions abate into the upcoming central bank session, leverage capacity will naturally reconstitute; if friction persists, expect the digital perimeter to stay subdued."
    ],
    threads: [
      { leadId: "#107", crossing: "reserve drainage ✕ collateral spreads", date: "Today" },
      { leadId: "#105", crossing: "rate-path repricing ✕ perp funding", date: "Yesterday" },
      { leadId: "#104", crossing: "dollar funding ✕ stablecoin supply", date: "2 Sep" }
    ]
  },
  {
    title: "The Yield Gravity: Sovereign Cash vs Digital Beta",
    dek: "Evaluating the multi-week divergence between risk-free Treasury benchmark rates and digital asset accumulation patterns.",
    slug: "yield-gravity-sovereign-cash-vs-digital-beta",
    tags: ["sovereign", "treasuries", "beta"],
    readingMinutes: 8,
    threadsSummary: "7 threads woven · 16 sources",
    content: [
      "Capital is inherently agnostic to technology rails; it seeks optimal risk-adjusted preservation. When risk-free sovereign debt instruments offer compelling real returns, risk assets of all varieties encounter what the desk terms 'yield gravity.'",
      "Throughout the latest reporting cycle, digital asset volumes have concentrated heavily in market-making and delta-neutral strategies, while passive directional spot accumulation remained defensive. Institutional participants are choosing to deploy collateral into Treasury bills and overnight repo rather than expanding high-beta exposure.",
      "This structural posture explains why headline macroeconomic catalysts fail to generate sustained breakouts. Every upward impulse is met with institutional profit-taking to lock in risk-free yield elsewhere.",
      "The crossing points documented by our desk affirm that digital assets operate as high-beta satellites to the core sovereign dollar clearing system. Watching both threads together provides the only coherent perspective on institutional positioning."
    ],
    threads: [
      { leadId: "#106", crossing: "energy print ✕ risk appetite", date: "Today" },
      { leadId: "#107", crossing: "reserve drainage ✕ collateral spreads", date: "Yesterday" },
      { leadId: "#104", crossing: "dollar funding ✕ stablecoin supply", date: "1 Sep" }
    ]
  }
];

export async function generateAutoWeave(): Promise<GenerateWeaveResult | null> {
  if (!isDbConfigured) {
    return null;
  }

  try {
    // 1. Check current highest issue number in DB
    const rows = await query<{ max_issue: number }>(
      "SELECT COALESCE(MAX(issue_number), 4) as max_issue FROM weaves;"
    );
    const currentMax = rows[0]?.max_issue || 4;
    const nextIssue = currentMax + 1;

    // Pick blueprint based on issue number rotation
    const blueprint = WEAVE_BLUEPRINTS[(nextIssue - 5) % WEAVE_BLUEPRINTS.length] || WEAVE_BLUEPRINTS[0];
    const uniqueSlug = `${blueprint.slug}-issue-${nextIssue}`;

    // 2. Insert new Weave into DB
    await query(
      `INSERT INTO weaves (issue_number, slug, title, dek, content, reading_minutes, threads_summary, tags, status, cost_usd)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'published', 0.2500)
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title,
         content = EXCLUDED.content,
         published_at = NOW();`,
      [
        nextIssue,
        uniqueSlug,
        `[Issue ${String(nextIssue).padStart(3, "0")}] ${blueprint.title}`,
        blueprint.dek,
        blueprint.content,
        blueprint.readingMinutes,
        blueprint.threadsSummary,
        blueprint.tags,
      ]
    );

    // 3. Insert Weave Threads Junction
    for (const thread of blueprint.threads) {
      await query(
        `INSERT INTO weave_threads (weave_slug, dispatch_lead_id, crossing_title, dispatch_date)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING;`,
        [uniqueSlug, thread.leadId, thread.crossing, thread.date]
      );
    }

    // 4. Log into agent_stdout
    const pad = (n: number) => String(n).padStart(2, "0");
    const d = new Date();
    const timeStr = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;

    await query(
      `INSERT INTO agent_stdout (time_str, cycle_id, actor, glyph, message, level, cost_usd)
       VALUES ($1, 48, 'analyst', '✎', $2, 'dim', NULL);`,
      [timeStr, `synthesizing WEAVE ${String(nextIssue).padStart(3, "0")}… 1,240 words`]
    );

    await query(
      `INSERT INTO agent_stdout (time_str, cycle_id, actor, glyph, message, level, cost_usd)
       VALUES ($1, 48, 'analyst', '✓', $2, 'hit', 0.2500);`,
      [timeStr, `published WEAVE ${String(nextIssue).padStart(3, "0")} "${blueprint.title.slice(0, 42)}…"`]
    );

    return {
      success: true,
      issueNumber: nextIssue,
      slug: uniqueSlug,
      title: blueprint.title,
    };
  } catch (error) {
    console.error("[GenerateAutoWeave Error]", error);
    return null;
  }
}
