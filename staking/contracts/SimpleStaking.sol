// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title SimpleStaking
/// @notice V1 staking utility for PROJECT_TOKEN. Flexible staking, no lock period,
/// rewards funded from a pre-funded pool and distributed proportionally over time
/// (the standard Synthetix "reward-per-token" accounting model).
/// @dev Deliberately simple: no LPs, no auto-compound, no oracle. See project brief
/// "PROJECT_TOKEN — Simple Staking V1" for the full spec this implements.
contract SimpleStaking is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardToken;

    uint256 public constant PRECISION = 1e18;

    uint256 public rewardRate; // reward tokens per second
    uint256 public rewardsDuration = 30 days;
    uint256 public periodFinish;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    uint256 public totalStaked;
    mapping(address => uint256) public balances;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardAdded(uint256 reward);
    event Recovered(address indexed token, uint256 amount);
    event RewardsDurationUpdated(uint256 newDuration);

    error ZeroAmount();
    error InsufficientBalance();
    error RewardPeriodStillActive();
    error ProvidedRewardTooHigh();
    error CannotRecoverStakingOrRewardToken();
    error NoRewardToClaim();

    constructor(address _stakingToken, address _rewardToken, address _owner) Ownable(_owner) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }
        uint256 elapsed = lastTimeRewardApplicable() - lastUpdateTime;
        uint256 increase = (elapsed * rewardRate * PRECISION) / totalStaked;
        return rewardPerTokenStored + increase;
    }

    function earned(address account) public view returns (uint256) {
        uint256 rewardDelta = rewardPerToken() - userRewardPerTokenPaid[account];
        return (balances[account] * rewardDelta) / PRECISION + rewards[account];
    }

    // ---------------------------------------------------------------------
    // Mutating — user actions
    // ---------------------------------------------------------------------

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();

        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    function stake(uint256 amount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        if (amount == 0) revert ZeroAmount();

        totalStaked += amount;
        balances[msg.sender] += amount;

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) public nonReentrant updateReward(msg.sender) {
        if (amount == 0) revert ZeroAmount();
        if (balances[msg.sender] < amount) revert InsufficientBalance();

        totalStaked -= amount;
        balances[msg.sender] -= amount;

        stakingToken.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function claimReward() public nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward == 0) revert NoRewardToClaim();

        rewards[msg.sender] = 0;
        rewardToken.safeTransfer(msg.sender, reward);

        emit RewardPaid(msg.sender, reward);
    }

    /// @notice Withdraw the entire staked balance and claim all pending rewards in one call.
    function exit() external {
        withdraw(balances[msg.sender]);
        claimReward();
    }

    // ---------------------------------------------------------------------
    // Admin — reward funding & emergency controls
    // ---------------------------------------------------------------------

    /// @notice Fund and (re)activate a reward distribution period.
    /// @dev Follows the standard leftover-reward pattern: if a period is still
    /// active, its unpaid remainder is rolled into the new period so the
    /// contract can never promise more than it can pay out.
    function notifyRewardAmount(uint256 reward) external onlyOwner updateReward(address(0)) {
        if (block.timestamp >= periodFinish) {
            rewardRate = reward / rewardsDuration;
        } else {
            uint256 remaining = periodFinish - block.timestamp;
            uint256 leftover = remaining * rewardRate;
            rewardRate = (reward + leftover) / rewardsDuration;
        }

        // The contract must hold enough reward tokens to fully fund the new rate.
        uint256 balance = rewardToken.balanceOf(address(this));
        if (rewardRate * rewardsDuration > balance) revert ProvidedRewardTooHigh();

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + rewardsDuration;

        emit RewardAdded(reward);
    }

    function setRewardsDuration(uint256 _rewardsDuration) external onlyOwner {
        if (block.timestamp <= periodFinish) revert RewardPeriodStillActive();
        rewardsDuration = _rewardsDuration;
        emit RewardsDurationUpdated(_rewardsDuration);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Recover ERC-20 tokens accidentally sent to this contract.
    /// @dev Can NEVER touch user-staked balances or the active reward pool —
    /// only the surplus above what the contract owes stakers/reward claims.
    function recoverERC20(address tokenAddress, uint256 amount) external onlyOwner {
        if (tokenAddress == address(stakingToken)) {
            uint256 surplus = stakingToken.balanceOf(address(this)) - totalStaked;
            if (amount > surplus) revert CannotRecoverStakingOrRewardToken();
        }
        if (tokenAddress == address(rewardToken) && tokenAddress != address(stakingToken)) {
            uint256 owed = rewardRate * (periodFinish > block.timestamp ? periodFinish - block.timestamp : 0);
            uint256 surplus = rewardToken.balanceOf(address(this)) - owed;
            if (amount > surplus) revert CannotRecoverStakingOrRewardToken();
        }

        IERC20(tokenAddress).safeTransfer(owner(), amount);
        emit Recovered(tokenAddress, amount);
    }
}
