import React from "react";
import { PackageOpen } from "lucide-react";
import { Link } from "react-router-dom";

export function EmptyState({
  title = "No Items Found",
  description = "There are currently no items matching your criteria.",
  actionLabel,
  actionLink,
  onAction,
  icon: Icon = PackageOpen,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-pink-100 shadow-sm my-6">
      <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center mb-4 text-pink-400">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      
      {actionLink && (
        <Link
          to={actionLink}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-semibold hover:opacity-95 shadow-md shadow-pink-200 transition-all"
        >
          {actionLabel || "Explore Marketplace"}
        </Link>
      )}

      {onAction && !actionLink && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-semibold hover:opacity-95 shadow-md shadow-pink-200 transition-all cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
