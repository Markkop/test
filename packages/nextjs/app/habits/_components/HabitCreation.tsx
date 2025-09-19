"use client";

import { useState } from "react";
import { useAccount } from "@starknet-react/core";
import { StarkInput } from "~~/components/scaffold-stark";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-stark";

export const HabitCreation = () => {
  const { address: connectedAddress } = useAccount();
  const [habitData, setHabitData] = useState({
    title: "",
    description: "",
    stakeAmount: "",
    durationDays: "7",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Get user information to check available balance
  const { data: userInfo } = useScaffoldReadContract({
    contractName: "HabitsFarm",
    functionName: "get_user_info",
    args: [connectedAddress],
  });

  const { sendAsync: createHabit } = useScaffoldWriteContract({
    contractName: "HabitsFarm",
    functionName: "create_habit",
    args: [
      habitData.title,
      habitData.description,
      habitData.stakeAmount ? BigInt(parseFloat(habitData.stakeAmount) * 1e18) : 0n,
      parseInt(habitData.durationDays) || 7,
    ],
  });

  const availableBalance = userInfo?.available_balance ? Number(userInfo.available_balance) / 1e18 : 0;

  const handleInputChange = (field: string, value: string) => {
    setHabitData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateHabit = async () => {
    // Validation
    if (!habitData.title.trim()) {
      alert("Please enter a habit title");
      return;
    }

    if (!habitData.description.trim()) {
      alert("Please enter a habit description");
      return;
    }

    if (!habitData.stakeAmount || parseFloat(habitData.stakeAmount) <= 0) {
      alert("Please enter a valid stake amount");
      return;
    }

    if (parseFloat(habitData.stakeAmount) > availableBalance) {
      alert("Insufficient balance. Please deposit more STRK or reduce the stake amount.");
      return;
    }

    if (!habitData.durationDays || parseInt(habitData.durationDays) <= 0) {
      alert("Please enter a valid duration in days");
      return;
    }

    try {
      setIsLoading(true);
      await createHabit();
      
      // Reset form
      setHabitData({
        title: "",
        description: "",
        stakeAmount: "",
        durationDays: "7",
      });
      
      alert("Habit created successfully! 🎉");
    } catch (error) {
      console.error("Failed to create habit:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const presetStakes = [1, 5, 10, 25];
  const presetDurations = [
    { days: 1, label: "1 day" },
    { days: 7, label: "1 week" },
    { days: 14, label: "2 weeks" },
    { days: 30, label: "1 month" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl text-center mb-6">
            ✨ Create New Habit
          </h2>

          <div className="space-y-6">
            {/* Balance Display */}
            <div className="alert alert-info">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <h4 className="font-medium">Available Balance:</h4>
                <p className="text-lg font-mono">{availableBalance.toFixed(2)} STRK</p>
              </div>
            </div>

            {/* Habit Title */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Habit Title *</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Exercise for 30 minutes daily"
                className="input input-bordered w-full"
                value={habitData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                maxLength={100}
              />
              <label className="label">
                <span className="label-text-alt text-gray-500">
                  {habitData.title.length}/100 characters
                </span>
              </label>
            </div>

            {/* Habit Description */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Description *</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                placeholder="Describe your habit in detail. What exactly will you do? When will you do it?"
                value={habitData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                maxLength={500}
              ></textarea>
              <label className="label">
                <span className="label-text-alt text-gray-500">
                  {habitData.description.length}/500 characters
                </span>
              </label>
            </div>

            {/* Stake Amount */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Stake Amount (STRK) *</span>
                <span className="label-text-alt">The higher the stakes, the stronger the motivation!</span>
              </label>
              <StarkInput
                value={habitData.stakeAmount}
                onChange={(value) => handleInputChange("stakeAmount", value)}
                placeholder="Enter amount to stake"
              />
              
              {/* Preset amounts */}
              <div className="mt-2">
                <span className="text-sm text-gray-500">Quick select:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {presetStakes.map((amount) => (
                    <button
                      key={amount}
                      className="btn btn-outline btn-xs"
                      onClick={() => handleInputChange("stakeAmount", amount.toString())}
                      disabled={amount > availableBalance}
                    >
                      {amount} STRK
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Duration (Days) *</span>
                <span className="label-text-alt">How many days to complete this habit?</span>
              </label>
              <input
                type="number"
                placeholder="7"
                className="input input-bordered w-full"
                value={habitData.durationDays}
                onChange={(e) => handleInputChange("durationDays", e.target.value)}
                min="1"
                max="365"
              />
              
              {/* Preset durations */}
              <div className="mt-2">
                <span className="text-sm text-gray-500">Quick select:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {presetDurations.map((duration) => (
                    <button
                      key={duration.days}
                      className="btn btn-outline btn-xs"
                      onClick={() => handleInputChange("durationDays", duration.days.toString())}
                    >
                      {duration.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reward Preview */}
            {habitData.stakeAmount && parseFloat(habitData.stakeAmount) > 0 && (
              <div className="card bg-success/10 border border-success/20">
                <div className="card-body p-4">
                  <h4 className="font-medium text-success">💰 Reward Preview</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Your Stake:</span>
                      <p className="font-mono font-bold">{parseFloat(habitData.stakeAmount).toFixed(2)} STRK</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Bonus (20%):</span>
                      <p className="font-mono font-bold text-success">
                        +{(parseFloat(habitData.stakeAmount) * 0.2).toFixed(2)} STRK
                      </p>
                    </div>
                    <div className="col-span-2 border-t pt-2">
                      <span className="text-gray-600">Total if completed:</span>
                      <p className="font-mono font-bold text-lg text-success">
                        {(parseFloat(habitData.stakeAmount) * 1.2).toFixed(2)} STRK
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="alert alert-warning">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L5.366 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              <div>
                <h4 className="font-medium">💡 Tips for success:</h4>
                <ul className="text-sm space-y-1 mt-1">
                  <li>• Be specific and measurable in your description</li>
                  <li>• Start with smaller stakes and build up</li>
                  <li>• Choose realistic time frames</li>
                  <li>• Higher stakes create stronger motivation!</li>
                </ul>
              </div>
            </div>

            {/* Create Button */}
            <div className="card-actions">
              <button
                className="btn btn-primary btn-block btn-lg"
                onClick={handleCreateHabit}
                disabled={isLoading || !habitData.title.trim() || !habitData.description.trim() || !habitData.stakeAmount}
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Creating Habit...
                  </>
                ) : (
                  "🎯 Create Habit & Stake STRK"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
