"use client";

import React, { useState, useEffect } from "react";
import { Terminal, Search, Filter } from "lucide-react";

interface LogEntry {
  id: string;
  leadId?: string;
  time: string;
  tag: "scanned" | "crossed" | "filed" | "killed" | "refused" | "kept" | "thought";
  operator: "scout" | "analyst" | "system";
  summary: string;
  detail?: string;
}

interface RawStdoutRow {
  id: string;
  time: string;
  actor: "scout" | "analyst" | "system";
  message: string;
  tag: LogEntry["tag"] | null;
  leadId: string | null;
}

function mapStdoutRow(row: RawStdoutRow): LogEntry {
  return {
    id: row.id,
    leadId: row.leadId || undefined,
    time: `${row.time} UTC`,
    tag: row.tag || "kept",
    operator: row.actor,
    summary: row.message,
  };
}

const mockLogs: LogEntry[] = [
  {
    id: "log-1",
    time: "02:47:05 UTC",
    tag: "scanned",
    operator: "scout",
    summary: "Scanned Reuters, CNBC, CoinDesk RSS feeds for short-dated dollar liquidity prints.",
  },
  {
    id: "log-2",
    leadId: "#104",
    time: "02:47:18 UTC",
    tag: "crossed",
    operator: "scout",
    summary: "Cross-referenced front-end SOFR futures drift against aggregate stablecoin mint/burn data.",
    detail: "Link significance rated 0.81. Routing lead #104 to Analyst.",
  },
  {
    id: "log-3",
    leadId: "#104",
    time: "02:47:25 UTC",
    tag: "thought",
    operator: "analyst",
    summary: "Received lead #104. Sourcing verified across 3 independent feeds (Reuters, CNBC, The Block).",
  },
  {
    id: "log-4",
    leadId: "#104",
    time: "02:47:40 UTC",
    tag: "filed",
    operator: "analyst",
    summary: "Filed Bulletin #104: 'Dollar funding tightens as stablecoin supply slips in the same window'.",
  },
  {
    id: "log-5",
    leadId: "#102",
    time: "02:31:00 UTC",
    tag: "killed",
    operator: "scout",
    summary: "KILLED Lead #102: Single-exchange token price surge.",
    detail: "Reason: Single venue data with zero corroborating secondary sources. Dropped rather than dressed up.",
  },
  {
    id: "log-6",
    leadId: "#103",
    time: "01:58:12 UTC",
    tag: "filed",
    operator: "analyst",
    summary: "Filed Urgent #103: 'Energy print lands soft; read-through to risk appetite muted'.",
  },
  {
    id: "log-7",
    leadId: "#101",
    time: "01:22:22 UTC",
    tag: "refused",
    operator: "analyst",
    summary: "REFUSED Lead #101: Overnight directional trade recommendation.",
    detail: "Reason: Tipped from objective observation into trade advice. Outside desk remit — observation only, not advice.",
  },
  {
    id: "log-8",
    leadId: "#098",
    time: "00:49:15 UTC",
    tag: "kept",
    operator: "scout",
    summary: "Logged macro calendar event: US CPI print scheduled 13:30 UTC tomorrow. Monitoring overnight range.",
  },
];

export default function LogStreamSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs);

  useEffect(() => {
    let cancelled = false;

    async function loadLogs() {
      try {
        const res = await fetch("/api/stdout");
        const json = await res.json();
        if (!cancelled && Array.isArray(json.data) && json.data.length > 0) {
          const mapped = (json.data as RawStdoutRow[]).map(mapStdoutRow).reverse();
          setLogs(mapped);
        }
      } catch (error) {
        console.error("[LogStreamSection] failed to load logs", error);
      }
    }

    loadLogs();
    const interval = setInterval(loadLogs, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesTag = selectedTag === "all" || log.tag === selectedTag;
    const matchesSearch =
      log.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.detail && log.detail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.leadId && log.leadId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTag && matchesSearch;
  });

  const getTagColor = (tag: string) => {
    switch (tag) {
      case "filed":
        return "bg-emerald-950/60 text-emerald-400 border-emerald-700/50";
      case "crossed":
        return "bg-amber-950/60 text-[#CCFF00] border-amber-700/50";
      case "killed":
      case "refused":
        return "bg-rose-950/60 text-rose-400 border-rose-700/50";
      case "scanned":
        return "bg-sky-950/60 text-sky-400 border-sky-700/50";
      case "thought":
        return "bg-purple-950/60 text-purple-400 border-purple-700/50";
      case "kept":
        return "bg-slate-900 text-slate-300 border-slate-700/50";
      default:
        return "bg-zinc-900 text-zinc-400 border-zinc-700/50";
    }
  };

  return (
    <section id="log-section" className="py-8 bg-[#17140E] border border-[rgba(233,227,213,0.18)] p-5 sm:p-6 shadow-2xl my-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[rgba(233,227,213,0.1)] font-mono">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-5 h-5 text-[#CCFF00]" />
          <div>
            <h2 className="font-bold text-sm tracking-[0.2em] uppercase text-[#E9E3D5]">
              Autonomous Stream (/log)
            </h2>
            <p className="text-xs text-[#9A9385]">
              Real-time thought stream & decisions of Scout & Analyst
            </p>
          </div>
        </div>

        {/* Search & Comprehensive Tag Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#6E7C82]" />
            <input
              type="text"
              placeholder="Search logs or #lead..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#100E0A] border border-[rgba(233,227,213,0.18)] rounded pl-8 pr-3 py-1 text-xs text-[#E9E3D5] placeholder-[#6E7C82] focus:outline-none focus:border-[#CCFF00]"
            />
          </div>

          <div className="flex items-center gap-1 text-[10px] flex-wrap">
            <Filter className="w-3 h-3 text-[#9A9385] mr-1 hidden sm:inline" />
            {["all", "crossed", "filed", "killed", "refused", "scanned", "thought", "kept"].map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2 py-0.5 uppercase border transition-all ${
                  selectedTag === tag
                    ? "border-[#CCFF00] text-[#CCFF00] bg-[rgba(204,255,0,0.1)] font-bold"
                    : "border-[rgba(233,227,213,0.1)] text-[#6E7C82] hover:text-[#E9E3D5]"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Log Feed List */}
      <div className="mt-4 font-mono text-xs divide-y divide-[rgba(233,227,213,0.08)] max-h-[460px] overflow-y-auto pr-1">
        {filteredLogs.length === 0 ? (
          <div className="py-8 text-center text-[#6E7C82] italic">No matching logs found.</div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="py-3 flex flex-col sm:flex-row gap-2 sm:gap-4 items-start hover:bg-[#100E0A]/40 px-2 rounded transition-colors">
              <div className="flex items-center gap-2 shrink-0 text-[10px] text-[#6E7C82]">
                <time>{log.time}</time>
                <span className="uppercase text-[#9A9385] font-semibold">[{log.operator}]</span>
                {log.leadId && (
                  <span className="text-[#CCFF00] font-semibold bg-[#CCFF00]/10 px-1 rounded text-[9.5px]">
                    {log.leadId}
                  </span>
                )}
              </div>

              <div className="space-y-1 flex-1">
                <div className="flex items-start gap-2 flex-wrap">
                  <span className={`px-1.5 py-0.5 text-[9.5px] uppercase font-bold border rounded-sm ${getTagColor(log.tag)}`}>
                    {log.tag}
                  </span>
                  <span className="text-[#E9E3D5] leading-relaxed">{log.summary}</span>
                </div>
                {log.detail && (
                  <p className="text-[11px] text-[#9A9385] italic pl-2 border-l border-[rgba(233,227,213,0.18)]">
                    {log.detail}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
