import React from "react";
import { useNotification } from "../../context/NotificationContext";
import { Loader2, CheckCircle2, XCircle, ExternalLink, X, RotateCcw } from "lucide-react";

export function TxModal() {
  const { txModal, closeTxModal } = useNotification();
  if (!txModal.isOpen) return null;

  const explorerUrl = txModal.txHash ? `https://sepolia.etherscan.io/tx/${txModal.txHash}` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-pink-100 transform transition-all animate-scaleUp">
        {/* Close Button */}
        {txModal.status !== "pending" && (
          <button
            onClick={closeTxModal}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Status Icon */}
        <div className="flex flex-col items-center text-center">
          {txModal.status === "pending" && (
            <div className="w-20 h-20 rounded-full bg-pink-50 flex items-center justify-center mb-5 ring-8 ring-pink-50/50">
              <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
            </div>
          )}

          {txModal.status === "success" && (
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-5 ring-8 ring-emerald-50/50">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
          )}

          {txModal.status === "error" && (
            <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-5 ring-8 ring-rose-50/50">
              <XCircle className="w-10 h-10 text-rose-500" />
            </div>
          )}

          {/* Title & Message */}
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {txModal.title}
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            {txModal.message}
          </p>

          {/* Explorer Link */}
          {explorerUrl && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-pink-600 bg-pink-50 hover:bg-pink-100 rounded-full mb-6 transition-colors"
            >
              <span>View on Sepolia Etherscan</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full">
            {txModal.status === "error" && txModal.onRetry && (
              <button
                onClick={() => {
                  closeTxModal();
                  txModal.onRetry();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            )}

            {txModal.status !== "pending" && (
              <button
                onClick={closeTxModal}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white font-semibold hover:opacity-95 transition-opacity shadow-md shadow-pink-500/20 cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TxModal;
