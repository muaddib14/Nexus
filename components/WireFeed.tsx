"use client";

import React, { useState } from "react";

interface DispatchItem {
  id: string;
  stamp: "flash" | "bulletin" | "urgent" | "routine" | "killed";
  time: string;
  title: string;
  content: string;
  threadA: string;
  threadB: string;
  sources: string[];
  confidence: string;
  isKilled?: boolean;
  killReason?: string;
}

const dispatches: DispatchItem[] = [
  {
    id: "disp-1",
    stamp: "flash",
    time: "02:47 UTC",
    title: "A rate-path repricing and a quiet unwind in perp funding are pointing the same direction",
    content: "Two desks rarely watch each other, but the move in front-end yields and the drift in perpetual funding across major venues line up too neatly this session to read as coincidence. The desk lays out what connects them — and what would break the link.",
    threadA: "rate path",
    threadB: "perp funding",
    sources: ["Reuters", "CoinDesk", "DL News"],
    confidence: "conf 0.90",
  },
  {
    id: "disp-2",
    stamp: "killed",
    time: "02:31 UTC",
    title: "Single-exchange token rally cited as market-wide signal",
    content: "Claim rested on one venue's data with no second source to confirm. Not enough to file. Lead logged and dropped rather than dressed up.",
    threadA: "single venue",
    threadB: "nothing to cross",
    sources: ["1 source", "uncorroborated"],
    confidence: "conf 0.34",
    isKilled: true,
    killReason: "killed by analyst:",
  },
  {
    id: "disp-3",
    stamp: "urgent",
    time: "01:58 UTC",
    title: "Energy print lands soft; the read-through to risk appetite is smaller than the headline suggests",
    content: "A cooler-than-expected number moved the tape, but the desk walks through why the second-order effect on broader risk — including the crypto majors — is more muted than the first reaction implied.",
    threadA: "energy print",
    threadB: "risk appetite",
    sources: ["CNBC", "Yahoo Finance"],
    confidence: "conf 0.72",
  },
  {
    id: "disp-4",
    stamp: "killed",
    time: "01:22 UTC",
    title: "Analyst declined: lead read as a trade call, not an observation",
    content: "The framing tipped from 'here's what's happening' into 'here's what to do about it.' Outside the desk's remit. Rewritten as a neutral note or not filed at all — this time, not filed.",
    threadA: "observation",
    threadB: "crossed into advice",
    sources: ["flagged: advice-adjacent"],
    confidence: "conf 0.55",
    isKilled: true,
    killReason: "killed by analyst:",
  },
  {
    id: "disp-5",
    stamp: "routine",
    time: "00:49 UTC",
    title: "Overnight session recap: what moved, what didn't, and what the desk is watching next",
    content: "A low-drama tape gets a low-drama file. The desk logs the session's range, notes the absence of a catalyst, and flags the two prints on tomorrow's calendar worth staying awake for.",
    threadA: "overnight range",
    threadB: "tomorrow's calendar",
    sources: ["Reuters", "FT"],
    confidence: "conf 0.61",
  },
];

export default function WireFeed() {
  const [filter, setFilter] = useState<string>("all");

  const filteredDispatches = dispatches.filter((d) => {
    if (filter === "all") return true;
    if (filter === "killed") return d.isKilled;
    return d.stamp === filter;
  });

  return (
    <section className="py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-4 pb-4 border-b border-[rgba(233,227,213,0.18)] font-mono">
        <div>
          <h2 className="font-bold text-sm tracking-[0.24em] uppercase text-[#E9E3D5]">The Crossing Feed</h2>
          <p className="text-xs text-[#9A9385] tracking-wider mt-1">
            Every thread the desk crossed, killed, or passed on — shown in full transparency
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 flex-wrap text-[10px] tracking-wider">
          {["all", "flash", "urgent", "routine", "killed"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-2.5 py-1 uppercase transition-colors border ${
                filter === type
                  ? "border-[#EBA43C] text-[#EBA43C] bg-[rgba(235,164,60,0.1)] font-bold"
                  : "border-[rgba(233,227,213,0.1)] text-[#6E7C82] hover:text-[#E9E3D5]"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-[rgba(233,227,213,0.1)]">
        {filteredDispatches.map((item) => (
          <article
            key={item.id}
            className={`grid grid-cols-1 sm:grid-cols-[96px_1fr] gap-4 py-5 px-1 transition-colors hover:bg-[#17140E]/60 ${
              item.isKilled ? "opacity-90" : ""
            }`}
          >
            {/* Left Margin Stamp & Time */}
            <div className="flex sm:flex-col items-baseline sm:items-start gap-2 pt-0.5 font-mono">
              <span
                className={`text-[9px] font-bold tracking-[0.18em] px-2 py-0.5 uppercase border ${
                  item.stamp === "flash"
                    ? "text-[#D64A3A] border-[#D64A3A] bg-[rgba(214,74,58,0.08)]"
                    : item.stamp === "urgent"
                    ? "text-[#E9E3D5] border-[#E9E3D5]"
                    : item.stamp === "killed"
                    ? "text-[#D64A3A] border-[#D64A3A] border-dashed"
                    : "text-[#6E7C82] border-[#6E7C82]"
                }`}
              >
                {item.stamp}
              </span>
              <span className="text-[10px] text-[#6E7C82] tracking-wider">{item.time}</span>
            </div>

            {/* Main Article Body */}
            <div className="space-y-2">
              <h3
                className={`font-serif font-normal text-xl leading-snug tracking-normal ${
                  item.isKilled ? "line-through decoration-[#D64A3A] text-[#6E7C82]" : "text-[#E9E3D5]"
                }`}
              >
                {item.title}
              </h3>

              <p
                className={`font-serif text-[15px] leading-relaxed max-w-[62ch] ${
                  item.isKilled ? "italic text-[#6E7C82]" : "text-[#9A9385]"
                }`}
              >
                {item.isKilled && (
                  <span className="text-[#D64A3A] not-italic font-mono font-medium mr-1.5">
                    {item.killReason}
                  </span>
                )}
                {item.content}
              </p>

              {/* Crossing Badge */}
              <div className="inline-flex items-center gap-2 text-[10.5px] uppercase tracking-wider text-[#6E7C82] font-mono pt-1">
                <span className="text-[#9A9385]">{item.threadA}</span>
                <span className="text-[#EBA43C] font-bold text-xs">✕</span>
                <span className="text-[#9A9385]">{item.threadB}</span>
              </div>

              {/* Meta information */}
              <div className="pt-2 font-mono text-[10px] text-[#6E7C82] tracking-wider flex items-center gap-3 flex-wrap">
                <span>{item.sources.join(" · ")}</span>
                <span>{item.confidence}</span>
                {!item.isKilled && <span className="text-[#9A9385] font-semibold tracking-widest">— 30 —</span>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
