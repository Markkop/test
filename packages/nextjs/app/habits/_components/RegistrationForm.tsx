"use client";

import { useState } from "react";
import { StarkInput } from "~~/components/scaffold-stark";
import { useScaffoldWriteContract, useScaffoldReadContract, useDeployedContractInfo } from "~~/hooks/scaffold-stark";
import { useAccount } from "@starknet-react/core";

export const RegistrationForm = () => {
  const [depositAmount, setDepositAmount] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [approvalTxHash, setApprovalTxHash] = useState("");

  const { address: connectedAddress } = useAccount();
  
  // Get the deployed HabitsFarm contract address
  const { data: habitsFarmContract } = useDeployedContractInfo({
    contractName: "HabitsFarm",
  });
  
  // Check current STRK allowance
  const { data: allowance, refetch: refetchAllowance } = useScaffoldReadContract({
    contractName: "Strk",
    functionName: "allowance",
    args: [connectedAddress, habitsFarmContract?.address || "0xfdebe84ca9f2753a8481e38de02a38551681b955c4d5b69eeca255a7315212"], // HabitsFarm contract address
  });

  // STRK token approval
  const { sendAsync: approveStrk } = useScaffoldWriteContract({
    contractName: "Strk",
    functionName: "approve",
    args: [
      habitsFarmContract?.address || "0xfdebe84ca9f2753a8481e38de02a38551681b955c4d5b69eeca255a7315212", // HabitsFarm contract address
      depositAmount ? BigInt(parseFloat(depositAmount) * 1e18) : 0n,
    ],
  });

  // User registration
  const { sendAsync: registerUser } = useScaffoldWriteContract({
    contractName: "HabitsFarm",
    functionName: "register_user",
    args: [depositAmount ? BigInt(parseFloat(depositAmount) * 1e18) : 0n],
  });

  const handleApproval = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert("Please enter a valid deposit amount");
      return;
    }

    if (!habitsFarmContract?.address) {
      console.warn("Contract address not loaded, using hook fallback...");
    }

    try {
      setIsApproving(true);
      const txHash = await approveStrk();
      setApprovalTxHash(txHash);
      
      // Wait a moment then refetch allowance
      setTimeout(() => {
        refetchAllowance();
      }, 2000);
      
    } catch (error) {
      console.error("Approval failed:", error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleRegistration = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert("Please enter a valid deposit amount");
      return;
    }

    if (!habitsFarmContract?.address) {
      console.warn("Contract address not loaded, using hook fallback...");
    }

    try {
      setIsRegistering(true);
      await registerUser();
      // The page will refresh automatically due to the contract state change
    } catch (error) {
      console.error("Registration failed:", error);
    } finally {
      setIsRegistering(false);
    }
  };

  const depositAmountWei = depositAmount ? BigInt(parseFloat(depositAmount) * 1e18) : 0n;
  const hasEnoughAllowance = allowance && allowance >= depositAmountWei;

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-2xl text-center mb-6">
          🚀 Join Habits Farm
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">How it works:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-primary-content rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Deposit STRK</h4>
                  <p className="text-sm text-gray-600">
                    Stake tokens to join and earn staking rewards
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-primary-content rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Create Habits</h4>
                  <p className="text-sm text-gray-600">
                    Set goals with stake amounts as motivation
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-primary-content rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Complete & Earn</h4>
                  <p className="text-sm text-gray-600">
                    Get your stake back + 20% bonus reward
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-primary-content rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-medium">Passive Income</h4>
                  <p className="text-sm text-gray-600">
                    Earn 5% APR on all deposited funds
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="divider"></div>

          <div>
            <label className="label">
              <span className="label-text text-lg font-medium">
                Initial Deposit Amount (STRK)
              </span>
            </label>
            <StarkInput
              value={depositAmount}
              onChange={(value) => setDepositAmount(value)}
              placeholder="Enter amount to deposit (e.g., 100)"
            />
            <label className="label">
              <span className="label-text-alt text-gray-500">
                Minimum recommended: 10 STRK. You can withdraw anytime.
              </span>
            </label>
          </div>

          {/* Allowance Status */}
          {depositAmount && parseFloat(depositAmount) > 0 && (
            <div className={`alert ${hasEnoughAllowance ? 'alert-success' : 'alert-warning'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <h4 className="font-medium">
                  {hasEnoughAllowance ? "✅ STRK Approved" : "⏳ STRK Approval Needed"}
                </h4>
                <p className="text-sm">
                  {hasEnoughAllowance 
                    ? "You can now register and deposit your STRK tokens!" 
                    : "First approve STRK spending, then register to join Habits Farm."}
                </p>
              </div>
            </div>
          )}

          <div className="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <h4 className="font-medium">Important:</h4>
              <p className="text-sm">
                Your deposit will earn 5% APR automatically!
              </p>
            </div>
          </div>

          <div className="card-actions space-y-3">
            {/* Step 1: Approve STRK */}
            {!hasEnoughAllowance && (
              <button 
                className="btn btn-warning btn-block" 
                onClick={handleApproval}
                disabled={isApproving || !depositAmount || parseFloat(depositAmount) <= 0}
              >
                {isApproving ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Approving STRK...
                  </>
                ) : (
                  "1️⃣ Approve STRK Spending"
                )}
              </button>
            )}

            {/* Step 2: Register */}
            <button 
              className="btn btn-primary btn-block" 
              onClick={handleRegistration}
              disabled={isRegistering || !hasEnoughAllowance || !depositAmount || parseFloat(depositAmount) <= 0}
            >
              {isRegistering ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Registering...
                </>
              ) : (
                hasEnoughAllowance ? "🌱 Join Habits Farm" : "2️⃣ Join Habits Farm"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
