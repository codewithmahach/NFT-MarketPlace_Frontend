import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import confetti from "canvas-confetti";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [txModal, setTxModal] = useState({
    isOpen: false,
    status: "idle", // 'idle' | 'pending' | 'success' | 'error'
    title: "",
    message: "",
    txHash: "",
    actionLabel: "",
    onRetry: null,
  });

  // Show a standard toast
  const showToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Transaction Lifecycle helpers
  const showTxPending = useCallback((title = "Processing Transaction...", message = "Please confirm the transaction in MetaMask and wait for blockchain confirmation.") => {
    setTxModal({
      isOpen: true,
      status: "pending",
      title,
      message,
      txHash: "",
      onRetry: null,
    });
  }, []);

  const showTxSuccess = useCallback((title = "Transaction Confirmed!", message = "Your transaction has been successfully confirmed on Sepolia.", txHash = "") => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#ff3877", "#38bdf8", "#a855f7", "#10b981"],
      });
    } catch {
      // Ignore if canvas-confetti is not loaded
    }

    setTxModal({
      isOpen: true,
      status: "success",
      title,
      message,
      txHash,
      onRetry: null,
    });
  }, []);

  const showTxError = useCallback((title = "Transaction Failed", error = "", onRetry = null) => {
    let cleanMessage = "An error occurred while interacting with the smart contract.";

    if (typeof error === "string") {
      cleanMessage = error;
    } else if (error && typeof error === "object") {
      const errStr = String(error.message || "") + " " + String(error.reason || "") + " " + String(error.shortMessage || "");
      if (error.code === 4001 || error.code === "ACTION_REJECTED" || errStr.toLowerCase().includes("user rejected") || errStr.toLowerCase().includes("rejected")) {
        cleanMessage = "Transaction was cancelled / rejected in MetaMask.";
      } else if (error.reason) {
        cleanMessage = error.reason;
      } else if (error.shortMessage) {
        cleanMessage = error.shortMessage;
      } else if (error.info?.error?.message) {
        cleanMessage = error.info.error.message;
      } else if (error.message) {
        cleanMessage = error.message.length > 200 ? error.message.slice(0, 200) + "..." : error.message;
      }
    }

    setTxModal({
      isOpen: true,
      status: "error",
      title,
      message: cleanMessage,
      txHash: error?.transactionHash || "",
      onRetry,
    });
  }, []);

  const closeTxModal = useCallback(() => {
    setTxModal((prev) => ({ ...prev, isOpen: false, status: "idle" }));
  }, []);

  const value = useMemo(() => ({
    toasts,
    showToast,
    removeToast,
    txModal,
    showTxPending,
    showTxSuccess,
    showTxError,
    closeTxModal,
  }), [
    toasts,
    showToast,
    removeToast,
    txModal,
    showTxPending,
    showTxSuccess,
    showTxError,
    closeTxModal,
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}
