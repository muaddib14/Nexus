import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Masthead from "@/components/Masthead";
import PrinciplesFooter from "@/components/PrinciplesFooter";
import { query, isDbConfigured } from "@/lib/db";
import { ArrowLeft, ArrowUp, ArrowDown, Target } from "lucide-react";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

const VERDICT_STYLE: Record<string, string> = {
  hit: "text-[#CCFF00] border-[#CCFF00]",
  partial: "text-[#E9E3D5] border-[#E9E3D5]",
  miss: "text-[#D64A3A] border-[#D64A3A]",
  blind_spot: "text-[#D64A3A] border-[#D64A3A] border-dashed",
};

const VERDICT_LABEL: Record<string, string> = {
  hit: "HIT",
  partial: "PARTIAL",
  miss: "MISS",
  blind_spot: "BLIND SPOT",
};

async function getQuarterEntry(slug: string) {
  if (!isDbConfigured) return null;

  try {
    const rows = await query<any>(
      `SELECT id, kind, period_label as "periodLabel", slug, title, dek,
              what_changed as "whatChanged", forces, tensions,
              watch_list as "watchList", status, skip_reason as "skipReason",
              published_at as "publishedAt"
       FROM quarter_entries WHERE slug = $1 LIMIT 1;`,
      [slug]
    );
    if (!rows || rows.length === 0) return null;
    const entry = rows[0];

    const sources = await query<{ leadId: string; title: string }>(
      `SELECT d.lead_id as "leadId", d.title
       FROM quarter_sources qs
       JOIN dispatches d ON d.id = qs.dispatch_id
       WHERE qs.entry_id = $1
       ORDER BY d.created_at ASC;`,
      [entry.id]
    );

    const scores = await query<{ item: string; verdict: string; note: string }>(
      `SELECT item, verdict, note FROM quarter_scores WHERE entry_id = $1;`,
      [entry.id]
    );

    return { ...entry, sources: sources || [], scores: scores || [] };
  } catch (error) {
    console.error("[QuarterReader] failed to load entry", error);
    return null;
  }
}

export default async function QuarterReaderPage({ params }: PageProps) {
  const { slug } = await params;
  const entry = await getQuarterEntry(slug);

  if (!entry) return notFound();

  const forces = Array.isArray(entry.forces) ? entry.forces : [];
  const tensions = Array.isArray(entry.tensions) ? entry.tensions : [];
  const watchList = Array.isArray(entry.watchList) ? entry.watchList : [];
  const pubDate = entry.publishedAt
    ? new Date(entry.publishedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  return (
    <div className="min-h-screen flex flex-col bg-[#100E0A] text-[#E9E3D5] relative">
      <Masthead activeSection="quarter" />

      <main className="max-w-[780px] w-full mx-auto px-6 py-10 flex-1">
        <Link
          href="/quarter"
          className="inline-flex items-center gap-2 text-xs font-mono text-[#6E7C82] hover:text-[#CCFF00] transition-colors mb-8 uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to The Quarter
        </Link>

        <div className="flex items-center gap-3 text-xs font-mono text-[#6E7C82] tracking-wider uppercase mb-4">
          <span className="text-[#CCFF00] font-semibold">{entry.periodLabel}</span>
          <span>·</span>
          <span>{entry.kind === "quarterly" ? "QUARTERLY" : "STANDING"}</span>
          <span>·</span>
          <span>{pubDate}</span>
        </div>

        <h1 className="font-serif font-normal text-3xl sm:text-4xl md:text-[42px] leading-[1.18] text-[#E9E3D5] tracking-tight mb-5">
          {entry.title}
        </h1>

        {entry.dek && (
          <p className="font-serif text-lg sm:text-xl leading-relaxed text-[#9A9385] mb-6 border-b border-[rgba(233,227,213,0.14)] pb-6">
            {entry.dek}
          </p>
        )}

        <div className="font-mono text-xs text-[#6E7C82] flex items-center justify-between pb-8 border-b border-[rgba(233,227,213,0.18)] mb-8">
          <span>filed by analyst · no human review</span>
          <span>{entry.sources.length} dispatches synthesized</span>
        </div>

        {/* Block 1 — What Changed */}
        {entry.whatChanged && (
          <section className="mb-10 max-w-[68ch]">
            <h3 className="text-xs uppercase tracking-[0.2em] text-[#CCFF00] font-bold mb-3 font-mono">What Changed</h3>
            <p className="font-serif text-[18px] leading-[1.72] text-[#D8D2C4]">{entry.whatChanged}</p>
          </section>
        )}

        {/* Block 2 — Forces at Work */}
        {forces.length > 0 && (
          <section className="mb-10">
            <h3 className="text-xs uppercase tracking-[0.2em] text-[#CCFF00] font-bold mb-3 font-mono">Forces at Work</h3>
            <div className="space-y-4">
              {forces.map((f: any, idx: number) => (
                <div key={idx} className="bg-[#17140E] border border-[rgba(233,227,213,0.1)] p-4">
                  <span className="text-[10px] uppercase tracking-wider text-[#9A9385] font-mono font-semibold">{f.category}</span>
                  <p className="font-serif text-[16px] leading-relaxed text-[#D8D2C4] mt-1.5">{f.description}</p>
                  {Array.isArray(f.dispatchIds) && f.dispatchIds.length > 0 && (
                    <div className="mt-2 text-[10px] text-[#6E7C82] font-mono">
                      {f.dispatchIds.map((id: string) => `→ ${id}`).join("  ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Block 3 — Unresolved Tensions */}
        {tensions.length > 0 && (
          <section className="mb-10">
            <h3 className="text-xs uppercase tracking-[0.2em] text-[#CCFF00] font-bold mb-3 font-mono">Unresolved Tensions</h3>
            <div className="space-y-5">
              {tensions.map((t: any, idx: number) => (
                <div key={idx} className="border border-[rgba(233,227,213,0.18)] p-4 font-mono">
                  <div className="text-sm text-[#E9E3D5] font-semibold uppercase tracking-wider mb-3">{t.title}</div>
                  <div className="space-y-2 text-[13px]">
                    <div className="flex gap-2">
                      <ArrowUp className="w-4 h-4 text-[#CCFF00] shrink-0 mt-0.5" />
                      <span className="text-[#D8D2C4]"><b className="text-[#9A9385]">pulling up:</b> {t.pullingUp}</span>
                    </div>
                    <div className="flex gap-2">
                      <ArrowDown className="w-4 h-4 text-[#D64A3A] shrink-0 mt-0.5" />
                      <span className="text-[#D8D2C4]"><b className="text-[#9A9385]">pulling down:</b> {t.pullingDown}</span>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-dashed border-[rgba(233,227,213,0.14)] mt-2">
                      <Target className="w-4 h-4 text-[#E9E3D5] shrink-0 mt-0.5" />
                      <span className="text-[#E9E3D5]"><b className="text-[#9A9385]">the decider:</b> {t.decider}</span>
                    </div>
                  </div>
                  {Array.isArray(t.dispatchIds) && t.dispatchIds.length > 0 && (
                    <div className="mt-3 text-[10px] text-[#6E7C82]">
                      {t.dispatchIds.map((id: string) => `→ ${id}`).join("  ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Block 4 — What to Watch */}
        {watchList.length > 0 && (
          <section className="mb-10">
            <h3 className="text-xs uppercase tracking-[0.2em] text-[#CCFF00] font-bold mb-3 font-mono">What to Watch</h3>
            <ul className="space-y-2 font-mono text-[13px] text-[#D8D2C4]">
              {watchList.map((w: string, idx: number) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-[#CCFF00]">▸</span> {w}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Block 5 — Scorecard */}
        <section className="mb-10">
          <h3 className="text-xs uppercase tracking-[0.2em] text-[#CCFF00] font-bold mb-3 font-mono">Scorecard — Grading the Previous Entry</h3>
          {entry.scores.length === 0 ? (
            <p className="text-xs text-[#6E7C82] italic font-mono">
              No previous entry existed yet to grade — this is the first Quarter entry.
            </p>
          ) : (
            <div className="space-y-2.5">
              {entry.scores.map((s: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 bg-[#17140E] border border-[rgba(233,227,213,0.1)] p-3">
                  <span className={`shrink-0 text-[9px] font-bold tracking-wider px-2 py-0.5 uppercase border font-mono ${VERDICT_STYLE[s.verdict] || ""}`}>
                    {VERDICT_LABEL[s.verdict] || s.verdict}
                  </span>
                  <div className="text-[13px] font-mono">
                    <div className="text-[#E9E3D5]">{s.item}</div>
                    {s.note && <div className="text-[#9A9385] text-xs mt-1">{s.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Traceability */}
        {entry.sources.length > 0 && (
          <section className="mt-14 pt-8 border-t border-[rgba(233,227,213,0.18)] font-mono">
            <h3 className="text-xs uppercase tracking-[0.2em] text-[#CCFF00] font-bold mb-4">
              Dispatch Sources (Traceability Chain)
            </h3>
            <div className="space-y-2 bg-[#17140E] border border-[rgba(233,227,213,0.1)] p-4 text-xs">
              {entry.sources.map((s: any, idx: number) => (
                <div key={idx} className="flex flex-wrap items-center gap-2">
                  <span className="text-[#CCFF00] font-bold">→ dispatch {s.leadId}</span>
                  <span className="text-[#9A9385]">{s.title}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 pt-6 border-t border-dashed border-[rgba(233,227,213,0.14)] font-mono text-[11px] text-[#6E7C82] leading-relaxed">
          The Quarter maps the landscape; it does not tell you what to do with it. Observation and analysis only — not investment advice, not a recommendation.
        </div>

        <PrinciplesFooter />
      </main>
    </div>
  );
}
