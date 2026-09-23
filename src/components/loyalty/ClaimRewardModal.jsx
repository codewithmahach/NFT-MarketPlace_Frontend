import React from 'react';
import Modal from '../common/Modal';
import { useLoyalty } from '../../hooks/useLoyalty';
import { useNotification } from '../../context/NotificationContext';
import { Award, Sparkles, CheckCircle2, Gift, TrendingUp } from 'lucide-react';
import { formatETH } from '../../utils/formatters';

import { loyaltyApi } from '../../services/api';

const ClaimRewardModal = ({ isOpen, onClose, loyaltyData, onClaimSuccess }) => {
  const { claimReward, loading } = useLoyalty();
  const { triggerConfetti } = useNotification();

  if (!loyaltyData) return null;

  const { points = 0, tier = 0, purchaseCount = 0, pendingRewards = '0' } = loyaltyData;
  const isEligible = purchaseCount > 0 && purchaseCount % 10 === 0;

  const handleClaim = async () => {
    const res = await claimReward();
    if (res && res.success) {
      if (res.txHash) {
        loyaltyApi.verifyClaim(res.txHash).catch(() => {});
      }
      triggerConfetti();
      if (onClaimSuccess) onClaimSuccess(res);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Claim Loyalty Milestone Reward"
      size="md"
    >
      <div className="space-y-5 text-center">
        {/* Glowing Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-pink-400 via-purple-500 to-indigo-500 p-0.5 shadow-xl shadow-pink-200">
          <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
            <Gift className="w-8 h-8 text-pink-500 animate-bounce" />
          </div>
        </div>

        <div>
          <h3 className="font-extrabold text-slate-800 text-lg">
            Loyalty Milestone Bonus
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Every 10 verified marketplace purchases unlocks an automated protocol cash reward.
          </p>
        </div>

        {/* Milestone Card */}
        <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-cyan-50 p-4 rounded-2xl border border-pink-100/80 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-600">Purchase Milestone</span>
            <span className="font-extrabold text-pink-600 bg-white px-2.5 py-0.5 rounded-full border border-pink-200">
              {purchaseCount} Purchases
            </span>
          </div>

          <div className="w-full bg-white/80 rounded-full h-3.5 p-0.5 border border-pink-200">
            <div
              className="bg-gradient-to-r from-pink-500 to-purple-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(((purchaseCount % 10) / 10) * 100, 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-500 font-medium">
            <span>Current: {purchaseCount % 10}/10 completed</span>
            <span>Reward Target: 10/10</span>
          </div>
        </div>

        {/* Reward Value */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div className="text-left">
            <span className="text-xs text-slate-400 block font-semibold uppercase">Reward Payout</span>
            <span className="text-xs text-slate-600 font-medium">ChainArt Loyalty Treasury</span>
          </div>
          <div className="text-right">
            <span className="font-extrabold text-lg text-emerald-600">
              +0.05 ETH
            </span>
            <span className="text-[10px] text-slate-400 block">+ Loyalty Points</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleClaim}
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl font-extrabold text-white text-sm bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 shadow-lg shadow-pink-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Award className="w-4 h-4" />
              <span>Claim Loyalty Reward</span>
            </>
          )}
        </button>
      </div>
    </Modal>
  );
};

export default ClaimRewardModal;
