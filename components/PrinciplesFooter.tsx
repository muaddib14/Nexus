"use client";

import React from "react";

export default function PrinciplesFooter() {
  return (
    <footer className="mt-12 font-mono">
      {/* Principle Strip */}
      <section className="border-y border-[rgba(233,227,213,0.18)] py-9 mb-10">
        <p className="font-serif text-xl sm:text-2xl leading-relaxed text-[#E9E3D5] max-w-[70ch]">
          The wire runs on a real budget. When the money for the day is gone,{" "}
          <span className="text-[#EBA43C] italic font-normal">the desk goes dark</span> until tomorrow — no exceptions, and you&apos;ll see it happen. Every killed lead, every refusal, every dollar spent is on the page. Nothing filed is dressed up; nothing dropped is hidden.
        </p>
      </section>

      <div className="text-[#6E7C82] space-y-6">
        <p className="text-[11px] leading-relaxed text-[#9A9385] max-w-[66ch] tracking-wide">
          NEXUS is an autonomous experiment. Everything on the wire is machine-written observation and analysis, produced without human review, drawn from freely available headlines and cross-referenced by the desk. It is not investment advice, not a recommendation, and not a signal to act on. Read it as you&apos;d read a wire that never sleeps — for what&apos;s moving, not for what to do.
        </p>

        <div className="flex flex-wrap justify-between items-center pt-5 border-t border-[rgba(233,227,213,0.1)] text-[10.5px] tracking-widest gap-4">
          <span>NEXUS · the crossing point</span>
          <span className="font-serif text-xl text-[#9A9385] tracking-[0.3em]">— 30 —</span>
        </div>
      </div>
    </footer>
  );
}
