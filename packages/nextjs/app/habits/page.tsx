"use client";

import { useState } from "react";
import { useAccount } from "@starknet-react/core";
import { NextPage } from "next";
import { UserDashboard } from "./_components/UserDashboard";
import { RegistrationForm } from "./_components/RegistrationForm";
import { HabitCreation } from "./_components/HabitCreation";
import { HabitsList } from "./_components/HabitsList";
import { RewardsPanel } from "./_components/RewardsPanel";
import { WithdrawComponent } from "./_components/WithdrawComponent";
import { useScaffoldReadContract } from "~~/hooks/scaffold-stark";

const HabitsPage: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [activeTab, setActiveTab] = useState<"dashboard" | "create" | "habits" | "rewards" | "withdraw">("dashboard");

  // Check if user is registered
  const { data: userInfo } = useScaffoldReadContract({
    contractName: "HabitsFarm",
    functionName: "get_user_info",
    args: [connectedAddress],
  });

  const isRegistered = userInfo?.is_registered || false;

  if (!connectedAddress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">🌱 Habits Farm</h1>
          <p className="text-lg text-gray-600 mb-8">
            Stake STRK, build habits, earn rewards!
          </p>
          <div className="card bg-base-100 shadow-xl p-6">
            <p className="text-center">Please connect your wallet to get started</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">🌱 Welcome to Habits Farm!</h1>
          <p className="text-lg text-gray-600 mb-8">
            Stake STRK to join our habit-building community and start earning rewards for completing your goals!
          </p>
        </div>
        <div className="max-w-2xl mx-auto">
          <RegistrationForm />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">🌱 Habits Farm</h1>
        <p className="text-lg text-gray-600">
          Build habits, earn rewards, grow your wealth through consistency!
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center mb-8">
        <div className="tabs tabs-boxed">
          <button
            className={`tab ${activeTab === "dashboard" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            📊 Dashboard
          </button>
          <button
            className={`tab ${activeTab === "create" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("create")}
          >
            ➕ Create Habit
          </button>
          <button
            className={`tab ${activeTab === "habits" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("habits")}
          >
            📝 My Habits
          </button>
          <button
            className={`tab ${activeTab === "rewards" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("rewards")}
          >
            🎁 Rewards
          </button>
          <button
            className={`tab ${activeTab === "withdraw" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("withdraw")}
          >
            💰 Withdraw
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      <div className="max-w-6xl mx-auto">
        {activeTab === "dashboard" && <UserDashboard />}
        {activeTab === "create" && <HabitCreation />}
        {activeTab === "habits" && <HabitsList />}
        {activeTab === "rewards" && <RewardsPanel />}
        {activeTab === "withdraw" && <WithdrawComponent />}
      </div>
    </div>
  );
};

export default HabitsPage;
