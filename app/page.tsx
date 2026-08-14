"use client";

import React, { useState } from "react";
import Masthead from "@/components/Masthead";
import HeroFiling from "@/components/HeroFiling";
import WireFeed from "@/components/WireFeed";
import LogStreamSection from "@/components/LogStreamSection";
import OperatorsSection from "@/components/OperatorsSection";
import PrinciplesFooter from "@/components/PrinciplesFooter";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"wire" | "log">("wire");

  return (
    <div className="min-h-screen flex flex-col bg-[#100E0A] text-[#E9E3D5]">
      {/* Sticky Masthead and Vitals Bar */}
      <Masthead activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Wrapper */}
      <main className="max-w-[920px] w-full mx-auto px-6 py-6 flex-1">
        {activeTab === "wire" ? (
          <>
            <HeroFiling />
            <WireFeed />
            <LogStreamSection />
            <OperatorsSection />
          </>
        ) : (
          <>
            <LogStreamSection />
            <WireFeed />
            <OperatorsSection />
          </>
        )}

        <PrinciplesFooter />
      </main>
    </div>
  );
}
