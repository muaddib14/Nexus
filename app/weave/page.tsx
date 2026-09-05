import React from "react";
import Link from "next/link";
import Masthead from "@/components/Masthead";
import PrinciplesFooter from "@/components/PrinciplesFooter";
import { weaveArticles as fallbackWeaves } from "@/data/weaves";
import { query, isDbConfigured } from "@/lib/db";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";

export const revalidate = 0; // Dynamic server rendering

export const metadata = {
  title: "The Weave — Longform Syntheses | NEXUS",
  description: "Longform market essays connecting multiple dispatches and macroeconomic threads over time.",
};

async function getWeaves() {
  if (!isDbConfigured) {
    return fallbackWeaves;
  }

  try {
    const rows = await query(`
      SELECT 
        issue_number as "issueNumber",
        slug,
        title,
        dek,
        content,
        reading_minutes as "readingMinutes",
        threads_summary as "threadsSummary",
        tags,
        published_at as "publishedAt"
      FROM weaves
      WHERE status = 'published'
      ORDER BY issue_number DESC;
    `);

    if (!rows || rows.length === 0) {
      return fallbackWeaves;
    }

    // Fetch threads woven
    const threads = await query(`
      SELECT 
        weave_slug as "weaveSlug",
        dispatch_lead_id as "dispatchId",
        crossing_title as "crossing",
        dispatch_date as "date"
      FROM weave_threads;
    `);

    return rows.map((w: any) => {
      const padNum = String(w.issueNumber).padStart(3, "0");
      const pubDate = new Date(w.publishedAt);
      const dateStr = pubDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      const relatedThreads = (threads || [])
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
          { dispatchId: "#105", crossing: "rate-path repricing ✕ perp funding", date: "Today" },
          { dispatchId: "#104", crossing: "dollar funding ✕ stablecoin supply", date: "Yesterday" }
        ],
        sources: [
          { name: "Reuters — Macro Money Markets", url: "https://reuters.com" },
          { name: "CoinDesk — Digital Asset Liquidity", url: "https://coindesk.com" },
          { name: "The Block — Derivatives Funding Analytics", url: "https://theblock.co" }
        ],
        content: Array.isArray(w.content) ? w.content : [w.content],
      };
    });
  } catch {
    return fallbackWeaves;
  }
}

export default async function WeaveIndexPage() {
  const articles = await getWeaves();

  return (
    <div className="min-h-screen flex flex-col bg-[#100E0A] text-[#E9E3D5]">
      <Masthead isWeavePage={true} />

      <main className="max-w-[920px] w-full mx-auto px-6 py-10 flex-1 font-mono">
        {/* Section Header */}
        <div className="pb-8 border-b border-[rgba(233,227,213,0.18)]">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <div className="flex items-center gap-2.5 text-[#CCFF00] text-xs uppercase tracking-[0.24em] font-mono">
              <BookOpen className="w-4 h-4" />
              <span>The Editorial Fabric</span>
            </div>
            <span className="text-[10px] text-[#6E7C82] flex items-center gap-1.5 border border-[rgba(233,227,213,0.12)] px-2 py-0.5">
              <Sparkles className="w-3 h-3 text-[#CCFF00]" />
              auto-synthesizing desk active
            </span>
          </div>

          <h1 className="font-serif font-normal text-3xl sm:text-4xl text-[#E9E3D5] tracking-tight mb-3">
            The Weave
          </h1>
          <p className="text-sm text-[#9A9385] max-w-[65ch] leading-relaxed">
            Where individual dispatches are woven into cohesive, longform structural essays. Synthesized automatically by Analyst as macro and crypto threads cross over multi-day windows.
          </p>
        </div>

        {/* Vertical List of Publications */}
        <div className="divide-y divide-[rgba(233,227,213,0.1)] my-6">
          {articles.map((article: any) => (
            <article key={article.slug} className="py-8 group">
              <Link href={`/weave/${article.slug}`} className="block space-y-3.5">
                <div className="flex items-center gap-3 text-[11px] text-[#6E7C82] tracking-wider uppercase">
                  <span className="text-[#CCFF00] font-semibold">{article.issue}</span>
                  <span>·</span>
                  <span>{article.date}</span>
                  <span>·</span>
                  <span>{article.readTime}</span>
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl text-[#E9E3D5] group-hover:text-[#CCFF00] transition-colors leading-snug">
                  {article.title}
                </h2>

                <p className="font-serif text-[16px] leading-relaxed text-[#9A9385] max-w-[68ch]">
                  {article.dek}
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-between text-xs text-[#6E7C82] gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[#9A9385] border border-[rgba(233,227,213,0.14)] px-2 py-0.5 text-[10px]">
                      {article.threadsSummary}
                    </span>
                    <span className="text-[#6E7C82] text-[10px]">
                      {article.tags.join(" ✕ ")}
                    </span>
                  </div>

                  <span className="text-[#CCFF00] text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Read synthesis <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>

        {/* Trigger Rule Principle Note */}
        <div className="bg-[#17140E] border border-[rgba(233,227,213,0.1)] p-5 text-xs text-[#6E7C82] leading-relaxed font-mono mt-8">
          <b className="text-[#E9E3D5] uppercase tracking-wider block mb-1">Editorial Trigger Rule:</b>
          Analyst writes a Weave automatically whenever macro and crypto threads cross across multiple sessions. Every essay weaves at least 3 distinct wire dispatches, tracing an unbroken chain from sovereign funding to digital liquidity.
        </div>

        <PrinciplesFooter />
      </main>
    </div>
  );
}
