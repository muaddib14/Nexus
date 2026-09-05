"use client";

import React, { useState, useEffect, useRef } from "react";

interface StdoutLine {
  id: string;
  time: string;
  createdAt?: string;
  cycleId: number;
  actor: "scout" | "analyst" | "system";
  glyph: string | null;
  message: string;
  cls: "ok" | "dim" | "hit" | "kill" | "err";
  cost: number | null;
}

// External cron trigger cadence documented for NEXUS (cron-job.org / GitHub Actions)
const CRON_INTERVAL_MS = 30 * 60 * 1000;
const POLL_INTERVAL_MS = 15_000;
const BUDGET_LIMIT = 10.0;

export default function StdoutTerminal() {
  const [lines, setLines] = useState<StdoutLine[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const [lastPolledAgo, setLastPolledAgo] = useState<number>(0);
  const [countdown, setCountdown] = useState<string>("--:--");

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastPolledAtRef = useRef<number>(0);

  const pad = (n: number) => String(n).padStart(2, "0");

  useEffect(() => {
    let cancelled = false;

    async function loadStdout() {
      try {
        const res = await fetch("/api/stdout");
        const json = await res.json();
        if (!cancelled) {
          if (Array.isArray(json.data)) {
            setLines(json.data);
          }
          setConnected(json.source === "neon");
          lastPolledAtRef.current = Date.now();
        }
      } catch (error) {
        console.error("[StdoutTerminal] failed to load stdout", error);
      }
    }

    loadStdout();
    const interval = setInterval(loadStdout, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  // Heartbeat: freshness indicator + estimated next-cycle countdown based on the
  // real 30-minute external cron cadence and the last row's actual timestamp.
  useEffect(() => {
    const tick = () => {
      if (lastPolledAtRef.current) {
        setLastPolledAgo(Math.floor((Date.now() - lastPolledAtRef.current) / 1000));
      }

      const lastLine = lines[lines.length - 1];
      if (lastLine?.createdAt) {
        const lastRunAt = new Date(lastLine.createdAt).getTime();
        const nextRunAt = lastRunAt + CRON_INTERVAL_MS;
        const left = Math.max(0, Math.floor((nextRunAt - Date.now()) / 1000));
        setCountdown(left > 0 ? `${pad(Math.floor(left / 60))}:${pad(left % 60)}` : "any moment");
      }
    };

    tick();
    const heartbeat = setInterval(tick, 1000);
    return () => clearInterval(heartbeat);
  }, [lines]);

  const lastLine = lines[lines.length - 1];
  const cycleNum = lastLine?.cycleId ?? "—";
  const spend = lines.reduce((sum, l) => sum + (Number(l.cost) || 0), 0);

  const state: "scanning" | "filing" | "idle" = (() => {
    if (!lastLine) return "idle";
    if (lastLine.message.toLowerCase().includes("idle")) return "idle";
    if (lastLine.actor === "analyst") return "filing";
    if (lastLine.actor === "scout") return "scanning";
    return "idle";
  })();

  const getActorColor = (actor: string) => {
    if (actor === "scout") return "text-[#CCFF00]";
    if (actor === "analyst") return "text-[#8FB3A8]";
    return "text-[#6E7C82]";
  };

  const getLineClass = (cls: string) => {
    if (cls === "ok") return "text-[#CFC7B6]";
    if (cls === "hit") return "text-[#E9E3D5] font-semibold";
    if (cls === "kill" || cls === "err") return "text-[#D64A3A]";
    return "text-[#A79F90]";
  };

  return (
    <section className="py-8 font-mono">
      <div className="flex flex-wrap items-baseline justify-between gap-4 pb-3 border-b border-[rgba(233,227,213,0.18)] mb-4">
        <h2 className="font-bold text-sm tracking-[0.24em] uppercase text-[#E9E3D5]">stdout</h2>
        <span className="text-xs text-[#9A9385]">
          raw output from the desk — unedited, including the quiet stretches
        </span>
      </div>

      <div className="bg-[#0B0907] border border-[rgba(233,227,213,0.18)] relative overflow-hidden shadow-2xl">
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[rgba(233,227,213,0.1)] text-[10px] tracking-[0.14em] uppercase text-[#9A9385] flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                state === "idle"
                  ? "bg-[#6E7C82]"
                  : "bg-[#CCFF00] shadow-[0_0_8px_#CCFF00] animate-pulse"
              }`}
            />
            <span className="text-[#E9E3D5] font-semibold">{state}</span>
            <span>·</span>
            <span>scout@nexus</span>
          </div>
          <div className="text-[#6E7C82] tracking-wider">
            cycle {cycleNum} · updated {lastPolledAgo}s ago
          </div>
        </div>

        {/* Terminal Scroll Body */}
        <div
          ref={scrollRef}
          className="h-[330px] overflow-y-auto p-3.5 text-xs leading-[1.85] relative select-text"
        >
          <div className="flex flex-col justify-end min-h-full space-y-1">
            {lines.length === 0 ? (
              <div className="text-[#6E7C82] text-[12px]">
                {connected
                  ? "no signal yet — waiting for the next Scout cycle"
                  : "database not connected — showing no fallback data"}
              </div>
            ) : (
              lines.map((l) => (
                <div key={l.id} className="flex items-start gap-3 whitespace-pre-wrap break-words font-mono text-[12px]">
                  <span className="text-[#4E4A42] shrink-0">{l.time}</span>
                  <span className={`shrink-0 w-[66px] uppercase font-semibold ${getActorColor(l.actor)}`}>
                    {l.actor}
                  </span>
                  <span className={`flex-1 ${getLineClass(l.cls)}`}>
                    {l.glyph ? `${l.glyph} ` : ""}
                    {l.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Terminal Footer */}
        <div className="border-t border-[rgba(233,227,213,0.1)] px-3.5 py-2 flex flex-wrap justify-between items-center text-[10px] tracking-wider text-[#6E7C82] gap-2">
          <div>
            next cycle in <b className="text-[#CCFF00] font-semibold">{countdown}</b>
          </div>
          <div>
            spend this window <b className="text-[#E9E3D5] font-semibold">${spend.toFixed(4)}</b> / ${BUDGET_LIMIT.toFixed(2)}
          </div>
        </div>
      </div>
    </section>
  );
}
