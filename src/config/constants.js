export const CATEGORIES = [
  "All",
  "Watches",
  "Cars",
  "Jewelry",
  "Handbags",
  "Shoes",
  "Art",
  "Antiques",
  "Spirits",
  "Fashion",
];

export const NFT_CATEGORIES = [
  { id: "all", name: "All Categories", icon: "LayoutGrid" },
  { id: "Watches", name: "Watches", icon: "Watch", color: "from-amber-500 to-orange-400" },
  { id: "Cars", name: "Cars", icon: "Car", color: "from-blue-500 to-cyan-400" },
  { id: "Jewelry", name: "Jewelry", icon: "Gem", color: "from-yellow-400 to-amber-500" },
  { id: "Handbags", name: "Handbags", icon: "ShoppingBag", color: "from-fuchsia-500 to-pink-400" },
  { id: "Shoes", name: "Shoes", icon: "Footprints", color: "from-emerald-500 to-teal-400" },
  { id: "Art", name: "Art", icon: "Palette", color: "from-purple-500 to-indigo-400" },
  { id: "Antiques", name: "Antiques", icon: "Trophy", color: "from-amber-600 to-yellow-600" },
  { id: "Spirits", name: "Spirits", icon: "Sparkles", color: "from-rose-500 to-amber-500" },
  { id: "Fashion", name: "Fashion", icon: "Boxes", color: "from-pink-500 to-rose-400" },
];

export const LISTING_DURATIONS = [
  { label: "3 Days", days: 3, seconds: 3 * 24 * 60 * 60, feeETH: "0.001", feeWei: "1000000000000000" },
  { label: "7 Days", days: 7, seconds: 7 * 24 * 60 * 60, feeETH: "0.002", feeWei: "2000000000000000" },
  { label: "10 Days", days: 10, seconds: 10 * 24 * 60 * 60, feeETH: "0.003", feeWei: "3000000000000000" },
  { label: "30 Days", days: 30, seconds: 30 * 24 * 60 * 60, feeETH: "0.005", feeWei: "5000000000000000" },
];

export const AUCTION_DURATIONS = [
  { label: "3 Days", days: 3, seconds: 3 * 24 * 60 * 60 },
  { label: "7 Days", days: 7, seconds: 7 * 24 * 60 * 60 },
  { label: "10 Days", days: 10, seconds: 10 * 24 * 60 * 60 },
  { label: "30 Days", days: 30, seconds: 30 * 24 * 60 * 60 },
];

export const LOYALTY_TIERS = [
  { id: 0, name: "Normal", minPoints: 0, maxPoints: 99, discountBps: 0, badgeColor: "bg-slate-100 text-slate-700 border-slate-300", perk: "Base rewards eligibility" },
  { id: 1, name: "Bronze", minPoints: 100, maxPoints: 249, discountBps: 50, badgeColor: "bg-amber-100 text-amber-800 border-amber-300", perk: "Bronze badge + priority auctions" },
  { id: 2, name: "Silver", minPoints: 250, maxPoints: 499, discountBps: 100, badgeColor: "bg-slate-200 text-slate-800 border-slate-400", perk: "Silver badge + listing fee discounts" },
  { id: 3, name: "Gold", minPoints: 500, maxPoints: Infinity, discountBps: 200, badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-400", perk: "Gold VIP status + maximum rewards" },
];

export const PAYMENT_TOKENS = {
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    icon: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=035",
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    address: "0xd077a400968890eacc75cdc901f0356c943e4fdb",
    decimals: 18,
    icon: "https://cryptologos.cc/logos/tether-usdt-logo.svg?v=035",
  },
};

export const DEFAULT_CATEGORY_IMAGES = {
  Watches: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
  Cars: "https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&w=1200&q=80",
  Jewelry: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80",
  Handbags: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80",
  Art: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80",
  Shoes: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1200&q=80",
  Spirits: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=1200&q=80",
  Antiques: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
  Fashion: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1200&q=80",
  Luxury: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
};

export const getCategoryFallbackImage = (category) => {
  if (!category) return DEFAULT_CATEGORY_IMAGES.Luxury;
  const key = Object.keys(DEFAULT_CATEGORY_IMAGES).find(
    (k) => k.toLowerCase() === category.toLowerCase()
  );
  return key ? DEFAULT_CATEGORY_IMAGES[key] : DEFAULT_CATEGORY_IMAGES.Luxury;
};
