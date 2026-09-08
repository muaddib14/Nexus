# NEXUS Token Staking — SimpleStaking V1

Flexible staking utility for `PROJECT_TOKEN`, implementing the "PROJECT_TOKEN — Simple Staking V1" brief.
Follows the battle-tested Synthetix `StakingRewards` reward-per-token accounting pattern, built on
OpenZeppelin (`SafeERC20`, `Ownable`, `Pausable`, `ReentrancyGuard`).

This is a **separate project from the NEXUS website** (`../nexus`) — different stack (Solidity/EVM
vs Next.js), different risk profile (real user funds on-chain vs a content site). See the root
conversation notes for why they're kept apart.

## What's here

- `contracts/SimpleStaking.sol` — the staking contract
- `contracts/test/MockERC20.sol` — mintable test token standing in for `PROJECT_TOKEN` until it's deployed
- `test/SimpleStaking.ts` — unit tests (stake/withdraw/claim/exit, reward distribution, pause, admin access, reward-safety)
- `scripts/deploy.ts` — testnet/mainnet deploy script

## Status

- [x] Contract written, compiles clean
- [x] Unit tests passing (7/7): staking, zero-amount rejection, proportional rewards, exit, pause behavior, reward overfund protection, admin access control
- [ ] Deployed to any testnet (needs a real or mock `PROJECT_TOKEN` address first)
- [ ] Security review / audit
- [ ] Mainnet deployment

## Before deploying anywhere real

1. **Confirm `PROJECT_TOKEN`'s actual contract address.** If it doesn't exist yet, that's a separate
   prerequisite — this staking contract needs a real ERC-20 to point at.
2. **Confirm the target chain.** The contract is EVM-generic — it can go to Base Sepolia (free testnet),
   Base mainnet (cheap), or "Robinhood Chain" once its RPC/chainId are confirmed. Only `hardhat.config.ts`
   networks change, not the contract.
3. **Decide who owns the contract.** `onlyOwner` gates `pause`, `unpause`, `notifyRewardAmount`, and
   `recoverERC20`. Per the brief, this should be a multisig for anything beyond testnet.
4. **Get an independent review before mainnet.** This contract holds real user funds — do not skip
   this step because the code "looks fine."

## Commands

```bash
npm install
npm run compile
npm test

# Deploy (after setting env vars — see .env.example)
npm run deploy:testnet
```
