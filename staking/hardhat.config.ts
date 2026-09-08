import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";

// Deploy target is intentionally EVM-generic (per the staking brief) so this
// same contract can go to Base Sepolia, Sepolia, or "Robinhood Chain" later —
// only the network RPC/chainId here needs to change, not the contract.
export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    baseSepolia: {
      type: "http",
      chainType: "l1",
      url: "https://sepolia.base.org",
      accounts: [configVariable("DEPLOYER_PRIVATE_KEY")],
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("DEPLOYER_PRIVATE_KEY")],
    },
    // Robinhood Chain — Arbitrum Orbit L2. Verified live 2026-09-08: RPC responds,
    // chain ID matches docs.robinhood.com/chain (4663 mainnet / 46630 testnet).
    robinhoodTestnet: {
      type: "http",
      chainType: "l1",
      url: "https://rpc.testnet.chain.robinhood.com",
      chainId: 46630,
      accounts: [configVariable("DEPLOYER_PRIVATE_KEY")],
    },
    robinhoodMainnet: {
      type: "http",
      chainType: "l1",
      url: "https://rpc.mainnet.chain.robinhood.com",
      chainId: 4663,
      accounts: [configVariable("DEPLOYER_PRIVATE_KEY")],
    },
  },
});
