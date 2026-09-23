import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import { useNotification } from "../context/NotificationContext";
import { getContract, CONTRACT_ADDRESSES } from "../config/contracts";

export function useMarketplace() {
  const { signer, provider, account, refreshAccountData } = useWeb3();
  const { showTxPending, showTxSuccess, showTxError } = useNotification();
  const [loading, setLoading] = useState(false);

  const getMarketplaceContract = useCallback((useSigner = true) => {
    return getContract("ChainArtMarketplace", (useSigner && signer) ? signer : provider);
  }, [signer, provider]);

  // Create Fixed-Price Listing
  const createListing = useCallback(async (...args) => {
    if (!signer || !account) throw new Error("Wallet not connected");
    setLoading(true);

    let tokenId, quantity = 1, pricePerUnit = "0", paymentToken = ethers.ZeroAddress, duration = 86400 * 7, listingFeeWei = 0n;

    if (args.length === 1 && typeof args[0] === "object" && args[0] !== null) {
      const p = args[0];
      tokenId = p.tokenId;
      quantity = parseInt(p.quantity || 1, 10);
      pricePerUnit = p.pricePerUnit;
      paymentToken = p.paymentToken || ethers.ZeroAddress;
      duration = p.duration || 86400 * 7;
      listingFeeWei = p.listingFeeWei || 0n;
    } else if (args.length >= 2) {
      // Positional: (tokenId, amount, price, durationDays, currency)
      tokenId = args[0];
      quantity = parseInt(args[1] || 1, 10);
      const rawPrice = args[2] || "0";
      pricePerUnit = typeof rawPrice === "string" && rawPrice.includes(".") ? ethers.parseEther(rawPrice) : (typeof rawPrice === "bigint" ? rawPrice : ethers.parseEther(String(rawPrice || "0")));
      const days = parseInt(args[3] || 7, 10);
      duration = days * 86400;
      const currency = args[4];
      if (currency === 1) {
        paymentToken = CONTRACT_ADDRESSES.usdt || ethers.ZeroAddress;
      }
    }

    const priceWei = typeof pricePerUnit === "bigint" 
      ? pricePerUnit 
      : (typeof pricePerUnit === "string" && (pricePerUnit.includes(".") || !pricePerUnit.startsWith("0x")) ? ethers.parseEther(pricePerUnit) : BigInt(pricePerUnit || "0"));

    showTxPending("Validating Listing...", `Preparing to list ${quantity} copy(ies) on ChainArt Marketplace.`);

    try {
      const nftContract = getContract("ChainArtNFT", signer);
      const isDealer = await nftContract.isDealer(account).catch(() => false);
      const isDefaultAdmin = await nftContract.hasRole(ethers.ZeroHash, account).catch(() => false);
      if (!isDealer && !isDefaultAdmin) {
        throw new Error("Your wallet is not authorized as a Dealer on-chain. Please apply for dealership or get verified by Admin.");
      }

      // Check NFT balance
      const userBalance = await nftContract.balanceOf(account, tokenId);
      if (userBalance < BigInt(quantity)) {
        throw new Error(`Insufficient NFT balance. You own ${userBalance.toString()} edition(s), but requested to list ${quantity}.`);
      }

      // Calculate listing fee
      const contract = getMarketplaceContract(true);
      let fee = 0n;
      try {
        if (contract && typeof contract.getListingFee === "function") {
          fee = await contract.getListingFee(duration);
        } else {
          if (duration <= 3 * 86400) fee = ethers.parseEther("0.001");
          else if (duration <= 7 * 86400) fee = ethers.parseEther("0.002");
          else if (duration <= 10 * 86400) fee = ethers.parseEther("0.003");
          else fee = ethers.parseEther("0.005");
        }
      } catch (feeErr) {
        console.warn("Could not query getListingFee from contract, using standard fee:", feeErr);
        if (duration <= 3 * 86400) fee = ethers.parseEther("0.001");
        else if (duration <= 7 * 86400) fee = ethers.parseEther("0.002");
        else if (duration <= 10 * 86400) fee = ethers.parseEther("0.003");
        else fee = ethers.parseEther("0.005");
      }
      if (listingFeeWei && listingFeeWei > 0n) {
        fee = listingFeeWei;
      }

      // Verify ETH balance for listing fee
      const ethBalance = await provider.getBalance(account);
      if (ethBalance < fee) {
        throw new Error(`Insufficient Sepolia ETH. Listing fee requires ${ethers.formatEther(fee)} ETH, but your wallet balance is ${ethers.formatEther(ethBalance)} ETH.`);
      }

      const isApproved = await nftContract.isApprovedForAll(account, CONTRACT_ADDRESSES.marketplace);
      if (!isApproved) {
        showTxPending("Approving Marketplace Escrow...", "Please approve Marketplace to transfer NFTs.");
        const appTx = await nftContract.setApprovalForAll(CONTRACT_ADDRESSES.marketplace, true);
        await appTx.wait();
      }

      showTxPending("Confirming Listing on Blockchain...", `Escrowing ${quantity} copy(ies) on ChainArt Marketplace for ${Math.round(duration / 86400)} days.`);

      const tx = await contract.createListing(
        tokenId,
        quantity,
        priceWei,
        paymentToken || ethers.ZeroAddress,
        duration,
        { value: fee }
      );
      const receipt = await tx.wait();

      let createdListingId = null;
      try {
        for (const log of receipt.logs) {
          try {
            const parsed = contract.interface.parseLog(log);
            if (parsed && parsed.name === "ListingCreated") {
              createdListingId = Number(parsed.args.listingId);
              break;
            }
          } catch {}
        }
      } catch {}

      showTxSuccess("NFT Listed Successfully!", `Listing #${createdListingId || ""} active on marketplace.`, receipt.hash);
      return { 
        success: true, 
        receipt, 
        hash: receipt.hash, 
        txHash: receipt.hash,
        listingId: createdListingId 
      };
    } catch (error) {
      console.error("Listing failed:", error);
      showTxError("Failed to Create Listing", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [signer, provider, account, getMarketplaceContract, showTxPending, showTxSuccess, showTxError]);

  // Buy Partial or Full NFT Editions
  const buyNFT = useCallback(async (argsOrListingId, quantityParam = 1, priceParam = "0", paymentTokenParam = ethers.ZeroAddress) => {
    if (!signer || !account) throw new Error("Wallet not connected");
    setLoading(true);

    let listingId, quantity, pricePerUnit, paymentToken;
    if (typeof argsOrListingId === "object" && argsOrListingId !== null) {
      ({ listingId, quantity = 1, pricePerUnit, paymentToken = ethers.ZeroAddress } = argsOrListingId);
    } else {
      listingId = argsOrListingId;
      quantity = quantityParam;
      pricePerUnit = priceParam;
      paymentToken = paymentTokenParam;
    }

    const isETH = !paymentToken || paymentToken === ethers.ZeroAddress;
    const priceWei = typeof pricePerUnit === "string" && pricePerUnit.includes(".") 
      ? ethers.parseEther(pricePerUnit) 
      : BigInt(pricePerUnit || "0");
    const totalPrice = priceWei * BigInt(quantity);

    showTxPending("Purchasing NFT...", `Buying ${quantity} copy(ies) for ${isETH ? ethers.formatEther(totalPrice) + " ETH" : ethers.formatUnits(totalPrice, 18) + " USDT"}.`);

    try {
      // If USDT, handle approval first
      if (!isETH) {
        const usdtContract = getContract("MockUSDT", signer);
        const allowance = await usdtContract.allowance(account, CONTRACT_ADDRESSES.marketplace);
        if (allowance < totalPrice) {
          showTxPending("Approving USDT...", "Authorizing USDT transfer for marketplace purchase.");
          const appTx = await usdtContract.approve(CONTRACT_ADDRESSES.marketplace, ethers.MaxUint256);
          await appTx.wait();
        }
      }

      const contract = getMarketplaceContract(true);
      const tx = await contract.buy(
        listingId,
        quantity,
        isETH ? { value: totalPrice } : { value: 0 }
      );
      const receipt = await tx.wait();
      showTxSuccess("Purchase Confirmed!", `You bought ${quantity} edition(s)! Loyalty points awarded!`, receipt.hash);
      
      if (refreshAccountData) refreshAccountData(account, provider, signer);
      return { success: true, txHash: receipt.hash, receipt };
    } catch (error) {
      console.error("Purchase failed:", error);
      showTxError("Purchase Failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [signer, account, getMarketplaceContract, showTxPending, showTxSuccess, showTxError, refreshAccountData, provider]);

  // Cancel Listing
  const cancelListing = useCallback(async (listingId) => {
    if (!signer) throw new Error("Wallet not connected");
    setLoading(true);
    showTxPending("Cancelling Listing...", "Releasing escrowed NFT copies back to your wallet.");

    try {
      const contract = getMarketplaceContract(true);
      const tx = await contract.cancelListing(listingId);
      const receipt = await tx.wait();
      showTxSuccess("Listing Cancelled", "NFT returned from marketplace escrow.", receipt.hash);
      return receipt;
    } catch (error) {
      showTxError("Cancellation Failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [signer, getMarketplaceContract, showTxPending, showTxSuccess, showTxError]);

  // Expire Listing
  const expireListing = useCallback(async (listingId) => {
    if (!signer) throw new Error("Wallet not connected");
    setLoading(true);
    showTxPending("Expiring Listing...", "Reclaiming expired listing NFTs from escrow.");

    try {
      const contract = getMarketplaceContract(true);
      const tx = await contract.expireListing(listingId);
      const receipt = await tx.wait();
      showTxSuccess("Listing Expired", "NFT returned to seller wallet.", receipt.hash);
      return receipt;
    } catch (error) {
      showTxError("Failed to expire listing", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [signer, getMarketplaceContract, showTxPending, showTxSuccess, showTxError]);

  // Withdraw Seller / Royalty / Treasury Earnings (Pull Payments)
  const withdrawEarnings = useCallback(async (paymentToken = ethers.ZeroAddress) => {
    if (!signer) throw new Error("Wallet not connected");
    setLoading(true);
    showTxPending("Withdrawing Earnings...", "Claiming your pending marketplace sales proceeds.");

    try {
      const contract = getMarketplaceContract(true);
      const tx = await contract.withdraw(paymentToken);
      const receipt = await tx.wait();
      showTxSuccess("Withdrawal Successful!", "Proceeds successfully transferred to your wallet.", receipt.hash);
      return receipt;
    } catch (error) {
      showTxError("Withdrawal Failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [signer, getMarketplaceContract, showTxPending, showTxSuccess, showTxError]);

  // Read Pending Withdrawal
  const getPendingWithdrawal = useCallback(async (userAddress, tokenAddress = ethers.ZeroAddress) => {
    try {
      const contract = getMarketplaceContract(false);
      return await contract.getPendingWithdrawal(userAddress, tokenAddress);
    } catch {
      return 0n;
    }
  }, [getMarketplaceContract]);

  return {
    loading,
    createListing,
    buyNFT,
    cancelListing,
    expireListing,
    withdrawEarnings,
    getPendingWithdrawal,
    getMarketplaceContract,
  };
}
