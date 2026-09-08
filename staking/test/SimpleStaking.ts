import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { parseEther } from "viem";

describe("SimpleStaking", async function () {
  const connection = await network.create();
  const { viem, provider } = connection;
  const publicClient = await viem.getPublicClient();
  const [owner, alice, bob] = await viem.getWalletClients();

  async function deployStakingFixture() {
    const token = await viem.deployContract("MockERC20", ["PROJECT_TOKEN", "PROJ"]);
    const staking = await viem.deployContract("SimpleStaking", [
      token.address,
      token.address,
      owner.account.address,
    ]);

    // Fund Alice and Bob with staking tokens, and the reward pool
    await token.write.mint([alice.account.address, parseEther("100000")]);
    await token.write.mint([bob.account.address, parseEther("100000")]);
    await token.write.mint([owner.account.address, parseEther("1000000")]);

    return { token, staking };
  }

  async function increaseTime(seconds: number) {
    await provider.request({ method: "evm_increaseTime", params: [seconds] });
    await provider.request({ method: "evm_mine", params: [] });
  }

  it("allows a user to stake and increases totalStaked", async function () {
    const { token, staking } = await deployStakingFixture();

    const aliceToken = await viem.getContractAt("MockERC20", token.address, { client: { wallet: alice } });
    await aliceToken.write.approve([staking.address, parseEther("1000")]);

    const aliceStaking = await viem.getContractAt("SimpleStaking", staking.address, { client: { wallet: alice } });
    await aliceStaking.write.stake([parseEther("1000")]);

    assert.equal(await staking.read.totalStaked(), parseEther("1000"));
    assert.equal(await staking.read.balances([alice.account.address]), parseEther("1000"));
  });

  it("rejects staking a zero amount", async function () {
    const { staking } = await deployStakingFixture();
    const aliceStaking = await viem.getContractAt("SimpleStaking", staking.address, { client: { wallet: alice } });

    await assert.rejects(aliceStaking.write.stake([0n]));
  });

  it("distributes rewards proportionally between two stakers over time", async function () {
    const { token, staking } = await deployStakingFixture();

    // Fund the reward pool: 100,000 tokens over 30 days
    await token.write.transfer([staking.address, parseEther("100000")]);
    await staking.write.notifyRewardAmount([parseEther("100000")]);

    const aliceToken = await viem.getContractAt("MockERC20", token.address, { client: { wallet: alice } });
    const bobToken = await viem.getContractAt("MockERC20", token.address, { client: { wallet: bob } });
    await aliceToken.write.approve([staking.address, parseEther("100000")]);
    await bobToken.write.approve([staking.address, parseEther("100000")]);

    const aliceStaking = await viem.getContractAt("SimpleStaking", staking.address, { client: { wallet: alice } });
    const bobStaking = await viem.getContractAt("SimpleStaking", staking.address, { client: { wallet: bob } });

    // Alice and Bob both stake the same amount at the same time -> should earn equally
    await aliceStaking.write.stake([parseEther("100000")]);
    await bobStaking.write.stake([parseEther("100000")]);

    await increaseTime(15 * 24 * 60 * 60); // halfway through the 30-day period

    const aliceEarned = await staking.read.earned([alice.account.address]);
    const bobEarned = await staking.read.earned([bob.account.address]);

    // Equal stakes, equal duration -> rewards should match closely
    const diff = aliceEarned > bobEarned ? aliceEarned - bobEarned : bobEarned - aliceEarned;
    assert.ok(diff < parseEther("1"), "rewards should be nearly identical for equal stakes");
    assert.ok(aliceEarned > 0n, "alice should have accrued some reward");
  });

  it("lets a user claim rewards and exit fully", async function () {
    const { token, staking } = await deployStakingFixture();

    await token.write.transfer([staking.address, parseEther("100000")]);
    await staking.write.notifyRewardAmount([parseEther("100000")]);

    const aliceToken = await viem.getContractAt("MockERC20", token.address, { client: { wallet: alice } });
    await aliceToken.write.approve([staking.address, parseEther("1000")]);
    const aliceStaking = await viem.getContractAt("SimpleStaking", staking.address, { client: { wallet: alice } });

    await aliceStaking.write.stake([parseEther("1000")]);
    await increaseTime(7 * 24 * 60 * 60);

    const balanceBefore = await token.read.balanceOf([alice.account.address]);
    await aliceStaking.write.exit();
    const balanceAfter = await token.read.balanceOf([alice.account.address]);

    assert.equal(await staking.read.balances([alice.account.address]), 0n);
    assert.ok(balanceAfter > balanceBefore, "balance should increase after exit (stake + reward returned)");
  });

  it("prevents staking while paused, but still allows withdraw", async function () {
    const { token, staking } = await deployStakingFixture();

    const aliceToken = await viem.getContractAt("MockERC20", token.address, { client: { wallet: alice } });
    await aliceToken.write.approve([staking.address, parseEther("1000")]);
    const aliceStaking = await viem.getContractAt("SimpleStaking", staking.address, { client: { wallet: alice } });
    await aliceStaking.write.stake([parseEther("500")]);

    await staking.write.pause();

    await assert.rejects(aliceStaking.write.stake([parseEther("100")]));

    // withdraw should still work while paused (per brief §20)
    await aliceStaking.write.withdraw([parseEther("500")]);
    assert.equal(await staking.read.balances([alice.account.address]), 0n);
  });

  it("does not allow notifyRewardAmount to promise more than the funded balance", async function () {
    const { token, staking } = await deployStakingFixture();

    // Only approve/fund 10 tokens but try to notify a reward of 1,000,000
    await token.write.approve([staking.address, parseEther("10")]);
    await token.write.transfer([staking.address, parseEther("10")]);

    await assert.rejects(staking.write.notifyRewardAmount([parseEther("1000000")]));
  });

  it("blocks non-owner from calling admin functions", async function () {
    const { staking } = await deployStakingFixture();
    const aliceStaking = await viem.getContractAt("SimpleStaking", staking.address, { client: { wallet: alice } });

    await assert.rejects(aliceStaking.write.pause());
    await assert.rejects(aliceStaking.write.notifyRewardAmount([parseEther("1")]));
  });
});
