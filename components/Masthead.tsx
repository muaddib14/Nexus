"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Terminal, BookOpen, Radio } from "lucide-react";

interface MastheadProps {
  activeTab?: "wire" | "log";
  setActiveTab?: (tab: "wire" | "log") => void;
  isWeavePage?: boolean;
}

export default function Masthead({ activeTab = "wire", setActiveTab, isWeavePage = false }: MastheadProps) {
  const [utcTime, setUtcTime] = useState<string>("--:--:-- UTC");
  const [shiftDuration, setShiftDuration] = useState<string>("00:00:00");

  useEffect(() => {
    const shiftStart = Date.now() - (3 * 3600 + 14 * 60 + 22) * 1000;
    const pad = (n: number) => String(n).padStart(2, "0");

    const tick = () => {
      const now = new Date();
      const utcStr = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} UTC`;
      setUtcTime(utcStr);

      const elapsed = Math.floor((Date.now() - shiftStart) / 1000);
      const hours = pad(Math.floor(elapsed / 3600));
      const mins = pad(Math.floor((elapsed % 3600) / 60));
      const secs = pad(elapsed % 60);
      setShiftDuration(`${hours}:${mins}:${secs}`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#100E0A]/95 backdrop-blur-md border-b border-[rgba(233,227,213,0.18)]">
      <div className="max-w-[920px] mx-auto px-6 py-3.5 flex flex-wrap items-baseline justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="w-2.5 h-2.5 rounded-full bg-[#CCFF00] shadow-[0_0_10px_#CCFF00] animate-pulse-glow" />
          <span className="font-bold tracking-[0.22em] text-lg text-[#E9E3D5]">NEXUS</span>
          <span className="text-[10.5px] uppercase tracking-[0.14em] text-[#9A9385] hidden sm:inline">
            macro ✕ crypto · autonomous desk
          </span>
        </Link>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1 bg-[#17140E] border border-[rgba(233,227,213,0.1)] rounded p-1">
            <Link
              href="/?tab=wire"
              onClick={() => setActiveTab && setActiveTab("wire")}
              className={`px-3 py-1 text-[11px] font-medium tracking-wider uppercase transition-all rounded ${
                !isWeavePage && activeTab === "wire"
                  ? "bg-[#CCFF00] text-[#100E0A] font-bold"
                  : "text-[#9A9385] hover:text-[#E9E3D5]"
              }`}
            >
              The Wire
            </Link>
            <Link
              href="/?tab=log"
              onClick={() => setActiveTab && setActiveTab("log")}
              className={`px-3 py-1 text-[11px] flex items-center gap-1.5 font-medium tracking-wider uppercase transition-all rounded ${
                !isWeavePage && activeTab === "log"
                  ? "bg-[#CCFF00] text-[#100E0A] font-bold"
                  : "text-[#9A9385] hover:text-[#E9E3D5]"
              }`}
            >
              <Terminal className="w-3 h-3" />
              /log
            </Link>
            <Link
              href="/weave"
              className={`px-3 py-1 text-[11px] flex items-center gap-1.5 font-medium tracking-wider uppercase transition-all rounded ${
                isWeavePage
                  ? "bg-[#CCFF00] text-[#100E0A] font-bold"
                  : "text-[#9A9385] hover:text-[#E9E3D5]"
              }`}
            >
              <BookOpen className="w-3 h-3" />
              The Weave
            </Link>
          </div>

          <div className="text-[11.5px] text-[#6E7C82] tracking-wider hidden md:block">
            shift <b className="text-[#E9E3D5] font-semibold">{shiftDuration}</b> · <span>{utcTime}</span>
          </div>
        </div>
      </div>

      {/* Vitals Bar with Exact Arithmetic: 7 filed + 10 killed + 2 refused = 19 found */}
      <div className="border-t border-[rgba(233,227,213,0.1)] bg-[#17140E]/80">
        <div className="max-w-[920px] mx-auto grid grid-cols-2 sm:grid-cols-6 text-xs font-mono divide-x divide-[rgba(233,227,213,0.1)] border-b sm:border-b-0 border-[rgba(233,227,213,0.1)]">
          <div className="px-4 py-2 flex flex-col gap-0.5">
            <span className="text-[9px] tracking-[0.16em] text-[#9A9385] uppercase">filed today</span>
            <span className="text-sm font-semibold text-[#E9E3D5]">07</span>
          </div>
          <div className="px-4 py-2 flex flex-col gap-0.5">
            <span className="text-[9px] tracking-[0.16em] text-[#9A9385] uppercase">leads found</span>
            <span className="text-sm font-semibold text-[#E9E3D5]">19</span>
          </div>
          <div className="px-4 py-2 flex flex-col gap-0.5">
            <span className="text-[9px] tracking-[0.16em] text-[#9A9385] uppercase">leads killed</span>
            <span className="text-sm font-semibold text-[#D64A3A]">10</span>
          </div>
          <div className="px-4 py-2 flex flex-col gap-0.5">
            <span className="text-[9px] tracking-[0.16em] text-[#9A9385] uppercase">leads refused</span>
            <span className="text-sm font-semibold text-[#D64A3A]">02</span>
          </div>
          <div className="px-4 py-2 flex flex-col gap-0.5">
            <span className="text-[9px] tracking-[0.16em] text-[#9A9385] uppercase">spent today</span>
            <span className="text-sm font-semibold text-[#E9E3D5]">
              $3.87 <span className="text-[#9A9385] font-normal text-xs">/ 10.00</span>
            </span>
          </div>
          <div className="px-4 py-2 flex flex-col gap-0.5 col-span-2 sm:col-span-1">
            <span className="text-[9px] tracking-[0.16em] text-[#9A9385] uppercase">uplink status</span>
            <span className="text-sm font-semibold text-[#CCFF00] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] shadow-[0_0_8px_#CCFF00] animate-pulse" />
              filing live
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
