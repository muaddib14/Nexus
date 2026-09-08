import { network } from "hardhat";

// The real NEXUS token only exists on Robinhood Chain MAINNET (verified 2026-09-08,
// contract 0x99bfe86FfA7880978AB290f9A02907c4A8c75112). It does not exist on any
// testnet, so testnet runs deploy a fresh MockERC20 automatically instead of
// requiring STAKING_TOKEN_ADDRESS to be set.
const STAKING_TOKEN_ADDRESS = process.env.STAKING_TOKEN_ADDRESS || "";
const REWARD_TOKEN_ADDRESS = process.env.REWARD_TOKEN_ADDRESS || STAKING_TOKEN_ADDRESS;
const OWNER_ADDRESS = process.env.OWNER_ADDRESS || "";
const IS_MAINNET = process.env.HARDHAT_NETWORK === "robinhoodMainnet";

async function main() {
  if (!OWNER_ADDRESS) {
    throw new Error("Set OWNER_ADDRESS env var before deploying.");
  }
  if (IS_MAINNET && !STAKING_TOKEN_ADDRESS) {
    throw new Error("Mainnet deploy requires STAKING_TOKEN_ADDRESS — refusing to deploy a mock token to mainnet.");
  }

  const { viem } = await network.create();

  let stakingTokenAddress = STAKING_TOKEN_ADDRESS;
  let rewardTokenAddress = REWARD_TOKEN_ADDRESS;

  if (!stakingTokenAddress) {
    console.log("No STAKING_TOKEN_ADDRESS set — deploying a test MockERC20 for this testnet run only.");
    const mockToken = await viem.deployContract("MockERC20", ["Test NEXUS", "tNEXUS"]);
    stakingTokenAddress = mockToken.address;
    rewardTokenAddress = rewardTokenAddress || mockToken.address;

    // Mint the deployer a supply of test tokens to stake/fund rewards with
    await mockToken.write.mint([OWNER_ADDRESS, 1_000_000_000000000000000000n]);
    console.log("MockERC20 (tNEXUS) deployed at:", mockToken.address);
    console.log("Minted 1,000,000 tNEXUS to owner for testing.");
  }

  console.log("\nDeploying SimpleStaking with:");
  console.log("  stakingToken:", stakingTokenAddress);
  console.log("  rewardToken :", rewardTokenAddress);
  console.log("  owner       :", OWNER_ADDRESS);
  console.log("  network     :", process.env.HARDHAT_NETWORK);

  const staking = await viem.deployContract("SimpleStaking", [
    stakingTokenAddress,
    rewardTokenAddress,
    OWNER_ADDRESS,
  ]);

  console.log("\nSimpleStaking deployed at:", staking.address);
  console.log("\nNext steps:");
  console.log("  1. Transfer reward tokens to the staking contract address above.");
  console.log("  2. Call notifyRewardAmount(amount) from the owner to activate distribution.");
  console.log("  3. Verify the contract on the block explorer.");
  console.log("  4. Set NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS and NEXT_PUBLIC_PROJECT_TOKEN_ADDRESS in the nexus web app's .env.local.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
