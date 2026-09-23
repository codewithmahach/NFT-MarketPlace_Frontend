import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useAuction } from '../../hooks/useAuction';
import { useWeb3 } from '../../context/Web3Context';
import { useNotification } from '../../context/NotificationContext';
import { formatETH, resolveIPFS } from '../../utils/formatters';
import CountdownTimer from '../common/CountdownTimer';
import { Gavel, Clock, ShieldCheck, AlertCircle, ArrowUpRight, Sparkles, RefreshCw } from 'lucide-react';
import { ethers } from 'ethers';

import { auctionApi } from '../../services/api';

const BidModal = ({ isOpen, onClose, auction, onBidSuccess }) => {
  const { isConnected, connectWallet } = useWeb3();
  const { placeBid, loading } = useAuction();
  const { triggerConfetti } = useNotification();

  if (!auction) return null;

  const currentBid = parseFloat(auction.highestBid || auction.startPrice || '0.01');
  // Smart contract enforces min increment (typically 5% or minimum step)
  const minIncrement = currentBid === 0 ? 0 : Math.max(currentBid * 0.05, 0.001);
  const minRequiredBid = (currentBid + (auction.highestBid ? minIncrement : 0)).toFixed(4);

  const [bidAmount, setBidAmount] = useState(minRequiredBid);

  const handleQuickAdd = (addAmount) => {
    const nextVal = (parseFloat(bidAmount || minRequiredBid) + addAmount).toFixed(4);
    setBidAmount(nextVal);
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    if (!isConnected) {
      await connectWallet();
      return;
    }

    if (parseFloat(bidAmount) < parseFloat(minRequiredBid)) {
      return;
    }

    const res = await placeBid(auction.auctionId || auction.id, bidAmount);
    if (res && res.success) {
      if (res.txHash) {
        auctionApi.verifyBid(res.txHash).catch(() => {});
      }
      triggerConfetti();
      if (onBidSuccess) onBidSuccess(res);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Place a Bid on Auction"
      size="md"
    >
      <form onSubmit={handleBidSubmit} className="space-y-4">
        {/* Auction Item Info */}
        <div className="flex items-center gap-3 p-3 bg-pink-50/50 rounded-2xl border border-pink-100">
          <img
            src={resolveIPFS(auction.image, auction.category)}
            alt={auction.name}
            className="w-16 h-16 rounded-xl object-cover border border-pink-200"
          />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600 bg-pink-100/70 px-2 py-0.5 rounded-md">
              {auction.category || 'Luxury Asset'}
            </span>
            <h4 className="font-bold text-slate-800 text-sm truncate mt-0.5">{auction.name}</h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5 text-pink-500" />
              <CountdownTimer targetTimestamp={auction.endTime} compact />
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block font-medium">Highest Bid</span>
            <span className="font-extrabold text-slate-900 text-sm bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
              {formatETH(currentBid)} ETH
            </span>
          </div>
        </div>

        {/* Anti-Sniping Alert */}
        <div className="bg-cyan-50/70 rounded-xl p-3 border border-cyan-200/80 flex items-start gap-2.5 text-xs text-cyan-800">
          <ShieldCheck className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
          <p>
            <strong className="font-bold">Anti-Sniping Protection Active:</strong> Bids placed in the final 10 minutes automatically extend the auction countdown by 10 minutes to ensure fair competition.
          </p>
        </div>

        {/* Bid Input */}
        <div>
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
            <label>Your Bid (ETH)</label>
            <span className="text-pink-600 font-bold">Min required: {minRequiredBid} ETH</span>
          </div>
          <div className="relative">
            <input
              type="number"
              step="0.0001"
              min={minRequiredBid}
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              required
              className="w-full pl-9 pr-20 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-extrabold text-slate-900 focus:bg-white focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
              placeholder={minRequiredBid}
            />
            <span className="absolute left-3.5 top-3.5 text-slate-400 font-bold">Ξ</span>
            <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400">ETH</span>
          </div>

          {/* Quick Increment Buttons */}
          <div className="flex items-center gap-2 mt-2">
            {[0.01, 0.05, 0.1].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleQuickAdd(amt)}
                className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-pink-100 hover:text-pink-700 rounded-lg text-xs font-bold text-slate-600 transition-colors"
              >
                +{amt} ETH
              </button>
            ))}
          </div>
        </div>

        {/* Escrow & Pull-Payment Guarantee */}
        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 space-y-1 border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-700 font-bold">
            <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
            <span>Pull-Payment Escrow Security</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            If outbid, your funds are securely reserved in the pull-payment balance. You can withdraw 100% of your ETH at any time from your Collector Dashboard.
          </p>
        </div>

        {/* Submit Bid Button */}
        <button
          type="submit"
          disabled={loading || parseFloat(bidAmount) < parseFloat(minRequiredBid)}
          className="w-full py-3.5 px-4 rounded-xl font-extrabold text-white text-sm bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 shadow-lg shadow-pink-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Gavel className="w-4 h-4" />
              <span>Submit Bid for {bidAmount} ETH</span>
            </>
          )}
        </button>
      </form>
    </Modal>
  );
};

export default BidModal;
