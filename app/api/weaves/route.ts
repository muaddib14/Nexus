import { NextResponse } from "next/server";
import { query, isDbConfigured } from "@/lib/db";
import { weaveArticles as fallbackWeaves } from "@/data/weaves";

export async function GET() {
  if (!isDbConfigured) {
    return NextResponse.json({
      source: "fallback",
      data: fallbackWeaves,
    });
  }

  try {
    const weaveRows = await query(`
      SELECT 
        issue_number as "issueNumber",
        slug,
        title,
        dek,
        content,
        reading_minutes as "readingMinutes",
        threads_summary as "threadsSummary",
        tags,
        status,
        published_at as "publishedAt"
      FROM weaves
      WHERE status = 'published'
      ORDER BY issue_number DESC;
    `);

    if (!weaveRows || weaveRows.length === 0) {
      return NextResponse.json({
        source: "fallback",
        data: fallbackWeaves,
      });
    }

    // Fetch threads woven for each weave
    const threadRows = await query(`
      SELECT 
        weave_slug as "weaveSlug",
        dispatch_lead_id as "dispatchId",
        crossing_title as "crossing",
        dispatch_date as "date"
      FROM weave_threads;
    `);

    const formattedArticles = weaveRows.map((w: any) => {
      const padNum = String(w.issueNumber).padStart(3, "0");
      const pubDate = new Date(w.publishedAt);
      const dateStr = pubDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      const relatedThreads = (threadRows || [])
        .filter((t: any) => t.weaveSlug === w.slug)
        .map((t: any) => ({
          dispatchId: t.dispatchId,
          crossing: t.crossing,
          date: t.date,
        }));

      return {
        issue: `WEAVE ${padNum}`,
        slug: w.slug,
        date: dateStr,
        readTime: `${w.readingMinutes || 6} min read`,
        title: w.title,
        dek: w.dek,
        threadsSummary: w.threadsSummary || `${relatedThreads.length || 3} threads woven`,
        tags: w.tags || ["macro", "crypto", "liquidity"],
        threadsWoven: relatedThreads.length > 0 ? relatedThreads : [
          { dispatchId: "#104", crossing: "dollar funding ✕ stablecoin supply", date: "9 Aug" },
          { dispatchId: "#098", crossing: "rate path ✕ perp funding", date: "7 Aug" },
        ],
        sources: [
          { name: "Reuters — Macro Money Markets", url: "https://reuters.com" },
          { name: "CoinDesk — Digital Asset Liquidity", url: "https://coindesk.com" },
          { name: "The Block — Derivatives Funding Analytics", url: "https://theblock.co" },
        ],
        content: Array.isArray(w.content) ? w.content : [w.content],
      };
    });

    return NextResponse.json({
      source: "neon",
      data: formattedArticles,
    });
  } catch (error) {
    console.error("[API Weaves Error]", error);
    return NextResponse.json({
      source: "fallback",
      data: fallbackWeaves,
    });
  }
}
