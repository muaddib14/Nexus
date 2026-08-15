import React from "react";
import Link from "next/link";
import Masthead from "@/components/Masthead";
import PrinciplesFooter from "@/components/PrinciplesFooter";
import { weaveArticles } from "@/data/weaves";
import { ArrowRight, BookOpen } from "lucide-react";

export const metadata = {
  title: "The Weave — Longform Syntheses | NEXUS",
  description: "Longform market essays connecting multiple dispatches and macroeconomic threads over time.",
};

export default function WeaveIndexPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#100E0A] text-[#E9E3D5]">
      <Masthead isWeavePage={true} />

      <main className="max-w-[920px] w-full mx-auto px-6 py-10 flex-1 font-mono">
        {/* Section Header */}
        <div className="pb-8 border-b border-[rgba(233,227,213,0.18)]">
          <div className="flex items-center gap-2.5 text-[#EBA43C] text-xs uppercase tracking-[0.24em] mb-2 font-mono">
            <BookOpen className="w-4 h-4" />
            <span>The Editorial Fabric</span>
          </div>
          <h1 className="font-serif font-normal text-3xl sm:text-4xl text-[#E9E3D5] tracking-tight mb-3">
            The Weave
          </h1>
          <p className="text-sm text-[#9A9385] max-w-[65ch] leading-relaxed">
            Where individual dispatches are woven into cohesive, longform structural essays. Published only when multiple threads cross over a multi-day cycle — never filled on a forced schedule.
          </p>
        </div>

        {/* Vertical List of Publications */}
        <div className="divide-y divide-[rgba(233,227,213,0.1)] my-6">
          {weaveArticles.map((article) => (
            <article key={article.slug} className="py-8 group">
              <Link href={`/weave/${article.slug}`} className="block space-y-3.5">
                <div className="flex items-center gap-3 text-[11px] text-[#6E7C82] tracking-wider uppercase">
                  <span className="text-[#EBA43C] font-semibold">{article.issue}</span>
                  <span>·</span>
                  <span>{article.date}</span>
                  <span>·</span>
                  <span>{article.readTime}</span>
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl text-[#E9E3D5] group-hover:text-[#EBA43C] transition-colors leading-snug">
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

                  <span className="text-[#EBA43C] text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
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
          Analyst only writes a Weave when a theme spans ≥3 dispatches in a 7-day window or reaches high correlation confidence (≥0.85). If no threads cross sufficiently during a week: <i>&ldquo;No weave this week — not enough threads crossed to make a fabric.&rdquo;</i>
        </div>

        <PrinciplesFooter />
      </main>
    </div>
  );
}
