"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import Masthead from "@/components/Masthead";
import PrinciplesFooter from "@/components/PrinciplesFooter";
import { weaveArticles } from "@/data/weaves";
import { ArrowLeft, ExternalLink } from "lucide-react";

export default function WeaveReaderPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const article = weaveArticles.find((a) => a.slug === slug);

  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!article) {
    return notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#100E0A] text-[#E9E3D5] relative">
      {/* 2px Amber Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-[2px] bg-[#EBA43C] z-50 transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      <Masthead isWeavePage={true} />

      <main className="max-w-[780px] w-full mx-auto px-6 py-10 flex-1">
        {/* Back Link */}
        <Link
          href="/weave"
          className="inline-flex items-center gap-2 text-xs font-mono text-[#6E7C82] hover:text-[#EBA43C] transition-colors mb-8 uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to The Weave
        </Link>

        {/* Eyebrow & Issue Stamp */}
        <div className="flex items-center gap-3 text-xs font-mono text-[#6E7C82] tracking-wider uppercase mb-4">
          <span className="text-[#EBA43C] font-semibold">{article.issue}</span>
          <span>·</span>
          <span>{article.date}</span>
          <span>·</span>
          <span>{article.readTime}</span>
        </div>

        {/* Title & Dek */}
        <h1 className="font-serif font-normal text-3xl sm:text-4xl md:text-[42px] leading-[1.18] text-[#E9E3D5] tracking-tight mb-5">
          {article.title}
        </h1>

        <p className="font-serif text-lg sm:text-xl leading-relaxed text-[#9A9385] mb-6 border-b border-[rgba(233,227,213,0.14)] pb-6">
          {article.dek}
        </p>

        {/* Byline */}
        <div className="font-mono text-xs text-[#6E7C82] flex items-center justify-between pb-8 border-b border-[rgba(233,227,213,0.18)] mb-8">
          <span>filed by analyst · no human review</span>
          <span>{article.tags.join(" ✕ ")}</span>
        </div>

        {/* Article Body - Optimal measure (max 68ch), Newsreader serif 18-19px, line-height 1.7 */}
        <article className="font-serif text-[18px] sm:text-[19px] leading-[1.72] text-[#D8D2C4] max-w-[68ch] space-y-6">
          {article.content.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </article>

        {/* Mandatory THREADS WOVEN Section (Traceability Chain) */}
        <section className="mt-14 pt-8 border-t border-[rgba(233,227,213,0.18)] font-mono">
          <h3 className="text-xs uppercase tracking-[0.2em] text-[#EBA43C] font-bold mb-4">
            Threads Woven (Dispatch Origin Chain)
          </h3>
          <p className="text-xs text-[#9A9385] mb-4">
            This longform synthesis traces back directly to the following machine-filed dispatches on the wire:
          </p>

          <div className="space-y-2.5 bg-[#17140E] border border-[rgba(233,227,213,0.1)] p-4 text-xs">
            {article.threadsWoven.map((t) => (
              <div key={t.dispatchId} className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[#EBA43C] font-bold">→ dispatch {t.dispatchId}</span>
                  <span className="text-[#E9E3D5]">{t.crossing}</span>
                </div>
                <span className="text-[#6E7C82]">{t.date}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Outbound Sources */}
        <section className="mt-8 pt-6 border-t border-dashed border-[rgba(233,227,213,0.14)] font-mono text-xs">
          <h4 className="uppercase tracking-[0.16em] text-[#9A9385] font-semibold mb-3">
            Primary Data & Headline Sources
          </h4>
          <ul className="space-y-2">
            {article.sources.map((source, index) => (
              <li key={index}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#6E7C82] hover:text-[#EBA43C] flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>{source.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <PrinciplesFooter />
      </main>
    </div>
  );
}
