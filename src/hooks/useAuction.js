import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import { useNotification } from "../context/NotificationContext";
import { getContract, CONTRACT_ADDRESSES } from "../config/contracts";

export function useAuction() {
  const { signer, provider, account, refreshAccountData } = useWeb3();
  const { showTxPending, showTxSuccess, showTxError } = useNotification();
  const [loading, setLoading] = useState(false);

  const getAuctionContract = useCallback((useSigner = true) => {
    return getContract("ChainArtAuction", (useSigner && signer) ? signer : provider);
  }, [signer, provider]);

  // Create English Auction
  const createAuction = useCallback(async (...args) => {
    if (!signer || !account) throw new Error("Wallet not connected");
    setLoading(true);

    let tokenId, quantity = 1, paymentToken = ethers.ZeroAddress, startingPrice = "0", duration = 86400 * 3, minIncrementBps = 1000;

    if (args.length === 1 && typeof args[0] === "object" && args[0] !== null) {
      const p = args[0];
      tokenId = p.tokenId;
      quantity = parseInt(p.quantity || 1, 10);
      paymentToken = p.paymentToken || ethers.ZeroAddress;
      startingPrice = p.startingPrice;
      duration = p.duration || 86400 * 3;
      minIncrementBps = p.minIncrementBps || 1000;
    } else if (args.length >= 2) {
      // Positional: (tokenId, amount, startPrice, durationDays)
      tokenId = args[0];
      quantity = parseInt(args[1] || 1, 10);
      const rawPrice = args[2] || "0";
      startingPrice = typeof rawPrice === "string" && rawPrice.includes(".") ? ethers.parseEther(rawPrice) : (typeof rawPrice === "bigint" ? rawPrice : ethers.parseEther(String(rawPrice || "0")));
      const days = parseInt(args[3] || 3, 10);
      duration = days * 86400;
    }

    const startPriceWei = typeof startingPrice === "bigint"
      ? startingPrice
      : (typeof startingPrice === "string" && (startingPrice.includes(".") || !startingPrice.startsWith("0x")) ? ethers.parseEther(startingPrice) : BigInt(startingPrice || "0"));

    showTxPending("Validating Auction...", `Preparing auction for ${quantity} NFT(s).`);

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
        throw new Error(`Insufficient NFT balance. You own ${userBalance.toString()} edition(s), but requested to auction ${quantity}.`);
      }

      const isApproved = await nftContract.isApprovedForAll(account, CONTRACT_ADDRESSES.auction);
      if (!isApproved) {
        showTxPending("Approving Auction Escrow...", "Please approve Auction contract to hold NFTs.");
        const appTx = await nftContract.setApprovalForAll(CONTRACT_ADDRESSES.auction, true);
        await appTx.wait();
      }

      showTxPending("Confirming Auction on Blockchain...", `Escrowing ${quantity} NFT(s) for a ${Math.round(duration / 3600)} hour auction.`);

      const contract = getAuctionContract(true);
      const tx = await contract.createAuction(
        tokenId,
        quantity,
        paymentToken || ethers.ZeroAddress,
        startPriceWei,
        duration,
        minIncrementBps || 1000 // 10% default increment
      );
      const receipt = await tx.wait();

      let createdAuctionId = null;
      try {
        for (const log of receipt.logs) {
          try {
            const parsed = contract.interface.parseLog(log);
            if (parsed && parsed.name === "AuctionCreated") {
              createdAuctionId = Number(parsed.args.auctionId);
              break;
            }
          } catch {}
        }
      } catch {}

      showTxSuccess("Auction Launched!", `Auction #${createdAuctionId || ""} live on ChainArt.`, receipt.hash);
      return { 
        success: true, 
        receipt, 
        hash: receipt.hash, 
        txHash: receipt.hash,
        auctionId: createdAuctionId 
      };
    } catch (error) {
      console.error("Auction creation failed:", error);
      showTxError("Failed to Create Auction", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [signer, account, getAuctionContract, showTxPending, showTxSuccess, showTxError]);

  // Place Bid
  const placeBid = useCallback(async (argsOrAuctionId, bidAmountParam = "0", paymentTokenParam = ethers.ZeroAddress) => {
    if (!signer || !account) throw new Error("Wallet not connected");
    setLoading(true);

    let auctionId, bidAmount, paymentToken;
    if (typeof argsOrAuctionId === "object" && argsOrAuctionId !== null) {
      ({ auctionId, bidAmount, paymentToken = ethers.ZeroAddress } = argsOrAuctionId);
    } else {
      auctionId = argsOrAuctionId;
      bidAmount = bidAmountParam;
      paymentToken = paymentTokenParam;
    }

    const isETH = !paymentToken || paymentToken === ethers.ZeroAddress;
    const bidAmountWei = typeof bidAmount === "string" && (bidAmount.includes(".") || !bidAmount.startsWith("0x"))
      ? ethers.parseEther(bidAmount.toString())
      : BigInt(bidAmount || "0");

    showTxPending("Placing Bid...", `Submitting bid of ${isETH ? ethers.formatEther(bidAmountWei) + " ETH" : ethers.formatUnits(bidAmountWei, 18) + " USDT"}. (Anti-sniping protection active).`);

    try {
      if (!isETH) {
        const usdtContract = getContract("MockUSDT", signer);
        const allowance = await usdtContract.allowance(account, CONTRACT_ADDRESSES.auction);
        if (allowance < bidAmountWei) {
          showTxPending("Approving USDT...", "Authorizing USDT transfer for auction bid.");
          const appTx = await usdtContract.approve(CONTRACT_ADDRESSES.auction, ethers.MaxUint256);
          await appTx.wait();
        }
      }

      const contract = getAuctionContract(true);
      const tx = await contract.bid(
        auctionId,
        bidAmountWei,
        isETH ? { value: bidAmountWei } : { value: 0 }
      );
      const receipt = await tx.wait();
      showTxSuccess("Bid Placed Successfully!", "You are currently the highest bidder!", receipt.hash);
      
      if (refreshAccountData) refreshAccountData(account, provider, signer);
      return { success: true, txHash: receipt.hash, receipt };
    } catch (error) {
      console.error("Bidding failed:", error);
      showTxError("Failed to Place Bid", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [signer, account, getAuctionContract, showTxPending, showTxSuccess, showTxError, refreshAccountData, provider]);

  // Settle Auction
  const settleAuction = useCallback(async (auctionId) => {
    if (!signer) throw new Error("Wallet not connected");
    setLoading(true);
    showTxPending("Settling Auction...", "Distributing NFT to highest bidder & splitting proceeds.");

    try {
      const contract = getAuctionContract(true);
      const tx = await contract.settleAuction(auctionId);
      const receipt = await tx.wait();
      showTxSuccess("Auction Settled!", "NFT transferred and sales proceeds distributed.", receipt.hash);
      return receipt;
    } catch (error) {
      showTxError("Settlement Failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [signer, getAuctionContract, showTxPending, showTxSuccess, showTxError]);

  // Cancel Auction (Only before first bid)
  const cancelAuction = useCallback(async (auctionId) => {
    if (!signer) throw new Error("Wallet not connected");
    setLoading(true);
    showTxPending("Cancelling Auction...", "Returning NFT from auction escrow.");

    try {
      const contract = getAuctionContract(true);
      const tx = await contract.cancelAuction(auctionId);
      const receipt = await tx.wait();
      showTxSuccess("Auction Cancelled", "NFT returned to seller wallet.", receipt.hash);
      return receipt;
    } catch (error) {
      showTxError("Cancellation Failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [signer, getAuctionContract, showTxPending, showTxSuccess, showTxError]);

  // Withdraw Outbid Bid Refund / Earnings
  const withdrawAuctionFunds = useCallback(async (paymentToken = ethers.ZeroAddress) => {
    if (!signer) throw new Error("Wallet not connected");
    setLoading(true);
    showTxPending("Withdrawing Funds...", "Claiming your refunded bids or auction proceeds.");

    try {
      const contract = getAuctionContract(true);
      const tx = await contract.withdraw(paymentToken);
      const receipt = await tx.wait();
      showTxSuccess("Withdrawal Successful!", "Funds safely returned to your wallet.", receipt.hash);
      return receipt;
    } catch (error) {
      showTxError("Withdrawal Failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [signer, getAuctionContract, showTxPending, showTxSuccess, showTxError]);

  const getPendingWithdrawal = useCallback(async (userAddress, tokenAddress = ethers.ZeroAddress) => {
    try {
      const contract = getAuctionContract(false);
      return await contract.getPendingWithdrawal(userAddress, tokenAddress);
    } catch {
      return 0n;
    }
  }, [getAuctionContract]);

  return {
    loading,
    createAuction,
    placeBid,
    settleAuction,
    cancelAuction,
    withdrawAuctionFunds,
    getPendingWithdrawal,
    getAuctionContract,
  };
}
