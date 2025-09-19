"use client";

import { useAccount } from "@starknet-react/core";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-stark";

export const RewardsPanel = () => {
  const { address: connectedAddress } = useAccount();

  // Get user information
  const { data: userInfo, refetch: refetchUserInfo } = useScaffoldReadContract({
    contractName: "HabitsFarm",
    functionName: "get_user_info",
    args: [connectedAddress],
  });

  // Get staking rewards
  const { data: stakingRewards } = useScaffoldReadContract({
    contractName: "HabitsFarm",
    functionName: "calculate_staking_rewards",
    args: [connectedAddress],
  });

  // Get user's habit IDs to calculate unclaimed rewards
  const { data: habitIds } = useScaffoldReadContract({
    contractName: "HabitsFarm",
    functionName: "get_user_habits",
    args: [connectedAddress],
  });

  // Claim staking rewards
  const { sendAsync: claimStakingRewards } = useScaffoldWriteContract({
    contractName: "HabitsFarm",
    functionName: "claim_staking_rewards",
    args: [],
  });

  const handleClaimStakingRewards = async () => {
    try {
      await claimStakingRewards();
      refetchUserInfo();
    } catch (error) {
      console.error("Failed to claim staking rewards:", error);
    }
  };

  if (!userInfo) {
    return (
      <div className="flex justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const totalEarned = userInfo.total_earned ? Number(userInfo.total_earned) / 1e18 : 0;
  const totalDeposit = userInfo.total_deposit ? Number(userInfo.total_deposit) / 1e18 : 0;
  const pendingStakingRewards = stakingRewards ? Number(stakingRewards) / 1e18 : 0;
  const habitsCompleted = Number(userInfo.habits_completed || 0);
  const habitsCreated = Number(userInfo.habits_created || 0);
  
  // Calculate estimated APR based on earnings
  const estimatedAPR = totalDeposit > 0 ? (totalEarned / totalDeposit) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">🎁 Rewards Center</h2>
        <p className="text-gray-600">Track your earnings and claim your rewards</p>
      </div>

      {/* Main Rewards Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Staking Rewards Card */}
        <div className="card bg-gradient-to-br from-primary to-primary-focus text-primary-content shadow-xl">
          <div className="card-body">
            <h3 className="card-title text-xl">💰 Staking Rewards</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm opacity-90">Available to Claim</p>
                <p className="text-3xl font-bold">{pendingStakingRewards.toFixed(6)} STRK</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="opacity-90">Current APR</p>
                  <p className="font-mono font-bold">5.00%</p>
                </div>
                <div>
                  <p className="opacity-90">Earning On</p>
                  <p className="font-mono font-bold">{totalDeposit.toFixed(2)} STRK</p>
                </div>
              </div>
              <button
                className="btn btn-outline btn-primary-content w-full"
                onClick={handleClaimStakingRewards}
                disabled={pendingStakingRewards <= 0}
              >
                {pendingStakingRewards <= 0 ? "No Rewards Yet" : "Claim Staking Rewards"}
              </button>
            </div>
          </div>
        </div>

        {/* Habit Rewards Summary */}
        <div className="card bg-gradient-to-br from-success to-success-focus text-success-content shadow-xl">
          <div className="card-body">
            <h3 className="card-title text-xl">🎯 Habit Rewards</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm opacity-90">Total Earned from Habits</p>
                <p className="text-3xl font-bold">{totalEarned.toFixed(2)} STRK</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="opacity-90">Completed</p>
                  <p className="font-mono font-bold">{habitsCompleted}</p>
                </div>
                <div>
                  <p className="opacity-90">Success Rate</p>
                  <p className="font-mono font-bold">
                    {habitsCreated > 0 ? ((habitsCompleted / habitsCreated) * 100).toFixed(1) : "0"}%
                  </p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm opacity-90">Average: 20% bonus per completed habit</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title text-xl mb-4">📊 Earnings Overview</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="stat">
              <div className="stat-figure text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <div className="stat-title">Total Deposited</div>
              <div className="stat-value text-primary">{totalDeposit.toFixed(2)}</div>
              <div className="stat-desc">STRK invested</div>
            </div>

            <div className="stat">
              <div className="stat-figure text-success">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="stat-title">Total Earned</div>
              <div className="stat-value text-success">{totalEarned.toFixed(2)}</div>
              <div className="stat-desc">STRK from all sources</div>
            </div>

            <div className="stat">
              <div className="stat-figure text-warning">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="stat-title">Effective ROI</div>
              <div className="stat-value text-warning">{estimatedAPR.toFixed(2)}%</div>
              <div className="stat-desc">Based on current earnings</div>
            </div>

            <div className="stat">
              <div className="stat-figure text-info">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="stat-title">Pending Rewards</div>
              <div className="stat-value text-info">{pendingStakingRewards.toFixed(4)}</div>
              <div className="stat-desc">STRK ready to claim</div>
            </div>
          </div>
        </div>
      </div>

      {/* How Rewards Work */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title text-xl mb-4">ℹ️ How Rewards Work</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-primary mb-2">🎯 Habit Rewards</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-success mr-2">✓</span>
                  <span>Complete habits within the deadline to earn 20% bonus</span>
                </li>
                <li className="flex items-start">
                  <span className="text-success mr-2">✓</span>
                  <span>Get your full stake back plus the bonus reward</span>
                </li>
                <li className="flex items-start">
                  <span className="text-error mr-2">✗</span>
                  <span>Miss the deadline and lose your staked amount</span>
                </li>
                <li className="flex items-start">
                  <span className="text-info mr-2">ℹ</span>
                  <span>Higher stakes = higher motivation and rewards!</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-primary mb-2">💰 Staking Rewards</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-success mr-2">✓</span>
                  <span>Earn 5% APR on all deposited funds automatically</span>
                </li>
                <li className="flex items-start">
                  <span className="text-success mr-2">✓</span>
                  <span>Rewards compound and can be claimed anytime</span>
                </li>
                <li className="flex items-start">
                  <span className="text-success mr-2">✓</span>
                  <span>No minimum time commitment or lock-up period</span>
                </li>
                <li className="flex items-start">
                  <span className="text-info mr-2">ℹ</span>
                  <span>Withdraw your deposits anytime with accumulated rewards</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Motivational Quote */}
      <div className="card bg-gradient-to-r from-accent/20 to-secondary/20 border border-accent/30">
        <div className="card-body text-center">
          <blockquote className="text-lg italic">
            "We are what we repeatedly do. Excellence, then, is not an act, but a habit."
          </blockquote>
          <cite className="text-sm text-gray-600 mt-2">- Aristotle</cite>
        </div>
      </div>
    </div>
  );
};
