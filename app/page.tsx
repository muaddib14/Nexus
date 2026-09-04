"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Masthead from "@/components/Masthead";
import HeroFiling from "@/components/HeroFiling";
import StdoutTerminal from "@/components/StdoutTerminal";
import WireFeed from "@/components/WireFeed";
import LogStreamSection from "@/components/LogStreamSection";
import OperatorsSection from "@/components/OperatorsSection";
import PrinciplesFooter from "@/components/PrinciplesFooter";

function HomeContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"wire" | "log">("wire");

  // Sync tab with URL query parameter (?tab=log or ?tab=wire)
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "log") {
      setActiveTab("log");
    } else if (tabParam === "wire") {
      setActiveTab("wire");
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col bg-[#100E0A] text-[#E9E3D5]">
      {/* Sticky Masthead and Vitals Bar */}
      <Masthead activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Wrapper */}
      <main className="max-w-[920px] w-full mx-auto px-6 py-6 flex-1">
        {activeTab === "wire" ? (
          <>
            <HeroFiling />
            <StdoutTerminal />
            <WireFeed />
            <LogStreamSection />
            <OperatorsSection />
          </>
        ) : (
          <>
            <LogStreamSection />
            <StdoutTerminal />
            <WireFeed />
            <OperatorsSection />
          </>
        )}

        <PrinciplesFooter />
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#100E0A]" />}>
      <HomeContent />
    </Suspense>
  );
}
