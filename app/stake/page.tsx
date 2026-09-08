import React from "react";
import Masthead from "@/components/Masthead";
import PrinciplesFooter from "@/components/PrinciplesFooter";
import StakeDashboard from "@/components/StakeDashboard";
import Web3Provider from "@/lib/web3/Web3Provider";

export const metadata = {
  title: "Stake — NEXUS",
  description: "Stake PROJECT_TOKEN and earn rewards over time. Estimated monthly yield 0.5%–1.0%.",
};

export default function StakePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#100E0A] text-[#E9E3D5]">
      <Masthead activeSection="stake" />

      <main className="max-w-[780px] w-full mx-auto px-6 py-10 flex-1 font-mono">
        <div className="pb-8 border-b border-[rgba(233,227,213,0.18)] mb-8">
          <div className="flex items-center gap-2.5 text-xs uppercase tracking-[0.24em] font-mono mb-2">
            <span className="text-[#CCFF00]">Stake</span>
            <span className="text-[#D64A3A] border border-[#D64A3A] px-1.5 py-0.5 text-[9px] tracking-wider">
              Testnet — not real funds
            </span>
          </div>
          <h1 className="font-serif font-normal text-3xl sm:text-4xl text-[#E9E3D5] tracking-tight mb-3">
            Stake your token. Earn while you hold.
          </h1>
          <p className="text-sm text-[#9A9385] max-w-[60ch] leading-relaxed">
            A wallet connection is only needed on this page — the rest of NEXUS stays open to read without one.
          </p>
        </div>

        {/* Web3Provider is scoped to this page only, not the whole site */}
        <Web3Provider>
          <StakeDashboard />
        </Web3Provider>

        <PrinciplesFooter />
      </main>
    </div>
  );
}
