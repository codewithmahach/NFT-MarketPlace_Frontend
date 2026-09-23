import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESSES, SEPOLIA_CONFIG, getContract } from "../config/contracts";
import { authApi, dealerApi } from "../services/api";

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState("0");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isDealer, setIsDealer] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);
  const [jwtToken, setJwtToken] = useState(localStorage.getItem("chainart_jwt") || null);
  const [userProfile, setUserProfile] = useState(null);

  // Initialize read-only provider for initial data fetching
  const getReadOnlyProvider = useCallback(() => {
    return new ethers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrls[0]);
  }, []);

  const isCorrectNetwork = chainId === CONTRACT_ADDRESSES.chainId;
  const isAuthenticated = Boolean(account && jwtToken);

  // Refresh Account Balance and Roles with Multi-RPC Fallback
  const refreshAccountData = useCallback(async (currentAccount, currentProvider, currentSigner) => {
    if (!currentAccount) return;

    // 1. Fetch Sepolia Balance with Fallback
    try {
      let bal = null;
      if (currentProvider) {
        try {
          bal = await currentProvider.getBalance(currentAccount);
        } catch {
          // If MetaMask provider RPC failed/dropped, query public RPC fallback
          for (const rpc of SEPOLIA_CONFIG.rpcUrls) {
            try {
              const fallback = new ethers.JsonRpcProvider(rpc, 11155111, { staticNetwork: true });
              bal = await fallback.getBalance(currentAccount);
              if (bal !== null && bal !== undefined) break;
            } catch {}
          }
        }
      }
      if (bal !== null && bal !== undefined) {
        const formattedBal = ethers.formatEther(bal);
        setBalance((prev) => (prev === formattedBal ? prev : formattedBal));
      }
    } catch {
      // Keep previous balance silently if all RPCs busy
    }

    // 2. Read roles from ChainArtNFT contract
    try {
      const runner = currentSigner || currentProvider || new ethers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrls[0], 11155111, { staticNetwork: true });
      const nftContract = getContract("ChainArtNFT", runner);

      // Check Dealer Status (On-chain + API verification)
      let onChainDealer = false;
      try {
        const dealerRole = await nftContract.DEALER_ROLE();
        const hasDealerRole = await nftContract.hasRole(dealerRole, currentAccount).catch(() => false);
        const isVerifiedOnContract = typeof nftContract.isDealer === "function" 
          ? await nftContract.isDealer(currentAccount).catch(() => false) 
          : false;
        onChainDealer = Boolean(hasDealerRole || isVerifiedOnContract);
      } catch {
        // Fallback to public RPC
        try {
          const fallback = new ethers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrls[0], 11155111, { staticNetwork: true });
          const fbContract = getContract("ChainArtNFT", fallback);
          const isVerifiedOnContract = await fbContract.isDealer(currentAccount).catch(() => false);
          onChainDealer = Boolean(isVerifiedOnContract);
        } catch {}
      }

      // Also check local application status / backend dealer status
      try {
        const myAppRes = await dealerApi.getMyApplication(currentAccount).catch(() => null);
        const isDbDealer = myAppRes?.data?.isVerifiedDealer || myAppRes?.data?.application?.status === "approved";
        const finalDealerStatus = Boolean(onChainDealer || isDbDealer);
        setIsDealer((prev) => (prev === finalDealerStatus ? prev : finalDealerStatus));
      } catch {
        setIsDealer((prev) => (prev === onChainDealer ? prev : onChainDealer));
      }

      // Check Admin Role
      try {
        const defaultAdminRole = ethers.ZeroHash;
        const adminRole = await nftContract.ADMIN_ROLE();
        const isDefaultAdmin = await nftContract.hasRole(defaultAdminRole, currentAccount).catch(() => false);
        const hasAdmin = await nftContract.hasRole(adminRole, currentAccount).catch(() => false);
        const adminStatus = Boolean(isDefaultAdmin || hasAdmin);
        setIsAdmin((prev) => (prev === adminStatus ? prev : adminStatus));
      } catch {
        try {
          const fallback = new ethers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrls[0], 11155111, { staticNetwork: true });
          const fbContract = getContract("ChainArtNFT", fallback);
          const isDefaultAdmin = await fbContract.hasRole(ethers.ZeroHash, currentAccount).catch(() => false);
          setIsAdmin((prev) => (prev === Boolean(isDefaultAdmin) ? prev : Boolean(isDefaultAdmin)));
        } catch {}
      }
    } catch {
      // Silent catch
    }
  }, []);

  // Web3 Cryptographic Login (EIP-191 Nonce Signing -> JWT)
  const loginWithSignature = useCallback(async (customSigner = null, customAccount = null) => {
    const activeSigner = customSigner || signer;
    const activeAccount = customAccount || account;

    if (!activeSigner || !activeAccount) {
      console.warn("Cannot sign auth message: wallet not connected.");
      return { success: false, error: "Wallet not connected" };
    }

    setIsAuthenticating(true);
    try {
      // 1. Fetch Nonce from Backend
      const nonceRes = await authApi.getNonce(activeAccount);
      if (!nonceRes || !nonceRes.success || !nonceRes.data) {
        throw new Error(nonceRes?.message || "Failed to fetch authentication nonce");
      }

      const { message } = nonceRes.data;

      // 2. Prompt user to sign personal message via MetaMask
      const signature = await activeSigner.signMessage(message);

      // 3. Verify Signature & Receive JWT
      const verifyRes = await authApi.verifySignature(activeAccount, signature);
      if (!verifyRes || !verifyRes.success || !verifyRes.data) {
        throw new Error(verifyRes?.message || "Signature verification failed");
      }

      const token = verifyRes.data.token;
      const profile = verifyRes.data.user;

      localStorage.setItem("chainart_jwt", token);
      setJwtToken(token);
      setUserProfile(profile);

      if (profile.isDealer !== undefined) setIsDealer(Boolean(profile.isDealer));
      if (profile.isAdmin !== undefined) setIsAdmin(Boolean(profile.isAdmin));

      return { success: true, token, user: profile };
    } catch (error) {
      console.error("Web3 signature authentication error:", error);
      return { success: false, error: error.message };
    } finally {
      setIsAuthenticating(false);
    }
  }, [signer, account]);

  // Disconnect Wallet
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setSigner(null);
    setIsDealer(false);
    setIsAdmin(false);
    setBalance("0");
    setJwtToken(null);
    setUserProfile(null);
    localStorage.removeItem("chainart_jwt");
  }, []);

  // Switch to Sepolia Network
  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CONFIG.chainId }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [SEPOLIA_CONFIG],
          });
        } catch (addError) {
          console.error("Failed to add Sepolia network:", addError);
        }
      } else {
        console.error("Failed to switch network:", switchError);
      }
    }
  }, []);

  // Connect MetaMask
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed. Please install MetaMask to use ChainArt.");
      window.open("https://metamask.io/download/", "_blank");
      return;
    }

    setIsConnecting(true);
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const network = await browserProvider.getNetwork();
      const currentSigner = await browserProvider.getSigner();
      const activeAccount = accounts[0];
      const activeChainId = Number(network.chainId);

      setProvider(browserProvider);
      setSigner(currentSigner);
      setAccount(activeAccount);
      setChainId(activeChainId);

      await refreshAccountData(activeAccount, browserProvider, currentSigner);

      // If wrong network, request switch
      if (activeChainId !== CONTRACT_ADDRESSES.chainId) {
        await switchNetwork();
      }

      // Check existing JWT or prompt sign-in
      const savedToken = localStorage.getItem("chainart_jwt");
      if (savedToken) {
        const meRes = await authApi.getMe(savedToken);
        if (meRes && meRes.success && meRes.data && meRes.data.user) {
          if (meRes.data.user.address.toLowerCase() === activeAccount.toLowerCase()) {
            setJwtToken(savedToken);
            setUserProfile(meRes.data.user);
            if (meRes.data.user.isDealer) setIsDealer(true);
            if (meRes.data.user.isAdmin) setIsAdmin(true);
          } else {
            localStorage.removeItem("chainart_jwt");
            setJwtToken(null);
          }
        }
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  }, [refreshAccountData, switchNetwork]);

  // Keep callback refs stable for event handlers
  const refreshAccountDataRef = useRef(refreshAccountData);
  useEffect(() => {
    refreshAccountDataRef.current = refreshAccountData;
  }, [refreshAccountData]);

  const disconnectWalletRef = useRef(disconnectWallet);
  useEffect(() => {
    disconnectWalletRef.current = disconnectWallet;
  }, [disconnectWallet]);

  // Listen for MetaMask Events (Account / Network changes) - Run Once on Mount
  useEffect(() => {
    let isMounted = true;

    if (window.ethereum) {
      try {
        if (typeof window.ethereum.setMaxListeners === "function") {
          window.ethereum.setMaxListeners(100);
        }
        if (window.ethereum._events && typeof window.ethereum._events.setMaxListeners === "function") {
          window.ethereum._events.setMaxListeners(100);
        }
      } catch (_) {}

      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      
      // Auto-reconnect if already authorized
      browserProvider.send("eth_accounts", []).then(async (accounts) => {
        if (!isMounted) return;
        if (accounts.length > 0) {
          try {
            const network = await browserProvider.getNetwork();
            const currentSigner = await browserProvider.getSigner();
            if (!isMounted) return;
            setProvider(browserProvider);
            setSigner(currentSigner);
            setAccount(accounts[0]);
            setChainId(Number(network.chainId));
            refreshAccountDataRef.current(accounts[0], browserProvider, currentSigner);

            const savedToken = localStorage.getItem("chainart_jwt");
            if (savedToken) {
              authApi.getMe(savedToken).then((res) => {
                if (!isMounted) return;
                if (res && res.success && res.data && res.data.user) {
                  if (res.data.user.address.toLowerCase() === accounts[0].toLowerCase()) {
                    setJwtToken(savedToken);
                    setUserProfile(res.data.user);
                    if (res.data.user.isDealer) setIsDealer(true);
                    if (res.data.user.isAdmin) setIsAdmin(true);
                  }
                }
              }).catch(() => {});
            }
          } catch (initErr) {
            console.warn("Wallet initialization error:", initErr);
          }
        } else {
          if (isMounted) setProvider(browserProvider);
        }
      }).catch(() => {
        if (isMounted) setProvider(browserProvider);
      });

      const handleAccountsChanged = async (accounts) => {
        if (!isMounted) return;
        if (!accounts || accounts.length === 0) {
          disconnectWalletRef.current();
        } else {
          try {
            const currentSigner = await browserProvider.getSigner();
            if (!isMounted) return;
            setAccount(accounts[0]);
            setSigner(currentSigner);
            refreshAccountDataRef.current(accounts[0], browserProvider, currentSigner);
            localStorage.removeItem("chainart_jwt");
            setJwtToken(null);
            setUserProfile(null);
          } catch (accErr) {
            console.warn("Accounts changed handling error:", accErr);
          }
        }
      };

      const handleChainChanged = (newChainId) => {
        if (!isMounted) return;
        const id = parseInt(newChainId, 16);
        setChainId(id);
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        isMounted = false;
        if (window.ethereum && window.ethereum.removeListener) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
          window.ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    } else {
      setProvider(getReadOnlyProvider());
      return () => {
        isMounted = false;
      };
    }
  }, [getReadOnlyProvider]);

  const value = useMemo(() => ({
    account,
    isConnected: Boolean(account),
    chainId,
    balance,
    isConnecting,
    isAuthenticating,
    isAuthenticated,
    jwtToken,
    userProfile,
    isDealer,
    isAdmin,
    signer,
    provider,
    isCorrectNetwork,
    connectWallet,
    disconnectWallet,
    loginWithSignature,
    switchNetwork,
    refreshAccountData,
    getReadOnlyProvider,
  }), [
    account,
    chainId,
    balance,
    isConnecting,
    isAuthenticating,
    isAuthenticated,
    jwtToken,
    userProfile,
    isDealer,
    isAdmin,
    signer,
    provider,
    isCorrectNetwork,
    connectWallet,
    disconnectWallet,
    loginWithSignature,
    switchNetwork,
    refreshAccountData,
    getReadOnlyProvider,
  ]);

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}
