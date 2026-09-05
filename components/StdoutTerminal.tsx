"use client";

import React, { useState, useEffect, useRef } from "react";

interface LogLine {
  id: string;
  time: string;
  actor: "scout" | "analyst" | "system";
  msg: string;
  cls: "ok" | "dim" | "hit" | "kill" | "err";
}

export default function StdoutTerminal() {
  const [lines, setLines] = useState<LogLine[]>([
    {
      id: "seed-1",
      time: "02:46:20",
      actor: "system",
      msg: "boot ok · sources 7 · budget $10.00/day",
      cls: "dim",
    },
    {
      id: "seed-2",
      time: "02:46:21",
      actor: "system",
      msg: "cycle 40 complete · 0 filed · 3 dropped",
      cls: "dim",
    },
  ]);

  const [state, setState] = useState<"scanning" | "filing" | "idle">("scanning");
  const [isIdle, setIsIdle] = useState<boolean>(false);
  const [spend, setSpend] = useState<number>(3.8712);
  const [countdown, setCountdown] = useState<string>("00:45");
  const [cycleNum, setCycleNum] = useState<number>(41);

  const scrollRef = useRef<HTMLDivElement>(null);
  const nextCycleTimeRef = useRef<number>(0);

  const pad = (n: number) => String(n).padStart(2, "0");
  const getUtcClock = () => {
    const d = new Date();
    return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
  };

  useEffect(() => {
    const cycleData: Array<{
      actor: "scout" | "analyst" | "system";
      msg: string;
      cls: "ok" | "dim" | "hit" | "kill" | "err";
      delay: number;
      cost?: number;
    }> = [
      { actor: "scout", msg: "▸ GET reuters.com/markets/rss          200  41 items", cls: "ok", delay: 700 },
      { actor: "scout", msg: "▸ GET cnbc.com/id/100003114/device/rss  200  28 items", cls: "ok", delay: 600 },
      { actor: "scout", msg: "▸ GET coindesk.com/arc/outboundfeeds    200  33 items", cls: "ok", delay: 650 },
      { actor: "scout", msg: "▸ GET theblock.co/rss.xml               429  rate limited", cls: "err", delay: 500 },
      { actor: "scout", msg: "  retry in 8s (1/3)", cls: "dim", delay: 900 },
      { actor: "scout", msg: "▸ GET theblock.co/rss.xml               200  19 items", cls: "ok", delay: 700 },
      { actor: "scout", msg: "· dedupe → 63 unique headlines", cls: "dim", delay: 800 },
      { actor: "scout", msg: "· clustering by theme… 11 clusters", cls: "dim", delay: 1100 },
      { actor: "scout", msg: "⟡ candidate  dollar funding ✕ stablecoin supply  sig 0.81", cls: "hit", delay: 900 },
      { actor: "scout", msg: "✕ dropped   single-venue rally ✕ nothing to cross   sig 0.34", cls: "kill", delay: 700 },
      { actor: "scout", msg: "✕ dropped   equity open ✕ no crypto thread          sig 0.29", cls: "kill", delay: 700 },
      { actor: "scout", msg: "→ route lead #104 → analyst", cls: "hit", delay: 900 },
      { actor: "system", msg: "tokens in 8,412 · out 190 · $0.019", cls: "dim", delay: 600, cost: 0.019 },
      { actor: "analyst", msg: "· received #104 · verifying sourcing", cls: "dim", delay: 1000 },
      { actor: "analyst", msg: "· 3/3 sources independent — ok to file", cls: "ok", delay: 900 },
      { actor: "analyst", msg: "✎ drafting… 118 words", cls: "dim", delay: 1400 },
      { actor: "analyst", msg: "✎ drafting… 297 words", cls: "dim", delay: 1300 },
      { actor: "analyst", msg: '✓ filed #104 "Dollar funding tightens as stablecoin…"', cls: "hit", delay: 800 },
      { actor: "system", msg: "tokens in 3,980 · out 612 · $0.031", cls: "dim", delay: 700, cost: 0.031 },
      { actor: "system", msg: "cycle 41 complete · 1 filed · 2 dropped", cls: "dim", delay: 900 },
    ];

    let stepIndex = 0;
    let timer: NodeJS.Timeout;

    const pushLine = (
      actor: "scout" | "analyst" | "system",
      msg: string,
      cls: "ok" | "dim" | "hit" | "kill" | "err"
    ) => {
      setLines((prev) => {
        const newLine: LogLine = {
          id: `line-${Date.now()}-${Math.random()}`,
          time: getUtcClock(),
          actor,
          msg,
          cls,
        };
        const updated = [...prev, newLine];
        return updated.length > 60 ? updated.slice(updated.length - 60) : updated;
      });
    };

    const runStep = () => {
      if (stepIndex >= cycleData.length) {
        // Enter honest idle state
        pushLine("system", "idle · sleeping until next cycle", "dim");
        setIsIdle(true);
        setState("idle");
        nextCycleTimeRef.current = Date.now() + 45000;

        timer = setTimeout(() => {
          setIsIdle(false);
          setState("scanning");
          setCycleNum((c) => c + 1);
          pushLine("system", "wake · cycle 42 start", "dim");
          stepIndex = 0;
          timer = setTimeout(runStep, 700);
        }, 45000);
        return;
      }

      const item = cycleData[stepIndex];
      if (item.actor === "analyst" && item.msg.includes("drafting")) {
        setState("filing");
      } else if (item.actor === "scout") {
        setState("scanning");
      }

      pushLine(item.actor, item.msg, item.cls);
      if (item.cost) {
        setSpend((s) => s + item.cost!);
      }

      stepIndex++;
      timer = setTimeout(runStep, item.delay);
    };

    timer = setTimeout(runStep, 1200);

    // Heartbeat timer for countdown during idle state
    const cdInterval = setInterval(() => {
      if (!nextCycleTimeRef.current) return;
      const left = Math.max(0, Math.floor((nextCycleTimeRef.current - Date.now()) / 1000));
      setCountdown(`${pad(Math.floor(left / 60))}:${pad(left % 60)}`);
    }, 500);

    return () => {
      clearTimeout(timer);
      clearInterval(cdInterval);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

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
                isIdle
                  ? "bg-[#6E7C82]"
                  : "bg-[#CCFF00] shadow-[0_0_8px_#CCFF00] animate-pulse"
              }`}
            />
            <span className="text-[#E9E3D5] font-semibold">{state}</span>
            <span>·</span>
            <span>scout@nexus</span>
          </div>
          <div className="text-[#6E7C82] tracking-wider">
            cycle {cycleNum} · pid 1 · uptime 03:14
          </div>
        </div>

        {/* Terminal Scroll Body */}
        <div
          ref={scrollRef}
          className="h-[330px] overflow-y-auto p-3.5 text-xs leading-[1.85] relative select-text"
        >
          <div className="flex flex-col justify-end min-h-full space-y-1">
            {lines.map((l) => (
              <div key={l.id} className="flex items-start gap-3 whitespace-pre-wrap break-words font-mono text-[12px]">
                <span className="text-[#4E4A42] shrink-0">{l.time}</span>
                <span className={`shrink-0 w-[66px] uppercase font-semibold ${getActorColor(l.actor)}`}>
                  {l.actor}
                </span>
                <span className={`flex-1 ${getLineClass(l.cls)}`}>
                  {l.msg}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Terminal Footer */}
        <div className="border-t border-[rgba(233,227,213,0.1)] px-3.5 py-2 flex flex-wrap justify-between items-center text-[10px] tracking-wider text-[#6E7C82] gap-2">
          <div>
            next cycle in <b className="text-[#CCFF00] font-semibold">{isIdle ? countdown : "--:--"}</b>
          </div>
          <div>
            spend <b className="text-[#E9E3D5] font-semibold">${spend.toFixed(2)}</b> / $10.00 · 47 headlines seen this cycle
          </div>
        </div>
      </div>
    </section>
  );
}
