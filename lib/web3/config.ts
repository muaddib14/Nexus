import { createConfig, http } from "wagmi";
import { baseSepolia, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";

// Contract isn't deployed anywhere real yet — these are placeholders until a
// real PROJECT_TOKEN + SimpleStaking deployment address exist. Swap via env vars,
// no code changes needed. See ../../../nexus-staking/README.md for deploy status.
export const STAKING_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const PROJECT_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_PROJECT_TOKEN_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const IS_STAKING_CONFIGURED =
  STAKING_CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000" &&
  PROJECT_TOKEN_ADDRESS !== "0x0000000000000000000000000000000000000000";

// Robinhood Chain — Arbitrum Orbit L2. Verified live 2026-09-08: RPC responds,
// chain ID matches docs.robinhood.com/chain. The real NEXUS token
// (0x99bfe86FfA7880978AB290f9A02907c4A8c75112) lives on the mainnet variant.
export const robinhoodMainnet = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.mainnet.chain.robinhood.com"] } },
  blockExplorers: {
    default: { name: "Robinhood Chain Explorer", url: "https://explorer.chain.robinhood.com" },
  },
});

export const robinhoodTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.chain.robinhood.com"] } },
  blockExplorers: {
    default: { name: "Robinhood Chain Testnet Explorer", url: "https://explorer.testnet.chain.robinhood.com" },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [robinhoodMainnet, robinhoodTestnet, baseSepolia, sepolia],
  connectors: [injected()],
  transports: {
    [robinhoodMainnet.id]: http(),
    [robinhoodTestnet.id]: http(),
    [baseSepolia.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});
