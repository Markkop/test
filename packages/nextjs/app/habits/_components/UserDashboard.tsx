"use client";

import { useAccount } from "@starknet-react/core";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-stark";
import { useState } from "react";
import { StarkInput } from "~~/components/scaffold-stark";
import { Address } from "~~/components/scaffold-stark";

export const UserDashboard = () => {
  const { address: connectedAddress } = useAccount();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showWithdraw, setShowWithdraw] = useState(false);

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

  // Claim staking rewards
  const { sendAsync: claimStakingRewards } = useScaffoldWriteContract({
    contractName: "HabitsFarm",
    functionName: "claim_staking_rewards",
    args: [],
  });

  // Withdraw deposit
  const { sendAsync: withdrawDeposit } = useScaffoldWriteContract({
    contractName: "HabitsFarm",
    functionName: "withdraw_deposit",
    args: [withdrawAmount ? BigInt(withdrawAmount) : 0n],
  });

  const handleClaimRewards = async () => {
    try {
      await claimStakingRewards();
      refetchUserInfo();
    } catch (error) {
      console.error("Failed to claim rewards:", error);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert("Please enter a valid amount to withdraw");
      return;
    }

    try {
      await withdrawDeposit();
      refetchUserInfo();
      setWithdrawAmount("");
      setShowWithdraw(false);
    } catch (error) {
      console.error("Failed to withdraw:", error);
    }
  };

  if (!userInfo) {
    return (
      <div className="flex justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const totalDeposit = userInfo.total_deposit ? Number(userInfo.total_deposit) / 1e18 : 0;
  const availableBalance = userInfo.available_balance ? Number(userInfo.available_balance) / 1e18 : 0;
  const totalEarned = userInfo.total_earned ? Number(userInfo.total_earned) / 1e18 : 0;
  const pendingStakingRewards = stakingRewards ? Number(stakingRewards) / 1e18 : 0;
  const habitsCompleted = Number(userInfo.habits_completed || 0);
  const habitsCreated = Number(userInfo.habits_created || 0);
  const completionRate = habitsCreated > 0 ? (habitsCompleted / habitsCreated * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Welcome back! 👋</h2>
        <Address address={connectedAddress} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-figure text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-8 h-8 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
              />
            </svg>
          </div>
          <div className="stat-title">Total Deposit</div>
          <div className="stat-value text-primary">{totalDeposit.toFixed(2)}</div>
          <div className="stat-desc">STRK deposited</div>
        </div>

        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-figure text-secondary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-8 h-8 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div className="stat-title">Available Balance</div>
          <div className="stat-value text-secondary">{availableBalance.toFixed(2)}</div>
          <div className="stat-desc">STRK ready to use</div>
        </div>

        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-figure text-accent">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-8 h-8 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <div className="stat-title">Habits Completed</div>
          <div className="stat-value text-accent">{habitsCompleted}</div>
          <div className="stat-desc">{completionRate}% completion rate</div>
        </div>

        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-figure text-success">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-8 h-8 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
          </div>
          <div className="stat-title">Total Earned</div>
          <div className="stat-value text-success">{totalEarned.toFixed(2)}</div>
          <div className="stat-desc">STRK from rewards</div>
        </div>
      </div>

      {/* Staking Rewards Section */}
      <div className="card bg-gradient-to-r from-primary to-accent text-primary-content shadow-xl">
        <div className="card-body">
          <h3 className="card-title text-xl">🌟 Staking Rewards</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <p className="text-sm opacity-90">Pending Staking Rewards</p>
              <p className="text-3xl font-bold">{pendingStakingRewards.toFixed(6)} STRK</p>
              <p className="text-sm opacity-90">Earning 5% APR on your deposits</p>
            </div>
            <div className="flex justify-end">
              <button
                className="btn btn-outline btn-primary-content"
                onClick={handleClaimRewards}
                disabled={pendingStakingRewards <= 0}
              >
                💰 Claim Rewards
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Management */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">💼 Account Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-semibold">Quick Actions</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Habits:</span>
                    <span className="font-mono">{habitsCreated}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Success Rate:</span>
                    <span className="font-mono">{completionRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Available to Withdraw:</span>
                    <span className="font-mono text-success">{availableBalance.toFixed(2)} STRK</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-semibold">Withdraw Funds</h4>
                {!showWithdraw ? (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowWithdraw(true)}
                  >
                    Withdraw Deposit
                  </button>
                ) : (
                  <div className="space-y-2">
                    <StarkInput
                      value={withdrawAmount}
                      onChange={(value) => setWithdrawAmount(value)}
                      placeholder="Amount to withdraw"
                    />
                    <div className="flex space-x-2">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={handleWithdraw}
                        disabled={!withdrawAmount}
                      >
                        Withdraw
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setShowWithdraw(false);
                          setWithdrawAmount("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
