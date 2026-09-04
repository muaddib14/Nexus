"use client";

import React, { useState, useEffect, useCallback } from "react";

export interface FeaturedDispatch {
  leadId: string;
  stamp: string;
  time: string;
  desk: string;
  threadA: string;
  threadB: string;
  title: string;
  paras: string[];
  sources: string[];
  confidence: string;
}

// Curated Macro ✕ Crypto crossing dispatches pool
const DEFAULT_DISPATCH_POOL: FeaturedDispatch[] = [
  {
    leadId: "#104",
    stamp: "bulletin",
    time: "04:23 UTC",
    desk: "desk 02",
    threadA: "dollar funding",
    threadB: "stablecoin supply",
    title: "Dollar funding tightens as stablecoin supply slips in the same window",
    paras: [
      "Two things moved in the same short window tonight, and the desk doesn't think they're strangers. On the macro side, a tightening in short-dated dollar funding — the plumbing that sets the price of holding cash. On the other, a quiet contraction in aggregate stablecoin supply across the majors.",
      "Read together, they sketch the same story from two ends: dollars getting a little scarcer, and the crypto market's dollar-proxy shrinking to match. The desk isn't calling cause and effect — only noting that the two rhymes are loud enough tonight to write down. If either reverses tomorrow, the link was noise. If both hold, it's a thread worth pulling."
    ],
    sources: ["Reuters", "CNBC", "The Block"],
    confidence: "0.81"
  },
  {
    leadId: "#105",
    stamp: "flash",
    time: "03:48 UTC",
    desk: "desk 01",
    threadA: "rate-path repricing",
    threadB: "perp funding",
    title: "A rate-path repricing and a quiet unwind in perp funding point the same direction",
    paras: [
      "Front-end sovereign yields re-anchored sharply following the morning inflation revisions, but the real tell appeared on digital venues three hours later: perpetual futures funding rates across major contracts compressed to flat without an accompanying drop in spot price.",
      "When spot holds firm while leverage premiums evaporate, it signals orderly balance-sheet deleveraging rather than panic liquidation. The desk flags this as a classic liquidity transmission: institutional desks reallocating capital to traditional risk-free cash rails as yield spreads widen."
    ],
    sources: ["Reuters", "CoinDesk", "DL News"],
    confidence: "0.90"
  },
  {
    leadId: "#106",
    stamp: "urgent",
    time: "02:15 UTC",
    desk: "desk 02",
    threadA: "energy print",
    threadB: "risk appetite",
    title: "Energy print lands soft; the read-through to risk appetite is smaller than the headline suggests",
    paras: [
      "A cooler-than-expected energy sub-index generated immediate headline optimism across financial media, but depth of book on risk assets tells a more cautious story. Market participants bidding the initial print encountered heavy passive supply near key resistance bands.",
      "The read-through to crypto majors is distinctly muted. While retail aggregates interpret lower headline energy costs as an immediate trigger for looser monetary policy, institutional participants are treating the move as transient margin relief rather than structural liquidity expansion."
    ],
    sources: ["CNBC", "Yahoo Finance", "The Block"],
    confidence: "0.74"
  },
  {
    leadId: "#107",
    stamp: "routine",
    time: "00:52 UTC",
    desk: "desk 01",
    threadA: "reserve drainage",
    threadB: "collateral spreads",
    title: "Overnight reserve drainage coincides with quiet compression in digital collateral spreads",
    paras: [
      "Federal Reserve balance sheet data released at the market close indicates accelerated runoff in the overnight reverse repo facility, draining excess liquidity from commercial clearing banks for the third consecutive week.",
      "Simultaneously, borrowing costs against premier on-chain collateral ticked upward by 35 basis points. Viewed at the intersection, digital collateral facilities are beginning to register the same balance-sheet frictions now visible in traditional money markets."
    ],
    sources: ["Bloomberg", "Reuters", "CoinDesk"],
    confidence: "0.86"
  }
];

export default function HeroFiling() {
  const [dispatchPool, setDispatchPool] = useState<FeaturedDispatch[]>(DEFAULT_DISPATCH_POOL);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [displayedParas, setDisplayedParas] = useState<string[]>(["", ""]);
  const [isTypingComplete, setIsTypingComplete] = useState<boolean>(false);
  const [isAutoCycling, setIsAutoCycling] = useState<boolean>(true);

  const activeDispatch = dispatchPool[currentIndex] || DEFAULT_DISPATCH_POOL[0];

  // 1. Fetch live dispatches from Neon DB if available
  useEffect(() => {
    async function loadLiveDispatches() {
      try {
        const res = await fetch("/api/dispatches");
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            // Map DB rows to featured dispatch format
            const validDbDispatches = json.data
              .filter((d: any) => d.stamp !== "killed" && d.stamp !== "refused")
              .map((d: any) => ({
                leadId: d.leadId || "#104",
                stamp: d.stamp || "bulletin",
                time: d.time || "04:23 UTC",
                desk: "desk 01",
                threadA: d.threadA || "macro tape",
                threadB: d.threadB || "crypto float",
                title: d.title,
                paras: typeof d.content === "string" ? [d.content] : (Array.isArray(d.content) ? d.content : [String(d.content)]),
                sources: d.sources || ["Reuters", "CoinDesk"],
                confidence: d.confidence?.replace("conf ", "") || "0.81"
              }));

            if (validDbDispatches.length > 0) {
              // Combine DB items with curated pool to ensure variety
              setDispatchPool([...validDbDispatches, ...DEFAULT_DISPATCH_POOL]);
            }
          }
        }
      } catch {
        // Fallback gracefully to default pool
      }
    }

    loadLiveDispatches();
  }, []);

  // 2. Typewriter Effect
  useEffect(() => {
    const paras = activeDispatch.paras || [];
    setDisplayedParas(new Array(paras.length).fill(""));
    setIsTypingComplete(false);

    let pIndex = 0;
    let cIndex = 0;
    let timer: NodeJS.Timeout;

    const typeStep = () => {
      if (pIndex >= paras.length) {
        setIsTypingComplete(true);
        return;
      }

      const currentTargetText = paras[pIndex];
      if (cIndex < currentTargetText.length) {
        const nextChar = currentTargetText[cIndex];
        setDisplayedParas((prev) => {
          const updated = [...prev];
          updated[pIndex] = currentTargetText.slice(0, cIndex + 1);
          return updated;
        });
        cIndex++;
        const speed = nextChar === " " ? 10 : 6 + Math.random() * 12;
        timer = setTimeout(typeStep, speed);
      } else {
        pIndex++;
        cIndex = 0;
        timer = setTimeout(typeStep, 200);
      }
    };

    timer = setTimeout(typeStep, 350);
    return () => clearTimeout(timer);
  }, [currentIndex, activeDispatch]);

  // 3. Auto-Cycle to Next Dispatch (every 40 seconds)
  useEffect(() => {
    if (!isAutoCycling) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % dispatchPool.length);
    }, 40000);

    return () => clearInterval(interval);
  }, [isAutoCycling, dispatchPool.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % dispatchPool.length);
  }, [dispatchPool.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + dispatchPool.length) % dispatchPool.length);
  }, [dispatchPool.length]);

  return (
    <section className="py-10 border-b border-[rgba(233,227,213,0.1)]">
      {/* Top Header with Live Indicator & Cycle Controller */}
      <div className="flex items-center justify-between gap-3 mb-5 font-mono text-[10.5px] uppercase tracking-[0.28em] text-[#EBA43C]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EBA43C] animate-pulse" />
            live at the crossing — now
          </span>
          <div className="hidden sm:block w-12 h-[1px] bg-[rgba(235,164,60,0.25)]" />
        </div>

        {/* Dynamic Topic Switcher Controller */}
        <div className="flex items-center gap-3 text-[10px] tracking-wider text-[#9A9385]">
          <span className="text-[#6E7C82]">
            lead {currentIndex + 1} of {dispatchPool.length}
          </span>
          <div className="flex items-center border border-[rgba(233,227,213,0.18)]">
            <button
              onClick={handlePrev}
              title="Previous crossing dispatch"
              className="px-2 py-0.5 hover:bg-[rgba(235,164,60,0.1)] hover:text-[#EBA43C] transition-colors border-r border-[rgba(233,227,213,0.18)] cursor-pointer"
            >
              ‹
            </button>
            <button
              onClick={handleNext}
              title="Next crossing dispatch"
              className="px-2 py-0.5 hover:bg-[rgba(235,164,60,0.1)] hover:text-[#EBA43C] transition-colors cursor-pointer"
            >
              ›
            </button>
          </div>
          <button
            onClick={() => setIsAutoCycling(!isAutoCycling)}
            className={`hidden md:inline px-1.5 py-0.5 border text-[9px] transition-colors ${
              isAutoCycling
                ? "border-[#EBA43C]/40 text-[#EBA43C] bg-[#EBA43C]/5"
                : "border-[rgba(233,227,213,0.14)] text-[#6E7C82]"
            }`}
          >
            {isAutoCycling ? "auto-cycle: on" : "auto-cycle: paused"}
          </button>
        </div>
      </div>

      {/* Dynamic Crossing Rail */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-6 font-mono text-[9.5px] uppercase tracking-[0.2em] text-[#9A9385]">
        <div className="h-[1px] bg-gradient-to-r from-transparent to-[rgba(233,227,213,0.18)]" />
        <div className="flex items-center gap-2 px-2 py-0.5 bg-[#17140E]/60 border border-[rgba(233,227,213,0.08)]">
          <span className="text-[#D8D2C4] font-medium">{activeDispatch.threadA}</span>
          <span className="text-[#EBA43C] font-bold text-sm animate-spin-x">✕</span>
          <span className="text-[#D8D2C4] font-medium">{activeDispatch.threadB}</span>
        </div>
        <div className="h-[1px] bg-gradient-to-l from-transparent to-[rgba(233,227,213,0.18)]" />
      </div>

      {/* Hero Dispatch Filing Card */}
      <article className="bg-[#17140E] border border-[rgba(233,227,213,0.18)] border-l-4 border-l-[#EBA43C] p-6 sm:p-7 relative shadow-2xl transition-all duration-300">
        <div className="flex items-center gap-3.5 mb-4 flex-wrap text-xs font-mono">
          <span className="text-[10px] font-bold tracking-[0.18em] px-2 py-0.5 border border-[#EBA43C] text-[#EBA43C] uppercase">
            {activeDispatch.stamp}
          </span>
          <span className="text-[11px] text-[#6E7C82] tracking-wider">
            <b className="text-[#9A9385] font-medium">{activeDispatch.desk}</b> · <span>{activeDispatch.time}</span> · filed by analyst · <span className="text-[#EBA43C]">{activeDispatch.leadId}</span>
          </span>
        </div>

        <h1 className="font-serif font-normal text-2xl sm:text-3xl lg:text-[36px] leading-[1.18] tracking-tight mb-5 text-[#E9E3D5] transition-opacity duration-200">
          {activeDispatch.title}
        </h1>

        <div className="font-serif text-[17px] leading-[1.62] text-[#D8D2C4] max-w-[64ch] space-y-3 min-h-[120px]">
          {displayedParas.map((paraText, i) => (
            <p key={i}>
              {paraText}
              {i === (isTypingComplete ? displayedParas.length - 1 : displayedParas.findIndex(p => p.length < (activeDispatch.paras[i]?.length || 0)) !== -1 ? displayedParas.findIndex(p => p.length < (activeDispatch.paras[i]?.length || 0)) : 0) && (
                <span className="typing-cursor" />
              )}
            </p>
          ))}
        </div>

        <div className="mt-6 pt-3.5 border-t border-dashed border-[rgba(233,227,213,0.18)] flex flex-wrap justify-between items-center text-[10.5px] text-[#6E7C82] tracking-wider gap-3 font-mono">
          <div className="flex items-center gap-2 flex-wrap">
            <span>cross-referenced:</span>
            {activeDispatch.sources.map((src, idx) => (
              <span key={idx} className="text-[#9A9385] border border-[rgba(233,227,213,0.18)] px-2 py-0.5 text-[9.5px]">
                {src}
              </span>
            ))}
          </div>

          <span>2 threads crossed · confidence {activeDispatch.confidence} · routed by scout</span>
        </div>
      </article>
    </section>
  );
}
