import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import { useNotification } from "../context/NotificationContext";
import { getContract } from "../config/contracts";

export function useLoyalty() {
  const { signer, provider, account, refreshAccountData } = useWeb3();
  const { showTxPending, showTxSuccess, showTxError } = useNotification();
  const [loading, setLoading] = useState(false);

  const getLoyaltyContract = useCallback((useSigner = true) => {
    return getContract("ChainArtLoyalty", (useSigner && signer) ? signer : provider);
  }, [signer, provider]);

  // Fetch full user loyalty data
  const fetchUserLoyalty = useCallback(async (userAddress) => {
    const target = userAddress || account;
    if (!target) return null;

    try {
      const contract = getLoyaltyContract(false);
      if (!contract) return null;

      let points = 0;
      let validSellerActivities = 0;
      let purchases = 0;
      let auctionWins = 0;
      let rewardsClaimed = "0";
      let rewardMilestone = 0;
      let level = "Normal";
      let availableMilestones = 0;
      let rewardAmountWei = 0n;
      let calculatedRewardWei = 0n;

      if (typeof contract.getLoyalty === "function") {
        try {
          const data = await contract.getLoyalty(target);
          if (data) {
            points = Number(data.points ?? data[0] ?? 0);
            validSellerActivities = Number(data.validSellerActivities ?? data[1] ?? 0);
            purchases = Number(data.purchases ?? data[2] ?? 0);
            auctionWins = Number(data.auctionWins ?? data[3] ?? 0);
            rewardsClaimed = ethers.formatEther(data.rewardsClaimed ?? data[4] ?? 0n);
            rewardMilestone = Number(data.rewardMilestone ?? data[5] ?? 0);
          }
        } catch (e) {
          console.warn("Could not get loyalty info:", e);
        }
      }

      if (typeof contract.getLevel === "function") {
        try {
          level = await contract.getLevel(target);
        } catch (e) {
          console.warn("Could not get loyalty level:", e);
        }
      }

      if (typeof contract.availableRewards === "function") {
        try {
          const avail = await contract.availableRewards(target);
          availableMilestones = Number(avail);
        } catch (e) {
          console.warn("Could not get available rewards:", e);
        }
      }

      if (typeof contract.rewardAmountETH === "function") {
        try {
          rewardAmountWei = await contract.rewardAmountETH();
        } catch (e) {
          console.warn("Could not get reward amount ETH:", e);
        }
      }

      if (typeof contract.calculateMilestoneReward === "function") {
        try {
          calculatedRewardWei = await contract.calculateMilestoneReward(target);
        } catch (e) {
          console.warn("Could not calculate milestone reward:", e);
        }
      }

      const rewardAmountETH = rewardAmountWei > 0n ? ethers.formatEther(rewardAmountWei) : "0.01";
      const calculatedMilestoneRewardETH = calculatedRewardWei > 0n 
        ? ethers.formatEther(calculatedRewardWei) 
        : rewardAmountETH;

      return {
        points,
        validSellerActivities,
        purchases,
        auctionWins,
        rewardsClaimed,
        rewardMilestone,
        level,
        availableMilestones,
        rewardAmountETH,
        calculatedMilestoneRewardETH,
      };
    } catch (error) {
      console.warn("Error fetching loyalty data:", error);
      return {
        points: 0,
        validSellerActivities: 0,
        purchases: 0,
        auctionWins: 0,
        rewardsClaimed: "0",
        rewardMilestone: 0,
        level: "Normal",
        availableMilestones: 0,
        rewardAmountETH: "0.01",
        calculatedMilestoneRewardETH: "0.01",
      };
    }
  }, [account, getLoyaltyContract]);

  // Claim Earned Milestone Reward (10 valid seller activities)
  const claimReward = useCallback(async () => {
    if (!signer || !account) throw new Error("Wallet not connected");
    setLoading(true);
    showTxPending("Claiming Loyalty Milestone Reward...", "Submitting pull-claim request to withdraw milestone reward in ETH.");

    try {
      const contract = getLoyaltyContract(true);
      const tx = await contract.claimReward();
      const receipt = await tx.wait();
      showTxSuccess("Milestone Reward Claimed!", "ETH reward has been transferred directly to your wallet!", receipt.hash);
      
      if (refreshAccountData) refreshAccountData(account, provider, signer);
      return receipt;
    } catch (error) {
      console.error("Claim reward failed:", error);
      showTxError("Failed to Claim Reward", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [signer, account, getLoyaltyContract, showTxPending, showTxSuccess, showTxError, refreshAccountData, provider]);

  // Admin: Fund Reward Pool with ETH
  const fundRewards = useCallback(async (amountETH) => {
    if (!signer) throw new Error("Wallet not connected");
    setLoading(true);
    showTxPending("Funding Loyalty Pool...", `Depositing ${amountETH} ETH into reward pool.`);

    try {
      const contract = getLoyaltyContract(true);
      const tx = await contract.fundRewards({ value: ethers.parseEther(amountETH) });
      const receipt = await tx.wait();
      showTxSuccess("Reward Pool Funded!", `${amountETH} ETH added to loyalty pool.`, receipt.hash);
      return receipt;
    } catch (error) {
      showTxError("Funding Failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [signer, getLoyaltyContract, showTxPending, showTxSuccess, showTxError]);

  // Admin: Update Reward Amount Per 10-Milestone
  const setRewardAmount = useCallback(async (amountETH) => {
    if (!signer) throw new Error("Wallet not connected");
    setLoading(true);
    showTxPending("Updating Milestone Reward...", `Setting reward to ${amountETH} ETH per 10 valid sales.`);

    try {
      const contract = getLoyaltyContract(true);
      const tx = await contract.setRewardAmount(ethers.parseEther(amountETH));
      const receipt = await tx.wait();
      showTxSuccess("Reward Amount Updated!", `Milestone reward set to ${amountETH} ETH.`, receipt.hash);
      return receipt;
    } catch (error) {
      showTxError("Update Failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [signer, getLoyaltyContract, showTxPending, showTxSuccess, showTxError]);

  return {
    loading,
    fetchUserLoyalty,
    claimReward,
    fundRewards,
    setRewardAmount,
    getLoyaltyContract,
  };
}
