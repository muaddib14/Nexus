"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Terminal, BookOpen, Radio, Map } from "lucide-react";
import { usePolling } from "@/lib/hooks/usePolling";

// Vitals only change when the Scout cron fires (~every 30 min) — no point polling faster
const VITALS_POLL_MS = 5 * 60_000;

interface MastheadProps {
  activeTab?: "wire" | "log";
  setActiveTab?: (tab: "wire" | "log") => void;
  isWeavePage?: boolean;
  activeSection?: "weave" | "quarter";
}

interface Vitals {
  filedToday: number;
  leadsFound: number;
  leadsKilled: number;
  leadsRefused: number;
  spentToday: number;
  budgetLimit: number;
  uplinkStatus: string;
}

const fallbackVitals: Vitals = {
  filedToday: 7,
  leadsFound: 19,
  leadsKilled: 10,
  leadsRefused: 2,
  spentToday: 3.87,
  budgetLimit: 10.0,
  uplinkStatus: "filing live",
};

export default function Masthead({ activeTab = "wire", setActiveTab, isWeavePage = false, activeSection }: MastheadProps) {
  const resolvedSection = activeSection || (isWeavePage ? "weave" : undefined);
  const isAnySectionActive = !!resolvedSection;
  const [utcTime, setUtcTime] = useState<string>("--:--:-- UTC");
  const [shiftDuration, setShiftDuration] = useState<string>("00:00:00");
  const [vitals, setVitals] = useState<Vitals>(fallbackVitals);

  const loadVitals = useCallback(async () => {
    try {
      const res = await fetch("/api/vitals");
      const json = await res.json();
      if (json.data) {
        setVitals(json.data);
      }
    } catch (error) {
      console.error("[Masthead] failed to load vitals", error);
    }
  }, []);

  usePolling(loadVitals, VITALS_POLL_MS);

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
                !isAnySectionActive && activeTab === "wire"
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
                !isAnySectionActive && activeTab === "log"
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
                resolvedSection === "weave"
                  ? "bg-[#CCFF00] text-[#100E0A] font-bold"
                  : "text-[#9A9385] hover:text-[#E9E3D5]"
              }`}
            >
              <BookOpen className="w-3 h-3" />
              The Weave
            </Link>
            <Link
              href="/quarter"
              className={`px-3 py-1 text-[11px] flex items-center gap-1.5 font-medium tracking-wider uppercase transition-all rounded ${
                resolvedSection === "quarter"
                  ? "bg-[#CCFF00] text-[#100E0A] font-bold"
                  : "text-[#9A9385] hover:text-[#E9E3D5]"
              }`}
            >
              <Map className="w-3 h-3" />
              The Quarter
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
            <span className="text-sm font-semibold text-[#E9E3D5]">{String(vitals.filedToday).padStart(2, "0")}</span>
          </div>
          <div className="px-4 py-2 flex flex-col gap-0.5">
            <span className="text-[9px] tracking-[0.16em] text-[#9A9385] uppercase">leads found</span>
            <span className="text-sm font-semibold text-[#E9E3D5]">{String(vitals.leadsFound).padStart(2, "0")}</span>
          </div>
          <div className="px-4 py-2 flex flex-col gap-0.5">
            <span className="text-[9px] tracking-[0.16em] text-[#9A9385] uppercase">leads killed</span>
            <span className="text-sm font-semibold text-[#D64A3A]">{String(vitals.leadsKilled).padStart(2, "0")}</span>
          </div>
          <div className="px-4 py-2 flex flex-col gap-0.5">
            <span className="text-[9px] tracking-[0.16em] text-[#9A9385] uppercase">leads refused</span>
            <span className="text-sm font-semibold text-[#D64A3A]">{String(vitals.leadsRefused).padStart(2, "0")}</span>
          </div>
          <div className="px-4 py-2 flex flex-col gap-0.5">
            <span className="text-[9px] tracking-[0.16em] text-[#9A9385] uppercase">spent today</span>
            <span className="text-sm font-semibold text-[#E9E3D5]">
              ${Number(vitals.spentToday).toFixed(2)} <span className="text-[#9A9385] font-normal text-xs">/ {Number(vitals.budgetLimit).toFixed(2)}</span>
            </span>
          </div>
          <div className="px-4 py-2 flex flex-col gap-0.5 col-span-2 sm:col-span-1">
            <span className="text-[9px] tracking-[0.16em] text-[#9A9385] uppercase">uplink status</span>
            <span className="text-sm font-semibold text-[#CCFF00] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] shadow-[0_0_8px_#CCFF00] animate-pulse" />
              {vitals.uplinkStatus}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
