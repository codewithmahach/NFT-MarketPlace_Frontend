import React from "react";

export function NFTCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-3 border border-pink-100 shadow-sm animate-pulse">
      <div className="w-full aspect-square rounded-2xl bg-slate-200 mb-3"></div>
      <div className="px-2 space-y-2">
        <div className="h-4 bg-slate-200 rounded-md w-3/4"></div>
        <div className="h-3 bg-slate-100 rounded-md w-1/2"></div>
        <div className="pt-2 flex justify-between items-center border-t border-slate-50">
          <div className="h-4 bg-slate-200 rounded-md w-1/3"></div>
          <div className="h-6 bg-slate-200 rounded-lg w-16"></div>
        </div>
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <NFTCardSkeleton key={idx} />
      ))}
    </div>
  );
}

const LoadingSkeleton = ({ type = "card", count = 1 }) => {
  if (type === "grid") return <GridSkeleton count={count} />;
  return <NFTCardSkeleton />;
};

export default LoadingSkeleton;
