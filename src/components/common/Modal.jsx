import React, { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = "md",
  maxWidth 
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  const chosenWidth = maxWidth || sizeClasses[size] || "max-w-lg";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`relative w-full ${chosenWidth} bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-pink-100 max-h-[90vh] overflow-y-auto transform transition-all animate-scaleUp`}
      >
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-pink-100">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Modal;
