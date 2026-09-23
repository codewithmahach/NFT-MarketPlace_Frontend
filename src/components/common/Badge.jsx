import React from "react";
import { CheckCircle, ShieldCheck, Sparkles, Award } from "lucide-react";

export function VerifiedBadge({ className = "w-4 h-4 text-pink-500" }) {
  return (
    <span title="Verified Dealer / Collection" className="inline-flex items-center">
      <CheckCircle className={`fill-pink-500 text-white ${className}`} />
    </span>
  );
}

export function TierBadge({ tier = "Normal", className = "" }) {
  const styles = {
    Normal: "bg-slate-100 text-slate-700 border-slate-200",
    Bronze: "bg-amber-50 text-amber-800 border-amber-200",
    Silver: "bg-slate-100 text-slate-800 border-slate-300",
    Gold: "bg-yellow-50 text-yellow-800 border-yellow-300 shadow-sm",
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[tier] || styles.Normal} ${className}`}>
      <Award className="w-3 h-3" />
      <span>{tier}</span>
    </span>
  );
}

export function CategoryBadge({ category = "Other", className = "" }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-md text-slate-800 shadow-sm border border-slate-100 ${className}`}>
      {category}
    </span>
  );
}

const Badge = ({ children, variant = "neutral", size = "sm", className = "" }) => {
  const variants = {
    pink: "bg-pink-50 text-pink-700 border-pink-200",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const sizes = {
    sm: "px-2.5 py-0.5 text-xs",
    md: "px-3 py-1 text-xs",
    lg: "px-3.5 py-1.5 text-sm",
  };

  return (
    <span className={`inline-flex items-center rounded-full font-bold border ${variants[variant] || variants.neutral} ${sizes[size] || sizes.sm} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
