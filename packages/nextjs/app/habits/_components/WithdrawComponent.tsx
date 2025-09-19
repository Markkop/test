"use client";

import { useState } from "react";
import { StarkInput } from "~~/components/scaffold-stark";
import { useScaffoldWriteContract, useScaffoldReadContract } from "~~/hooks/scaffold-stark";
import { useAccount } from "@starknet-react/core";

export const WithdrawComponent = () => {
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isWithdrawingAll, setIsWithdrawingAll] = useState(false);

  const { address: connectedAddress } = useAccount();
  
  // Get user's current balance info
  const { data: userInfo, refetch: refetchUserInfo } = useScaffoldReadContract({
    contractName: "HabitsFarm",
    functionName: "get_user_info",
    args: [connectedAddress],
  });

  // Withdraw contract call for specific amount
  const { sendAsync: withdrawDeposit } = useScaffoldWriteContract({
    contractName: "HabitsFarm",
    functionName: "withdraw_deposit",
    args: [withdrawAmount ? BigInt(parseFloat(withdrawAmount) * 1e18) : 0n],
  });

  // Withdraw contract call for full balance
  const { sendAsync: withdrawAllDeposit } = useScaffoldWriteContract({
    contractName: "HabitsFarm",
    functionName: "withdraw_deposit",
    args: [userInfo?.available_balance || 0n],
  });

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert("Please enter a valid withdraw amount");
      return;
    }

    if (!userInfo?.available_balance) {
      alert("No balance available to withdraw");
      return;
    }

    const withdrawAmountWei = BigInt(parseFloat(withdrawAmount) * 1e18);
    if (withdrawAmountWei > userInfo.available_balance) {
      alert("Withdraw amount exceeds available balance");
      return;
    }

    try {
      setIsWithdrawing(true);
      await withdrawDeposit();
      
      // Refresh user info after successful withdrawal
      setTimeout(() => {
        refetchUserInfo();
      }, 3000);
      
      // Clear the input
      setWithdrawAmount("");
      
    } catch (error) {
      console.error("Withdrawal failed:", error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleWithdrawAll = async () => {
    if (!userInfo?.available_balance) {
      alert("No balance available to withdraw");
      return;
    }

    try {
      setIsWithdrawingAll(true);
      await withdrawAllDeposit();
      
      // Refresh user info after successful withdrawal
      setTimeout(() => {
        refetchUserInfo();
      }, 3000);
      
      // Clear the input
      setWithdrawAmount("");
      
    } catch (error) {
      console.error("Withdrawal failed:", error);
    } finally {
      setIsWithdrawingAll(false);
    }
  };

  if (!userInfo?.is_registered) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl text-center mb-4">
            💰 Withdraw Funds
          </h2>
          <div className="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>You need to be registered to withdraw funds.</span>
          </div>
        </div>
      </div>
    );
  }

  const availableBalanceStrk = userInfo.available_balance 
    ? (Number(userInfo.available_balance) / 1e18).toFixed(4)
    : "0.0000";

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-2xl text-center mb-6">
          💰 Withdraw Funds
        </h2>
        
        <div className="space-y-6">
          {/* Balance Info */}
          <div className="stats shadow w-full">
            <div className="stat">
              <div className="stat-figure text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
                </svg>
              </div>
              <div className="stat-title">Available to Withdraw</div>
              <div className="stat-value text-primary">{availableBalanceStrk}</div>
              <div className="stat-desc">STRK tokens ready to withdraw</div>
            </div>
          </div>

          {/* Withdraw Form */}
          {parseFloat(availableBalanceStrk) > 0 ? (
            <>
              <div>
                <label className="label">
                  <span className="label-text text-lg font-medium">
                    Withdraw Amount (STRK)
                  </span>
                </label>
                <StarkInput
                  value={withdrawAmount}
                  onChange={(value) => setWithdrawAmount(value)}
                  placeholder={`Max: ${availableBalanceStrk} STRK`}
                />
                <label className="label">
                  <span className="label-text-alt text-gray-500">
                    Available: {availableBalanceStrk} STRK
                  </span>
                </label>
              </div>

              <div className="alert alert-info">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <h4 className="font-medium">Withdrawal Information:</h4>
                  <p className="text-sm">
                    • You can only withdraw from your available balance<br/>
                    • Funds staked in active habits cannot be withdrawn<br/>
                    • Transactions are processed on Starknet
                  </p>
                </div>
              </div>

              <div className="card-actions space-y-3">
                {/* Partial Withdraw */}
                <button 
                  className="btn btn-primary btn-block" 
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || isWithdrawingAll || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                >
                  {isWithdrawing ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Withdrawing...
                    </>
                  ) : (
                    `💸 Withdraw ${withdrawAmount || "0"} STRK`
                  )}
                </button>

                {/* Withdraw All */}
                <button 
                  className="btn btn-secondary btn-block" 
                  onClick={handleWithdrawAll}
                  disabled={isWithdrawing || isWithdrawingAll}
                >
                  {isWithdrawingAll ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Withdrawing All...
                    </>
                  ) : (
                    `🏦 Withdraw All (${availableBalanceStrk} STRK)`
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="alert alert-warning">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="font-medium">No Funds Available</h4>
                <p className="text-sm">You don't have any funds available to withdraw.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
