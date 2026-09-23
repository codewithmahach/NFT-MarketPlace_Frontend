import { ethers } from "ethers";

export function shortenAddress(address, chars = 4) {
  if (!address || address === ethers.ZeroAddress) return "0x000...0000";
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

export function formatETH(amount, decimals = 4) {
  if (amount === undefined || amount === null || amount === "") return "0";
  if (typeof amount === "bigint") {
    try {
      const formatted = ethers.formatEther(amount);
      const num = parseFloat(formatted);
      return num.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
      });
    } catch {
      return "0";
    }
  }
  const num = parseFloat(amount);
  if (isNaN(num)) return "0";
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function formatEtherAmount(weiAmount, decimals = 4) {
  return formatETH(weiAmount, decimals);
}

export function formatUSDT(rawAmount, decimals = 2) {
  if (rawAmount === undefined || rawAmount === null || rawAmount === "") return "0";
  if (typeof rawAmount === "bigint") {
    try {
      const formatted = ethers.formatUnits(rawAmount, 18);
      const num = parseFloat(formatted);
      return num.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
      });
    } catch {
      return "0";
    }
  }
  const num = parseFloat(rawAmount);
  if (isNaN(num)) return "0";
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function formatUsdtAmount(rawAmount, decimals = 2) {
  return formatUSDT(rawAmount, decimals);
}

import { getCategoryFallbackImage } from "../config/constants";

export function parseTimestampInSeconds(val) {
  if (!val) return 0;
  if (val instanceof Date) return Math.floor(val.getTime() / 1000);
  if (typeof val === "bigint") return Number(val);
  if (typeof val === "number") {
    return val > 1e11 ? Math.floor(val / 1000) : Math.floor(val);
  }
  if (typeof val === "string") {
    if (/^\d+$/.test(val.trim())) {
      const num = Number(val.trim());
      return num > 1e11 ? Math.floor(num / 1000) : Math.floor(num);
    }
    const parsed = Date.parse(val);
    if (!isNaN(parsed)) {
      return Math.floor(parsed / 1000);
    }
  }
  return 0;
}

export function formatTimestamp(timestampVal) {
  const sec = parseTimestampInSeconds(timestampVal);
  if (!sec) return "N/A";
  const date = new Date(sec * 1000);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getTimeRemaining(endTimeVal) {
  const targetSec = parseTimestampInSeconds(endTimeVal);
  if (!targetSec) {
    return { isEnded: true, hours: 0, minutes: 0, seconds: 0, formatted: "Ended" };
  }
  const now = Math.floor(Date.now() / 1000);
  const diff = targetSec - now;
  if (diff <= 0) {
    return { isEnded: true, hours: 0, minutes: 0, seconds: 0, formatted: "Ended" };
  }
  const days = Math.floor(diff / (24 * 3600));
  const hours = Math.floor((diff % (24 * 3600)) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  let formatted = "";
  if (days > 0) formatted += `${days}d `;
  formatted += `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;

  return { isEnded: false, days, hours, minutes, seconds, formatted };
}

export function resolveIPFS(uri, category = "") {
  if (!uri || typeof uri !== "string" || uri.trim() === "") {
    return getCategoryFallbackImage(category);
  }
  const cleanUri = uri.trim();

  // 1. Data URI (Base64 image)
  if (cleanUri.startsWith("data:image/")) {
    return cleanUri;
  }

  const liveBackend = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

  // 2. Relative uploads path
  if (cleanUri.startsWith("/uploads/")) {
    return `${liveBackend}${cleanUri}`;
  }

  // 3. Localhost ports from Render migration (e.g. http://localhost:10000/uploads/...)
  if (cleanUri.includes("localhost:10000/uploads/") || cleanUri.includes("localhost:5000/uploads/")) {
    if (liveBackend && !liveBackend.includes("localhost")) {
      return cleanUri.replace(/http:\/\/localhost:\d+/, liveBackend);
    }
  }

  // 4. IPFS URI
  if (cleanUri.startsWith("ipfs://")) {
    const hash = cleanUri.replace("ipfs://", "");
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  }

  // 5. Category static fallback (only if strictly matches /images/categories/)
  if (cleanUri.startsWith("/images/categories/") || cleanUri.startsWith("/images/")) {
    return getCategoryFallbackImage(category);
  }

  return cleanUri;
}
