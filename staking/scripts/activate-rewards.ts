import { network } from "hardhat";
import { parseEther } from "viem";

const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS as `0x${string}`;
const STAKING_ADDRESS = process.env.STAKING_ADDRESS as `0x${string}`;
const REWARD_AMOUNT = process.env.REWARD_AMOUNT || "100000"; // tNEXUS

async function main() {
  if (!TOKEN_ADDRESS || !STAKING_ADDRESS) {
    throw new Error("Set TOKEN_ADDRESS and STAKING_ADDRESS env vars.");
  }

  const { viem } = await network.create();
  const publicClient = await viem.getPublicClient();
  const token = await viem.getContractAt("MockERC20", TOKEN_ADDRESS);
  const staking = await viem.getContractAt("SimpleStaking", STAKING_ADDRESS);

  const amount = parseEther(REWARD_AMOUNT);
  console.log(`Transferring ${REWARD_AMOUNT} tokens to staking contract...`);
  const transferHash = await token.write.transfer([STAKING_ADDRESS, amount]);
  await publicClient.waitForTransactionReceipt({ hash: transferHash });

  console.log("Activating reward distribution...");
  const notifyHash = await staking.write.notifyRewardAmount([amount]);
  await publicClient.waitForTransactionReceipt({ hash: notifyHash });

  const rate = (await staking.read.rewardRate()) as bigint;
  const finish = (await staking.read.periodFinish()) as bigint;
  console.log("\nReward pool activated:");
  console.log("  rewardRate  :", rate.toString(), "wei/sec");
  console.log("  periodFinish:", new Date(Number(finish) * 1000).toISOString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
