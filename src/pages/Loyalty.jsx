import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Sparkles, 
  Gift, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  Zap, 
  Crown,
  Coins,
  ArrowRight
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { useLoyalty } from '../hooks/useLoyalty';
import ClaimRewardModal from '../components/loyalty/ClaimRewardModal';
import { LOYALTY_TIERS } from '../config/constants';
import { formatETH } from '../utils/formatters';
import { loyaltyApi } from '../services/api';

const Loyalty = () => {
  const { account, isConnected, connectWallet } = useWeb3();
  const { fetchUserLoyalty } = useLoyalty();

  const [loyaltyData, setLoyaltyData] = useState({
    points: 340,
    tier: 1, // Bronze
    purchaseCount: 4,
    pendingRewards: '0.01'
  });
  const [milestoneInfo, setMilestoneInfo] = useState(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  useEffect(() => {
    if (isConnected && account) {
      loadLoyalty();
    }
  }, [isConnected, account]);

  const loadLoyalty = async () => {
    try {
      const res = await loyaltyApi.getProfile(account);
      if (res && res.success && res.data && res.data.profile) {
        const p = res.data.profile;
        const tierIdx = p.currentTier === 'Platinum' ? 3 : p.currentTier === 'Gold' ? 2 : p.currentTier === 'Silver' ? 1 : 0;
        setLoyaltyData({
          points: p.totalPoints,
          tier: tierIdx,
          purchaseCount: p.completedSalesCount,
          pendingRewards: res.data.milestone ? res.data.milestone.claimableRewardEth : '0.01',
        });
        if (res.data.milestone) {
          setMilestoneInfo(res.data.milestone);
        }
        return;
      }
    } catch (err) {
      console.warn("Backend loyalty fetch fallback:", err);
    }

    const data = await fetchUserLoyalty(account);
    if (data) setLoyaltyData(data);
  };

  const currentTierName = LOYALTY_TIERS[loyaltyData.tier]?.name || 'Bronze';
  const nextTierPoints = loyaltyData.tier === 0 ? 100 : loyaltyData.tier === 1 ? 500 : loyaltyData.tier === 2 ? 1000 : 2000;
  const progressPercent = Math.min((loyaltyData.points / nextTierPoints) * 100, 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-white/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold border border-white/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ChainArt VIP Loyalty Rewards</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Earn Points & Claim Cash Rewards On Every Trade
          </h1>

          <p className="text-pink-100 text-sm sm:text-base leading-relaxed">
            Trade luxury NFTs to earn loyalty points, climb tier levels, and claim automated protocol rewards directly from our smart contract treasury every 10 purchases.
          </p>
        </div>
      </div>

      {/* User Loyalty Status & Milestone Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Tier Progress (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-pink-100 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Current Tier</span>
              <div className="flex items-center gap-2 mt-1">
                <Crown className="w-6 h-6 text-pink-500" />
                <h3 className="text-2xl font-black text-slate-900">{currentTierName} Tier</h3>
              </div>
            </div>
            <div className="bg-pink-50 px-4 py-2 rounded-2xl border border-pink-100 text-right">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">Accumulated Points</span>
              <span className="text-xl font-extrabold text-pink-600">{loyaltyData.points} PTS</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>{loyaltyData.points} pts</span>
              <span>Next Tier: {nextTierPoints} pts</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-4 p-0.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 h-full rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Earn ~100 points for every 1.0 ETH traded on ChainArt.
            </p>
          </div>

          {/* Milestone 10-Sale Progress */}
          <div className="p-5 bg-gradient-to-r from-pink-50/70 via-purple-50/50 to-cyan-50/70 rounded-2xl border border-pink-200/70 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-pink-600" />
                <span className="font-bold text-slate-800">10-Purchase Milestone Reward</span>
              </div>
              <span className="font-extrabold text-pink-600 bg-white px-2.5 py-0.5 rounded-full border border-pink-200">
                {loyaltyData.purchaseCount % 10}/10 Done
              </span>
            </div>

            <div className="w-full bg-white rounded-full h-2.5 overflow-hidden border border-pink-200">
              <div
                className="bg-pink-500 h-full rounded-full"
                style={{ width: `${((loyaltyData.purchaseCount % 10) / 10) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500">
                Reward: <strong>0.05 ETH</strong> from treasury
              </span>
              <button
                onClick={() => setIsClaimModalOpen(true)}
                className="px-4 py-1.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-pink-300 transition-all cursor-pointer"
              >
                Claim Reward
              </button>
            </div>
          </div>
        </div>

        {/* Right: How to Earn Points (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-pink-100 p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base">How to Earn Rewards</h3>
          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-2xl flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 font-bold">
                1
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Buy Verified Luxury NFTs</h4>
                <p className="text-slate-500 mt-0.5">Every purchase automatically credits loyalty points proportional to ETH value.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold">
                2
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Reach 10 Purchases</h4>
                <p className="text-slate-500 mt-0.5">The loyalty contract unlocks a 0.05 ETH cash claim directly to your wallet.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center shrink-0 font-bold">
                3
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Unlock VIP Dealer Drops</h4>
                <p className="text-slate-500 mt-0.5">Silver & Gold tier collectors get early whitelist access to limited luxury editions.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Breakdown Comparison Table */}
      <div className="bg-white rounded-3xl border border-pink-100 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-pink-100">
          <h3 className="font-extrabold text-slate-900 text-lg">Loyalty Tier Privileges</h3>
          <p className="text-xs text-slate-500">Tier requirements and benefits programmed into the ChainArt smart contract.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-pink-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4">Tier Level</th>
                <th className="p-4">Points Required</th>
                <th className="p-4">Fee Discount</th>
                <th className="p-4">Milestone Bonus</th>
                <th className="p-4">Special Drops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {LOYALTY_TIERS.map((tier) => (
                <tr key={tier.id} className="hover:bg-pink-50/20 transition-colors">
                  <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600" />
                    <span>{tier.name}</span>
                  </td>
                  <td className="p-4">{tier.minPoints} pts</td>
                  <td className="p-4 text-pink-600 font-bold">{tier.discountBps / 100}% off</td>
                  <td className="p-4 font-semibold text-emerald-600">0.05 ETH per 10 sales</td>
                  <td className="p-4 text-xs text-slate-500">{tier.name === 'Gold' ? 'Exclusive 1/1 VIP Drops' : tier.name === 'Silver' ? 'Early Whitelist' : 'Public Access'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Claim Modal */}
      <ClaimRewardModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        loyaltyData={loyaltyData}
      />
    </div>
  );
};

export default Loyalty;
