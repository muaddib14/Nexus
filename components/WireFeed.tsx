"use client";

import React, { useState, useEffect } from "react";

export interface DispatchItem {
  id: string;
  leadId: string;
  stamp: "flash" | "bulletin" | "urgent" | "routine" | "killed" | "refused";
  date: string;
  time: string;
  createdAt?: string;
  title: string;
  content: string;
  threadA: string;
  threadB: string;
  sources: string[];
  confidence: string;
  rejectedBy?: "scout" | "analyst";
  rejectionReason?: string;
}

function formatDispatchDate(createdAt?: string, fallbackDate?: string): string {
  if (!createdAt) return fallbackDate ?? "";
  const d = new Date(createdAt);
  if (isNaN(d.getTime())) return fallbackDate ?? "";
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", timeZone: "UTC" });
}

export const dispatches: DispatchItem[] = [
  {
    id: "disp-1",
    leadId: "#104",
    stamp: "flash",
    date: "Sep 04",
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
    leadId: "#102",
    stamp: "killed",
    date: "Sep 04",
    time: "02:31 UTC",
    title: "Single-exchange token rally cited as market-wide signal",
    content: "Claim rested on one venue's data with no second source to confirm. Not enough to file. Lead logged and dropped rather than dressed up.",
    threadA: "single venue",
    threadB: "nothing to cross",
    sources: ["1 source", "uncorroborated"],
    confidence: "conf 0.34",
    rejectedBy: "scout",
    rejectionReason: "killed by scout:",
  },
  {
    id: "disp-3",
    leadId: "#103",
    stamp: "urgent",
    date: "Sep 04",
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
    leadId: "#101",
    stamp: "refused",
    date: "Sep 04",
    time: "01:22 UTC",
    title: "Analyst declined: lead read as a trade call, not an observation",
    content: "The framing tipped from 'here's what's happening' into 'here's what to do about it.' Outside desk remit — observation only, not advice. Rewritten as a neutral note or not filed at all — this time, not filed.",
    threadA: "observation",
    threadB: "crossed into advice",
    sources: ["flagged: advice-adjacent"],
    confidence: "conf 0.55",
    rejectedBy: "analyst",
    rejectionReason: "refused by analyst:",
  },
  {
    id: "disp-5",
    leadId: "#098",
    stamp: "routine",
    date: "Sep 04",
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
  const [items, setItems] = useState<DispatchItem[]>(dispatches);

  useEffect(() => {
    let cancelled = false;

    async function loadDispatches() {
      try {
        const res = await fetch("/api/dispatches");
        const json = await res.json();
        if (!cancelled && Array.isArray(json.data) && json.data.length > 0) {
          setItems(json.data);
        }
      } catch (error) {
        console.error("[WireFeed] failed to load dispatches", error);
      }
    }

    loadDispatches();
    const interval = setInterval(loadDispatches, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const filteredDispatches = items.filter((d) => {
    if (filter === "all") return true;
    return d.stamp === filter;
  });

  return (
    <section className="py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-4 pb-4 border-b border-[rgba(233,227,213,0.18)] font-mono">
        <div>
          <h2 className="font-bold text-sm tracking-[0.24em] uppercase text-[#E9E3D5]">The Crossing Feed</h2>
          <p className="text-xs text-[#9A9385] tracking-wider mt-1">
            Every thread the desk crossed, killed, or refused — shown in full transparency
          </p>
        </div>

        {/* Filter Badges with separate killed and refused */}
        <div className="flex items-center gap-1.5 flex-wrap text-[10px] tracking-wider">
          {["all", "flash", "urgent", "routine", "killed", "refused"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-2.5 py-1 uppercase transition-colors border ${
                filter === type
                  ? "border-[#CCFF00] text-[#CCFF00] bg-[rgba(204,255,0,0.1)] font-bold"
                  : "border-[rgba(233,227,213,0.1)] text-[#6E7C82] hover:text-[#E9E3D5]"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-[rgba(233,227,213,0.1)]">
        {filteredDispatches.map((item) => {
          const isKilledOrRefused = item.stamp === "killed" || item.stamp === "refused";
          return (
            <article
              key={item.id}
              id={`lead-${item.leadId.replace("#", "")}`}
              className={`grid grid-cols-1 sm:grid-cols-[108px_1fr] gap-4 py-5 px-1 transition-colors hover:bg-[#17140E]/60 ${
                isKilledOrRefused ? "opacity-90" : ""
              }`}
            >
              {/* Left Margin Stamp, Time & Lead ID */}
              <div className="flex sm:flex-col items-baseline sm:items-start gap-1.5 pt-0.5 font-mono">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[9px] font-bold tracking-[0.18em] px-2 py-0.5 uppercase border ${
                      item.stamp === "flash"
                        ? "text-[#D64A3A] border-[#D64A3A] bg-[rgba(214,74,58,0.08)]"
                        : item.stamp === "urgent"
                        ? "text-[#E9E3D5] border-[#E9E3D5]"
                        : item.stamp === "killed"
                        ? "text-[#D64A3A] border-[#D64A3A] border-dashed"
                        : item.stamp === "refused"
                        ? "text-[#D64A3A] border-[#D64A3A] bg-[rgba(214,74,58,0.06)]"
                        : "text-[#6E7C82] border-[#6E7C82]"
                    }`}
                  >
                    {item.stamp}
                  </span>
                  <span className="text-[10px] font-mono text-[#CCFF00] font-semibold">{item.leadId}</span>
                </div>
                <span className="text-[10px] text-[#6E7C82] tracking-wider">
                  {formatDispatchDate(item.createdAt, item.date)} · {item.time}
                </span>
              </div>

              {/* Main Article Body */}
              <div className="space-y-2">
                <h3
                  className={`font-serif font-normal text-xl leading-snug tracking-normal ${
                    isKilledOrRefused ? "line-through decoration-[#D64A3A] text-[#6E7C82]" : "text-[#E9E3D5]"
                  }`}
                >
                  {item.title}
                </h3>

                <p
                  className={`font-serif text-[15px] leading-relaxed max-w-[62ch] ${
                    isKilledOrRefused ? "italic text-[#6E7C82]" : "text-[#9A9385]"
                  }`}
                >
                  {isKilledOrRefused && (
                    <span className="text-[#D64A3A] not-italic font-mono font-medium mr-1.5">
                      {item.rejectionReason}
                    </span>
                  )}
                  {item.content}
                </p>

                {/* Crossing Badge */}
                <div className="inline-flex items-center gap-2 text-[10.5px] uppercase tracking-wider text-[#6E7C82] font-mono pt-1">
                  <span className="text-[#9A9385]">{item.threadA}</span>
                  <span className="text-[#CCFF00] font-bold text-xs">✕</span>
                  <span className="text-[#9A9385]">{item.threadB}</span>
                </div>

                {/* Meta information */}
                <div className="pt-2 font-mono text-[10px] text-[#6E7C82] tracking-wider flex items-center gap-3 flex-wrap">
                  <span>{item.sources.join(" · ")}</span>
                  <span>{item.confidence}</span>
                  {!isKilledOrRefused && <span className="text-[#9A9385] font-semibold tracking-widest">— 30 —</span>}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
