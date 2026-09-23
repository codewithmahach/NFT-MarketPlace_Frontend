import React from "react";
import { useNotification } from "../../context/NotificationContext";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export function ToastContainer() {
  const { toasts, removeToast } = useNotification();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-pink-100 animate-slideInRight"
        >
          <div className="flex items-center gap-3">
            {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
            {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />}
            {toast.type === "info" && <Info className="w-5 h-5 text-sky-500 shrink-0" />}
            <p className="text-sm font-medium text-slate-800">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
