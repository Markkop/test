"use client";

import { useState } from "react";
import { useAccount } from "@starknet-react/core";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-stark";

interface Habit {
  id: bigint;
  user: string;
  title: string;
  description: string;
  stake_amount: bigint;
  created_at: bigint;
  duration_days: number;
  is_completed: boolean;
  completed_at: bigint;
  reward_claimed: boolean;
}

const HabitCard = ({ habitId, onUpdate }: { habitId: bigint, onUpdate: () => void }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Get habit details
  const { data: habit } = useScaffoldReadContract({
    contractName: "HabitsFarm",
    functionName: "get_habit",
    args: [habitId],
  });

  const { sendAsync: completeHabit } = useScaffoldWriteContract({
    contractName: "HabitsFarm",
    functionName: "complete_habit",
    args: [habitId],
  });

  const { sendAsync: claimReward } = useScaffoldWriteContract({
    contractName: "HabitsFarm",
    functionName: "claim_habit_reward",
    args: [habitId],
  });

  if (!habit) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-center">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        </div>
      </div>
    );
  }

  const stakeAmount = Number(habit.stake_amount) / 1e18;
  const createdAt = Number(habit.created_at) * 1000; // Convert to milliseconds
  const completedAt = Number(habit.completed_at) * 1000;
  const durationDays = Number(habit.duration_days);
  const deadline = createdAt + (durationDays * 24 * 60 * 60 * 1000);
  const now = Date.now();
  const isExpired = now > deadline;
  const timeLeft = Math.max(0, deadline - now);
  const bonusReward = stakeAmount * 0.2;
  const totalReward = stakeAmount + bonusReward;

  const formatTimeLeft = (ms: number) => {
    if (ms <= 0) return "Expired";
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const getStatusBadge = () => {
    if (habit.is_completed && habit.reward_claimed) {
      return <div className="badge badge-success">✅ Completed & Rewarded</div>;
    } else if (habit.is_completed) {
      return <div className="badge badge-primary">✅ Completed - Claim Reward</div>;
    } else if (isExpired) {
      return <div className="badge badge-error">❌ Expired</div>;
    } else {
      return <div className="badge badge-warning">⏳ In Progress</div>;
    }
  };

  const handleCompleteHabit = async () => {
    try {
      setIsLoading(true);
      await completeHabit();
      onUpdate();
    } catch (error) {
      console.error("Failed to complete habit:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimReward = async () => {
    try {
      setIsLoading(true);
      await claimReward();
      onUpdate();
    } catch (error) {
      console.error("Failed to claim reward:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex justify-between items-start mb-4">
          <h3 className="card-title text-lg">{habit.title}</h3>
          {getStatusBadge()}
        </div>
        
        <p className="text-gray-600 mb-4">{habit.description}</p>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-500">Stake:</span>
            <p className="font-mono font-bold">{stakeAmount.toFixed(2)} STRK</p>
          </div>
          <div>
            <span className="font-medium text-gray-500">Potential Reward:</span>
            <p className="font-mono font-bold text-success">{totalReward.toFixed(2)} STRK</p>
          </div>
          <div>
            <span className="font-medium text-gray-500">Duration:</span>
            <p>{durationDays} day{durationDays !== 1 ? 's' : ''}</p>
          </div>
          <div>
            <span className="font-medium text-gray-500">Time Left:</span>
            <p className={isExpired ? "text-error font-bold" : "text-warning font-bold"}>
              {formatTimeLeft(timeLeft)}
            </p>
          </div>
        </div>

        {habit.is_completed && (
          <div className="mt-4 p-4 bg-success/10 rounded-lg">
            <div className="flex items-center space-x-2 text-success">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Completed on {new Date(completedAt).toLocaleDateString()}</span>
            </div>
          </div>
        )}

        <div className="card-actions justify-end mt-6">
          {!habit.is_completed && !isExpired && (
            <button
              className="btn btn-primary"
              onClick={handleCompleteHabit}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Completing...
                </>
              ) : (
                "🎉 Mark Complete"
              )}
            </button>
          )}
          
          {habit.is_completed && !habit.reward_claimed && (
            <button
              className="btn btn-success"
              onClick={handleClaimReward}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Claiming...
                </>
              ) : (
                `💰 Claim ${totalReward.toFixed(2)} STRK`
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const HabitsList = () => {
  const { address: connectedAddress } = useAccount();
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "expired">("all");

  // Get user's habit IDs
  const { data: habitIds, refetch } = useScaffoldReadContract({
    contractName: "HabitsFarm",
    functionName: "get_user_habits",
    args: [connectedAddress],
  });

  const handleUpdate = () => {
    refetch();
  };

  if (!habitIds || habitIds.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">🌱</div>
          <h3 className="text-2xl font-bold mb-2">No habits yet!</h3>
          <p className="text-gray-600 mb-6">
            Start your journey by creating your first habit. The earlier you start, the more you'll earn!
          </p>
          <div className="card bg-base-100 shadow-xl p-6">
            <h4 className="font-bold mb-2">Why create habits?</h4>
            <ul className="text-left space-y-1 text-sm">
              <li>✅ Get 20% bonus on completed habits</li>
              <li>💰 Earn 5% APR on all deposits</li>
              <li>🎯 Build accountability with real stakes</li>
              <li>📈 Track your progress and earnings</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">📝 My Habits ({habitIds.length})</h2>
        
        {/* Filter tabs */}
        <div className="tabs tabs-boxed">
          <button
            className={`tab tab-sm ${filter === "all" ? "tab-active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`tab tab-sm ${filter === "active" ? "tab-active" : ""}`}
            onClick={() => setFilter("active")}
          >
            Active
          </button>
          <button
            className={`tab tab-sm ${filter === "completed" ? "tab-active" : ""}`}
            onClick={() => setFilter("completed")}
          >
            Completed
          </button>
          <button
            className={`tab tab-sm ${filter === "expired" ? "tab-active" : ""}`}
            onClick={() => setFilter("expired")}
          >
            Expired
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habitIds.map((habitId: bigint) => (
          <HabitCard
            key={habitId.toString()}
            habitId={habitId}
            onUpdate={handleUpdate}
          />
        ))}
      </div>

      {habitIds.length > 0 && (
        <div className="text-center text-gray-500 text-sm">
          Showing {habitIds.length} habit{habitIds.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};
