import React from "react";
import Link from "next/link";
import Masthead from "@/components/Masthead";
import PrinciplesFooter from "@/components/PrinciplesFooter";
import { query, isDbConfigured } from "@/lib/db";
import { ArrowRight, Map, Sparkles } from "lucide-react";

export const revalidate = 0;

export const metadata = {
  title: "The Quarter — Landscape Maps | NEXUS",
  description: "Periodic structural landscape maps with a self-graded scorecard — where the board stands, and whether NEXUS's prior reads held up.",
};

interface QuarterListItem {
  slug: string;
  kind: string;
  periodLabel: string;
  title: string;
  dek: string | null;
  forces: any;
  tensions: any;
  status: string;
  skipReason: string | null;
  publishedAt: string;
  sourceCount: number;
  scoreCounts: { hit: number; partial: number; miss: number; blind_spot: number };
}

async function getQuarterEntries(): Promise<QuarterListItem[]> {
  if (!isDbConfigured) return [];

  try {
    const entries = await query<any>(`
      SELECT id, kind, period_label as "periodLabel", slug, title, dek,
             forces, tensions, status, skip_reason as "skipReason",
             published_at as "publishedAt"
      FROM quarter_entries
      WHERE status IN ('published', 'skipped')
      ORDER BY published_at DESC;
    `);

    if (!entries || entries.length === 0) return [];

    const sourceCounts = await query<{ entryId: string; count: string }>(`
      SELECT entry_id as "entryId", COUNT(*) as count FROM quarter_sources GROUP BY entry_id;
    `);
    const scoreRows = await query<{ entryId: string; verdict: string; count: string }>(`
      SELECT scored_entry_id as "entryId", verdict, COUNT(*) as count
      FROM quarter_scores GROUP BY scored_entry_id, verdict;
    `);

    return entries.map((e: any) => {
      const scoreCounts = { hit: 0, partial: 0, miss: 0, blind_spot: 0 };
      for (const row of scoreRows || []) {
        if (row.entryId === e.id && row.verdict in scoreCounts) {
          (scoreCounts as any)[row.verdict] = parseInt(row.count, 10);
        }
      }
      const sourceCount = (sourceCounts || []).find((s) => s.entryId === e.id);

      return {
        ...e,
        sourceCount: sourceCount ? parseInt(sourceCount.count, 10) : 0,
        scoreCounts,
      };
    });
  } catch (error) {
    console.error("[QuarterIndex] failed to load entries", error);
    return [];
  }
}

export default async function QuarterIndexPage() {
  const entries = await getQuarterEntries();

  return (
    <div className="min-h-screen flex flex-col bg-[#100E0A] text-[#E9E3D5]">
      <Masthead activeSection="quarter" />

      <main className="max-w-[920px] w-full mx-auto px-6 py-10 flex-1 font-mono">
        <div className="pb-8 border-b border-[rgba(233,227,213,0.18)]">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <div className="flex items-center gap-2.5 text-[#CCFF00] text-xs uppercase tracking-[0.24em] font-mono">
              <Map className="w-4 h-4" />
              <span>The Landscape Map</span>
            </div>
            <span className="text-[10px] text-[#6E7C82] flex items-center gap-1.5 border border-[rgba(233,227,213,0.12)] px-2 py-0.5">
              <Sparkles className="w-3 h-3 text-[#CCFF00]" />
              self-scored, no exceptions
            </span>
          </div>

          <h1 className="font-serif font-normal text-3xl sm:text-4xl text-[#E9E3D5] tracking-tight mb-3">
            The Quarter
          </h1>
          <p className="text-sm text-[#9A9385] max-w-[65ch] leading-relaxed">
            The Quarter maps the landscape; it does not tell you what to do with it. Each entry closes by grading the entry before it — hits, misses, and blind spots shown as they are.
          </p>
        </div>

        {entries.length === 0 ? (
          <div className="py-16 text-center text-[#6E7C82] italic text-sm">
            No Quarter entries yet — the desk needs a few weeks of real dispatches before it can map anything honestly.
          </div>
        ) : (
          <div className="divide-y divide-[rgba(233,227,213,0.1)] my-6">
            {entries.map((entry) => {
              const isSkipped = entry.status === "skipped";
              const scoreLabel = `${entry.scoreCounts.hit}H ${entry.scoreCounts.partial}P ${entry.scoreCounts.miss}M ${entry.scoreCounts.blind_spot}B`;
              const forces = Array.isArray(entry.forces) ? entry.forces : [];
              const tensions = Array.isArray(entry.tensions) ? entry.tensions : [];

              const card = (
                <div className="py-8 group">
                  <div className="flex items-center gap-3 text-[11px] text-[#6E7C82] tracking-wider uppercase flex-wrap">
                    <span className="text-[#CCFF00] font-semibold">
                      {entry.periodLabel} · {entry.kind === "quarterly" ? "QUARTERLY" : "STANDING"}
                    </span>
                    {!isSkipped && (
                      <>
                        <span>·</span>
                        <span className="text-[#9A9385]">scorecard: {scoreLabel}</span>
                      </>
                    )}
                  </div>

                  <h2 className={`font-serif text-2xl sm:text-3xl leading-snug mt-2 ${isSkipped ? "text-[#6E7C82] italic" : "text-[#E9E3D5] group-hover:text-[#CCFF00] transition-colors"}`}>
                    {entry.title}
                  </h2>

                  {entry.dek && (
                    <p className="font-serif text-[16px] leading-relaxed text-[#9A9385] max-w-[68ch] mt-3">
                      {entry.dek}
                    </p>
                  )}
                  {isSkipped && entry.skipReason && (
                    <p className="text-xs text-[#6E7C82] italic mt-3">{entry.skipReason}</p>
                  )}

                  {!isSkipped && (
                    <div className="pt-3 flex flex-wrap items-center justify-between text-xs text-[#6E7C82] gap-3">
                      <span className="text-[#9A9385] border border-[rgba(233,227,213,0.14)] px-2 py-0.5 text-[10px]">
                        {entry.sourceCount} dispatches · {forces.length} forces · {tensions.length} tensions
                      </span>
                      <span className="text-[#CCFF00] text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Read the map <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  )}
                </div>
              );

              return (
                <article key={entry.slug}>
                  {isSkipped ? card : <Link href={`/quarter/${entry.slug}`} className="block">{card}</Link>}
                </article>
              );
            })}
          </div>
        )}

        <div className="bg-[#17140E] border border-[rgba(233,227,213,0.1)] p-5 text-xs text-[#6E7C82] leading-relaxed font-mono mt-8">
          <b className="text-[#E9E3D5] uppercase tracking-wider block mb-1">Editorial Principle:</b>
          The Quarter maps the landscape; it does not tell you what to do with it. Observation and analysis only — not investment advice, not a recommendation.
        </div>

        <PrinciplesFooter />
      </main>
    </div>
  );
}
