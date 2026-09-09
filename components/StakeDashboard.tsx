"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { formatEther, parseEther } from "viem";
import { SIMPLE_STAKING_ABI, ERC20_ABI } from "@/lib/web3/abi";
import {
  STAKING_CONTRACT_ADDRESS,
  PROJECT_TOKEN_ADDRESS,
  IS_STAKING_CONFIGURED,
  robinhoodTestnet,
} from "@/lib/web3/config";

// TESTNET ONLY while the real PROJECT_TOKEN deploy stays on mainnet-only.
// Swap to robinhoodMainnet once staking is validated and approved for production.
const TARGET_CHAIN = robinhoodTestnet;

function formatToken(value: bigint | undefined, decimals = 2): string {
  if (value === undefined) return "0";
  return Number(formatEther(value)).toLocaleString("en-US", { maximumFractionDigits: decimals });
}

export default function StakeDashboard() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [amount, setAmount] = useState("");

  const isWrongChain = isConnected && chainId !== TARGET_CHAIN.id;

  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    reset: resetWrite,
    error: writeError,
  } = useWriteContract();
  const {
    isLoading: isTxConfirming,
    isSuccess: isTxConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  const contractCall = { address: STAKING_CONTRACT_ADDRESS, abi: SIMPLE_STAKING_ABI } as const;
  const tokenCall = { address: PROJECT_TOKEN_ADDRESS, abi: ERC20_ABI } as const;

  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    ...tokenCall,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && IS_STAKING_CONFIGURED },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    ...tokenCall,
    functionName: "allowance",
    args: address ? [address, STAKING_CONTRACT_ADDRESS] : undefined,
    query: { enabled: !!address && IS_STAKING_CONFIGURED },
  });

  const { data: stakedBalance, refetch: refetchStaked } = useReadContract({
    ...contractCall,
    functionName: "balances",
    args: address ? [address] : undefined,
    query: { enabled: !!address && IS_STAKING_CONFIGURED },
  });

  const { data: earned, refetch: refetchEarned } = useReadContract({
    ...contractCall,
    functionName: "earned",
    args: address ? [address] : undefined,
    query: { enabled: !!address && IS_STAKING_CONFIGURED, refetchInterval: 15_000 },
  });

  const { data: totalStaked } = useReadContract({
    ...contractCall,
    functionName: "totalStaked",
    query: { enabled: IS_STAKING_CONFIGURED },
  });

  const { data: tokenSymbol } = useReadContract({
    ...tokenCall,
    functionName: "symbol",
    query: { enabled: IS_STAKING_CONFIGURED },
  });

  const { data: periodFinish } = useReadContract({
    ...contractCall,
    functionName: "periodFinish",
    query: { enabled: IS_STAKING_CONFIGURED },
  });

  // Refresh reads once a transaction confirms. The proof link (txHash) is
  // deliberately kept visible — only a new action (see handlers below) clears it.
  useEffect(() => {
    if (isTxConfirmed) {
      refetchBalance();
      refetchAllowance();
      refetchStaked();
      refetchEarned();
      setAmount("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTxConfirmed]);

  const amountWei = useMemo(() => {
    try {
      return amount ? parseEther(amount) : BigInt(0);
    } catch {
      return BigInt(0);
    }
  }, [amount]);

  const needsApproval = allowance !== undefined && amountWei > BigInt(0) && (allowance as bigint) < amountWei;

  const handleApprove = () => {
    resetWrite();
    writeContract({ ...tokenCall, functionName: "approve", args: [STAKING_CONTRACT_ADDRESS, amountWei] });
  };
  const handleStake = () => {
    resetWrite();
    writeContract({ ...contractCall, functionName: "stake", args: [amountWei] });
  };
  const handleWithdraw = () => {
    resetWrite();
    writeContract({ ...contractCall, functionName: "withdraw", args: [amountWei] });
  };
  const handleClaim = () => {
    resetWrite();
    writeContract({ ...contractCall, functionName: "claimReward" });
  };

  const isBusy = isWritePending || isTxConfirming;
  const symbol = (tokenSymbol as string) || "TOKEN";

  if (!IS_STAKING_CONFIGURED) {
    return (
      <div className="bg-[#17140E] border border-[rgba(233,227,213,0.1)] p-8 text-center font-mono">
        <p className="text-sm text-[#9A9385]">
          Staking contract not deployed yet — this page will go live once the contract address is configured.
        </p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-[#17140E] border border-[rgba(233,227,213,0.1)] p-10 text-center font-mono">
        <p className="text-sm text-[#9A9385] mb-6">
          Connect your wallet to stake ${symbol} and view your position.
        </p>
        <div className="flex flex-col items-center gap-3 max-w-[280px] mx-auto">
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => connect({ connector })}
              disabled={isConnecting}
              className="w-full px-6 py-2.5 bg-[#CCFF00] text-[#100E0A] text-xs font-bold uppercase tracking-wider hover:bg-[#D9FF33] transition-colors disabled:opacity-50"
            >
              {isConnecting ? "Connecting…" : `Connect ${connector.name}`}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (isWrongChain) {
    return (
      <div className="bg-[#17140E] border border-[rgba(233,227,213,0.1)] p-10 text-center font-mono">
        <p className="text-sm text-[#9A9385] mb-6">
          Wrong network — switch to <b className="text-[#E9E3D5]">{TARGET_CHAIN.name}</b> to continue.
        </p>
        <button
          onClick={() => switchChain({ chainId: TARGET_CHAIN.id })}
          disabled={isSwitching}
          className="px-6 py-2.5 bg-[#CCFF00] text-[#100E0A] text-xs font-bold uppercase tracking-wider hover:bg-[#D9FF33] transition-colors disabled:opacity-50"
        >
          {isSwitching ? "Switching…" : `Switch to ${TARGET_CHAIN.name}`}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#17140E] border border-[rgba(233,227,213,0.1)] font-mono">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(233,227,213,0.1)]">
        <span className="text-[10px] text-[#6E7C82] tracking-wider">
          {address?.slice(0, 6)}…{address?.slice(-4)}
        </span>
        <button onClick={() => disconnect()} className="text-[10px] text-[#6E7C82] hover:text-[#D64A3A] uppercase tracking-wider transition-colors">
          Disconnect
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[rgba(233,227,213,0.1)] border-b border-[rgba(233,227,213,0.1)]">
        <div className="p-5">
          <div className="text-[9px] uppercase tracking-wider text-[#9A9385] mb-1">Your Balance</div>
          <div className="text-lg text-[#E9E3D5] font-semibold">{formatToken(tokenBalance as bigint)}</div>
        </div>
        <div className="p-5">
          <div className="text-[9px] uppercase tracking-wider text-[#9A9385] mb-1">Staked</div>
          <div className="text-lg text-[#E9E3D5] font-semibold">{formatToken(stakedBalance as bigint)}</div>
        </div>
        <div className="p-5">
          <div className="text-[9px] uppercase tracking-wider text-[#9A9385] mb-1">Pending Rewards</div>
          <div className="text-lg text-[#CCFF00] font-semibold">{formatToken(earned as bigint, 4)}</div>
        </div>
        <div className="p-5">
          <div className="text-[9px] uppercase tracking-wider text-[#9A9385] mb-1">Total Staked (all users)</div>
          <div className="text-lg text-[#E9E3D5] font-semibold">{formatToken(totalStaked as bigint, 0)}</div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-[#9A9385] block mb-1.5">Amount</label>
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`0.00 $${symbol}`}
            className="w-full bg-[#100E0A] border border-[rgba(233,227,213,0.18)] px-3 py-2.5 text-sm text-[#E9E3D5] placeholder-[#6E7C82] focus:outline-none focus:border-[#CCFF00]"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          {needsApproval ? (
            <button
              onClick={handleApprove}
              disabled={isBusy || amountWei === BigInt(0)}
              className="flex-1 min-w-[140px] px-4 py-2.5 bg-[#CCFF00] text-[#100E0A] text-xs font-bold uppercase tracking-wider hover:bg-[#D9FF33] transition-colors disabled:opacity-50"
            >
              {isBusy ? "Approving…" : `Approve $${symbol}`}
            </button>
          ) : (
            <button
              onClick={handleStake}
              disabled={isBusy || amountWei === BigInt(0)}
              className="flex-1 min-w-[140px] px-4 py-2.5 bg-[#CCFF00] text-[#100E0A] text-xs font-bold uppercase tracking-wider hover:bg-[#D9FF33] transition-colors disabled:opacity-50"
            >
              {isBusy ? "Staking…" : "Stake"}
            </button>
          )}

          <button
            onClick={handleClaim}
            disabled={isBusy || !earned || (earned as bigint) === BigInt(0)}
            className="px-4 py-2.5 border border-[#CCFF00] text-[#CCFF00] text-xs font-bold uppercase tracking-wider hover:bg-[rgba(204,255,0,0.08)] transition-colors disabled:opacity-40"
          >
            {isBusy ? "…" : "Claim Rewards"}
          </button>

          <button
            onClick={handleWithdraw}
            disabled={isBusy || amountWei === BigInt(0)}
            className="px-4 py-2.5 border border-[rgba(233,227,213,0.3)] text-[#E9E3D5] text-xs font-bold uppercase tracking-wider hover:border-[#E9E3D5] transition-colors disabled:opacity-40"
          >
            {isBusy ? "…" : "Withdraw"}
          </button>
        </div>

        {txHash && (
          <div className="text-[10px] text-[#6E7C82] pt-2 flex items-center gap-2">
            <span>{isTxConfirming ? "Confirming…" : isTxConfirmed ? "Confirmed" : "Submitted"}</span>
            <a
              href={`${TARGET_CHAIN.blockExplorers.default.url}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#CCFF00] hover:underline"
            >
              View proof on explorer → {txHash.slice(0, 10)}…
            </a>
          </div>
        )}

        {(writeError || receiptError) && (
          <div className="text-[11px] text-[#D64A3A] pt-2 break-words whitespace-pre-wrap">
            {(() => {
              const err = writeError || receiptError;
              const shortMessage = (err as { shortMessage?: string })?.shortMessage;
              return shortMessage || err?.message.slice(0, 400) || "Transaction failed";
            })()}
          </div>
        )}
      </div>

      <div className="px-6 pb-4 pt-2 border-t border-dashed border-[rgba(233,227,213,0.14)] text-[10.5px] text-[#6E7C82] flex flex-wrap gap-x-6 gap-y-1">
        <span>
          Reward period ends:{" "}
          <b className="text-[#E9E3D5]">
            {periodFinish && (periodFinish as bigint) > BigInt(0)
              ? new Date(Number(periodFinish as bigint) * 1000).toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "not active"}
          </b>
        </span>
      </div>

      <div className="px-6 pb-6 text-[10.5px] text-[#6E7C82] leading-relaxed">
        Estimated monthly yield: 0.5%–1.0%. Rewards are variable and depend on the configured staking reward
        program. Past or target rewards do not guarantee future returns.
      </div>
    </div>
  );
}
