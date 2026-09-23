import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import { useNotification } from "../context/NotificationContext";
import { getContract } from "../config/contracts";

export function useNFT() {
  const { signer, provider, account } = useWeb3();
  const { showTxPending, showTxSuccess, showTxError } = useNotification();
  const [loading, setLoading] = useState(false);

  const getNFTContract = useCallback((useSigner = true) => {
    return getContract("ChainArtNFT", (useSigner && signer) ? signer : provider);
  }, [signer, provider]);

  // Create / Mint NFT (Only Dealer)
  const createNFT = useCallback(async (...args) => {
    if (!signer || !account) throw new Error("Wallet not connected");
    setLoading(true);

    let name = "Luxury Asset";
    let category = "Watches";
    let metadataURI = "";
    let maxSupply = 10;
    let initialSupply = 10;
    let initialOwner = account;

    if (args.length === 1 && typeof args[0] === "object" && args[0] !== null) {
      const p = args[0];
      name = p.name || name;
      category = p.category || category;
      metadataURI = p.metadataURI || metadataURI;
      maxSupply = parseInt(p.maxSupply || maxSupply, 10);
      initialSupply = parseInt(p.initialSupply || initialSupply, 10);
      initialOwner = p.initialOwner || initialOwner;
    } else if (args.length > 1) {
      // Positional: (initialSupply, maxSupply, metadataURI, royaltyBps, category, name, description, imageUrl)
      initialSupply = parseInt(args[0] || initialSupply, 10);
      maxSupply = parseInt(args[1] || maxSupply, 10);
      metadataURI = args[2] || metadataURI;
      category = args[4] || category;
      name = args[5] || name;
    }

    showTxPending("Validating Mint Request...", `Preparing ${name} (${initialSupply}/${maxSupply} editions).`);

    try {
      const contract = getNFTContract(true);
      const isDealer = await contract.isDealer(account).catch(() => false);
      const isDefaultAdmin = await contract.hasRole(ethers.ZeroHash, account).catch(() => false);
      if (!isDealer && !isDefaultAdmin) {
        throw new Error("Your wallet is not authorized as a Dealer on-chain. Please apply for dealership or get verified by Admin.");
      }

      let mintFee = ethers.parseEther("0.0005");
      try {
        if (contract && typeof contract.mintFee === "function") {
          mintFee = await contract.mintFee();
        }
      } catch (feeErr) {
        console.warn("Could not fetch mintFee from contract, using default 0.0005 ETH:", feeErr);
      }

      // Check user's ETH balance
      const ethBalance = await provider.getBalance(account);
      if (ethBalance < mintFee) {
        throw new Error(`Insufficient Sepolia ETH for mint fee. Required: ${ethers.formatEther(mintFee)} ETH, Available: ${ethers.formatEther(ethBalance)} ETH.`);
      }

      showTxPending("Minting NFT Collection...", `Confirm the transaction in MetaMask to mint ${initialSupply} editions of ${name}.`);

      const tx = await contract.createNFT(
        name,
        category,
        metadataURI,
        maxSupply,
        initialSupply,
        initialOwner,
        { value: mintFee }
      );
      const receipt = await tx.wait();

      let mintedTokenId = null;
      try {
        for (const log of receipt.logs) {
          try {
            const parsed = contract.interface.parseLog(log);
            if (parsed && (parsed.name === "NFTCreated" || parsed.name === "NFTMinted")) {
              mintedTokenId = Number(parsed.args.tokenId);
              break;
            }
          } catch {}
        }
      } catch {}

      showTxSuccess("NFT Minted Successfully!", `Token #${mintedTokenId || ""} successfully minted on Sepolia.`, receipt.hash);
      return { 
        success: true, 
        receipt, 
        hash: receipt.hash, 
        txHash: receipt.hash,
        tokenId: mintedTokenId 
      };
    } catch (error) {
      console.error("Mint failed:", error);
      showTxError("NFT Minting Failed", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [signer, provider, account, getNFTContract, showTxPending, showTxSuccess, showTxError]);

  // Mint Additional Editions (Creator or Admin)
  const mintMore = useCallback(async (tokenId, toOrAmount, maybeAmount) => {
    if (!signer || !account) throw new Error("Wallet not connected");
    setLoading(true);

    let to = account;
    let amount = 1;

    if (maybeAmount !== undefined) {
      to = toOrAmount || account;
      amount = parseInt(maybeAmount, 10);
    } else {
      amount = parseInt(toOrAmount, 10) || 1;
    }

    showTxPending("Minting Additional Editions...", `Adding ${amount} more editions to Token #${tokenId}.`);

    try {
      const contract = getNFTContract(true);
      const tx = await contract.mintMore(tokenId, to, amount);
      const receipt = await tx.wait();
      showTxSuccess("Editions Minted Successfully!", `${amount} editions added to Token #${tokenId}.`, receipt.hash);
      return { success: true, receipt, hash: receipt.hash, txHash: receipt.hash };
    } catch (error) {
      showTxError("Additional Minting Failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [signer, account, getNFTContract, showTxPending, showTxSuccess, showTxError]);

  // Burn Token Editions (Holder)
  const burnNFT = useCallback(async (tokenId, amount = 1) => {
    if (!signer || !account) throw new Error("Wallet not connected");
    setLoading(true);
    showTxPending("Burning NFT Editions...", `Permanently destroying ${amount} edition(s) of Token #${tokenId}.`);

    try {
      const contract = getNFTContract(true);
      const tx = await contract.burnMyNFT(tokenId, amount);
      const receipt = await tx.wait();
      showTxSuccess("NFT Burned Successfully", `Destroyed ${amount} editions from your balance.`, receipt.hash);
      return { success: true, receipt, hash: receipt.hash, txHash: receipt.hash };
    } catch (error) {
      showTxError("Burn Failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [signer, account, getNFTContract, showTxPending, showTxSuccess, showTxError]);

  // Set Approval For All (e.g. for Marketplace / Auction escrow)
  const setApprovalForAll = useCallback(async (operatorAddress, status = true) => {
    if (!signer) throw new Error("Wallet not connected");
    setLoading(true);
    showTxPending("Approving Escrow Contract...", "Authorizing marketplace/auction contract to handle your NFTs.");

    try {
      const contract = getNFTContract(true);
      const tx = await contract.setApprovalForAll(operatorAddress, status);
      const receipt = await tx.wait();
      showTxSuccess("Contract Approved", "Escrow operator successfully approved.", receipt.hash);
      return { success: true, receipt, hash: receipt.hash, txHash: receipt.hash };
    } catch (error) {
      showTxError("Approval Failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [signer, getNFTContract, showTxPending, showTxSuccess, showTxError]);

  // Verify / Revoke Dealer (Admin)
  const setDealerStatus = useCallback(async (dealerAddress, status, silent = false) => {
    if (!signer) {
      if (silent) return null;
      throw new Error("Wallet not connected");
    }
    setLoading(true);
    if (!silent) {
      showTxPending(status ? "Verifying Dealer..." : "Revoking Dealer...", `Updating dealer access for ${dealerAddress}`);
    }

    try {
      const contract = getNFTContract(true);
      const tx = await contract.setDealerStatus(dealerAddress, status);
      const receipt = await tx.wait();
      if (!silent) {
        showTxSuccess(status ? "Dealer Verified!" : "Dealer Revoked!", `Dealer status updated on-chain.`, receipt.hash);
      }
      return { success: true, receipt, hash: receipt.hash, txHash: receipt.hash };
    } catch (error) {
      console.warn("setDealerStatus on-chain warning:", error);
      if (!silent) {
        showTxError("Failed to update dealer status", error);
      }
      if (silent) {
        return null;
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [signer, getNFTContract, showTxPending, showTxSuccess, showTxError]);

  // Read Token Info
  const fetchNFTData = useCallback(async (tokenId) => {
    try {
      const contract = getNFTContract(false);
      const item = await contract.getNFT(tokenId);
      const supply = await contract.currentSupply(tokenId);
      const [royaltyReceiver, royaltyAmount] = await contract.royaltyInfo(tokenId, ethers.parseEther("1.0"));
      
      let userBalance = 0n;
      if (account) {
        userBalance = await contract.balanceOf(account, tokenId);
      }

      return {
        tokenId: Number(item.tokenId),
        name: item.name,
        category: item.category,
        metadataURI: item.metadataURI,
        maxSupply: Number(item.maxSupply),
        currentSupply: Number(supply),
        creator: item.creator,
        active: item.active,
        royaltyReceiver,
        royaltyPercent: Number((royaltyAmount * 10000n) / ethers.parseEther("1.0")) / 100, // in %
        userBalance: Number(userBalance),
      };
    } catch (error) {
      console.warn(`Error fetching Token #${tokenId}:`, error);
      return null;
    }
  }, [account, getNFTContract]);

  return {
    loading,
    createNFT,
    mintMore,
    burnNFT,
    setApprovalForAll,
    setDealerStatus,
    fetchNFTData,
    getNFTContract,
  };
}
