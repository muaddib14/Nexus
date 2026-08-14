"use client";

import React, { useState, useEffect } from "react";

export default function HeroFiling() {
  const paras = [
    "Two things moved in the same short window tonight, and the desk doesn't think they're strangers. On the macro side, a tightening in short-dated dollar funding — the plumbing that sets the price of holding cash. On the other, a quiet contraction in aggregate stablecoin supply across the majors.",
    "Read together, they sketch the same story from two ends: dollars getting a little scarcer, and the crypto market's dollar-proxy shrinking to match. The desk isn't calling cause and effect — only noting that the two rhymes are loud enough tonight to write down. If either reverses tomorrow, the link was noise. If both hold, it's a thread worth pulling."
  ];

  const [displayedParas, setDisplayedParas] = useState<string[]>(["", ""]);
  const [isTypingComplete, setIsTypingComplete] = useState<boolean>(false);
  const [utcDateStr, setUtcDateStr] = useState<string>("03:14 UTC");

  useEffect(() => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const now = new Date();
    setUtcDateStr(`${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())} UTC`);

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
        const speed = nextChar === " " ? 14 : 9 + Math.random() * 20;
        timer = setTimeout(typeStep, speed);
      } else {
        pIndex++;
        cIndex = 0;
        timer = setTimeout(typeStep, 300);
      }
    };

    timer = setTimeout(typeStep, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="py-10 border-b border-[rgba(233,227,213,0.1)]">
      <div className="text-[10.5px] tracking-[0.28em] uppercase text-[#EBA43C] mb-5 flex items-center gap-3 font-mono">
        <span>live at the crossing — now</span>
        <div className="flex-1 h-[1px] bg-[rgba(235,164,60,0.14)]" />
      </div>

      {/* Crossing Rail */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-6 font-mono text-[9.5px] uppercase tracking-[0.2em] text-[#9A9385]">
        <div className="h-[1px] bg-gradient-to-r from-transparent to-[rgba(233,227,213,0.18)]" />
        <div className="flex items-center gap-2">
          <span>dollar funding</span>
          <span className="text-[#EBA43C] font-bold text-sm animate-spin-x">✕</span>
          <span>stablecoin supply</span>
        </div>
        <div className="h-[1px] bg-gradient-to-l from-transparent to-[rgba(233,227,213,0.18)]" />
      </div>

      {/* Hero Dispatch Filing Card */}
      <article className="bg-[#17140E] border border-[rgba(233,227,213,0.18)] border-l-4 border-l-[#EBA43C] p-6 sm:p-7 relative shadow-2xl">
        <div className="flex items-center gap-3.5 mb-4 flex-wrap text-xs font-mono">
          <span className="text-[10px] font-bold tracking-[0.18em] px-2 py-0.5 border border-[#EBA43C] text-[#EBA43C] uppercase">
            bulletin
          </span>
          <span className="text-[11px] text-[#6E7C82] tracking-wider">
            <b className="text-[#9A9385] font-medium">desk 02</b> · <span>{utcDateStr}</span> · filed by analyst
          </span>
        </div>

        <h1 className="font-serif font-normal text-2xl sm:text-3xl lg:text-[36px] leading-[1.18] tracking-tight mb-5 text-[#E9E3D5]">
          Dollar funding tightens as stablecoin supply slips in the same window
        </h1>

        <div className="font-serif text-[17px] leading-[1.62] text-[#D8D2C4] max-w-[64ch] space-y-3">
          {displayedParas.map((paraText, i) => (
            <p key={i}>
              {paraText}
              {i === (isTypingComplete ? 1 : displayedParas[1] !== "" ? 1 : 0) && (
                <span className="typing-cursor" />
              )}
            </p>
          ))}
        </div>

        <div className="mt-6 pt-3.5 border-t border-dashed border-[rgba(233,227,213,0.18)] flex flex-wrap justify-between items-center text-[10.5px] text-[#6E7C82] tracking-wider gap-3 font-mono">
          <div className="flex items-center gap-2 flex-wrap">
            <span>cross-referenced:</span>
            <span className="text-[#9A9385] border border-[rgba(233,227,213,0.18)] px-2 py-0.5 text-[9.5px]">
              Reuters
            </span>
            <span className="text-[#9A9385] border border-[rgba(233,227,213,0.18)] px-2 py-0.5 text-[9.5px]">
              CNBC
            </span>
            <span className="text-[#9A9385] border border-[rgba(233,227,213,0.18)] px-2 py-0.5 text-[9.5px]">
              The Block
            </span>
          </div>

          <span>2 threads crossed · confidence 0.81 · routed by scout</span>
        </div>
      </article>
    </section>
  );
}
