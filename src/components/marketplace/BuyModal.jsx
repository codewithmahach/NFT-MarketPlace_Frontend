import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useMarketplace } from '../../hooks/useMarketplace';
import { useWeb3 } from '../../context/Web3Context';
import { useNotification } from '../../context/NotificationContext';
import { formatETH, resolveIPFS } from '../../utils/formatters';
import { ShoppingBag, Sparkles, AlertCircle, Info, ShieldCheck } from 'lucide-react';
import { ethers } from 'ethers';

import { marketplaceApi } from '../../services/api';

const BuyModal = ({ isOpen, onClose, listing, onPurchaseSuccess }) => {
  const { isConnected, connectWallet } = useWeb3();
  const { buyNFT, buyNFTWithToken, loading } = useMarketplace();
  const { triggerConfetti } = useNotification();

  const [quantity, setQuantity] = useState(1);
  const [selectedCurrency, setSelectedCurrency] = useState(listing?.currency || 0); // 0 = ETH, 1 = USDT

  if (!listing) return null;

  const maxAvailable = listing.amount || listing.availableSupply || 1;
  const pricePerUnitEth = parseFloat(listing.price || '0');
  const totalPriceEth = (pricePerUnitEth * quantity).toFixed(4);
  const marketFeeEst = (parseFloat(totalPriceEth) * 0.025).toFixed(4);
  const royaltyFeeEst = (parseFloat(totalPriceEth) * ((listing.royaltyBps || 500) / 10000)).toFixed(4);
  const estimatedPoints = Math.floor(parseFloat(totalPriceEth) * 100);

  const handleBuy = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    try {
      let res;
      if (selectedCurrency === 1) {
        // USDT Token Purchase
        res = await buyNFTWithToken(listing.listingId, quantity);
      } else {
        // ETH Purchase
        res = await buyNFT(listing.listingId, quantity, totalPriceEth);
      }

      if (res && res.success) {
        if (res.txHash) {
          marketplaceApi.verifyPurchase(res.txHash).catch(() => {});
        }
        triggerConfetti();
        if (onPurchaseSuccess) onPurchaseSuccess(res);
        onClose();
      }
    } catch (err) {
      console.error('Buy error:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete NFT Purchase"
      size="md"
    >
      <div className="space-y-5">
        {/* Item Summary Card */}
        <div className="flex items-center gap-4 p-3 bg-pink-50/50 rounded-2xl border border-pink-100">
          <img
            src={resolveIPFS(listing.image, listing.category)}
            alt={listing.name}
            className="w-16 h-16 rounded-xl object-cover border border-pink-200 shadow-sm"
          />
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold text-pink-600 uppercase tracking-wider">
              {listing.category || 'Luxury NFT'}
            </span>
            <h4 className="font-bold text-slate-800 text-sm truncate">{listing.name}</h4>
            <p className="text-xs text-slate-500 font-mono">Token ID: #{listing.tokenId || listing.id}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Price each</span>
            <span className="font-extrabold text-slate-900 text-sm">
              {formatETH(listing.price)} ETH
            </span>
          </div>
        </div>

        {/* Quantity Selector for Partial Purchase (ERC-1155) */}
        {maxAvailable > 1 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
              <label>Purchase Quantity</label>
              <span className="text-slate-400">Available: {maxAvailable} editions</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max={maxAvailable}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full accent-pink-500 cursor-pointer"
              />
              <span className="w-12 text-center py-1.5 px-2 bg-slate-100 rounded-lg text-sm font-bold text-slate-800">
                {quantity}
              </span>
            </div>
          </div>
        )}

        {/* Payment Currency Switcher */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 block">Payment Method</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedCurrency(0)}
              className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                selectedCurrency === 0
                  ? 'border-pink-500 bg-pink-50/80 shadow-sm ring-2 ring-pink-400/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <p className="font-bold text-xs text-slate-800">Ethereum (ETH)</p>
                <p className="text-[10px] text-slate-500">Native Sepolia ETH</p>
              </div>
              <span className="text-base">Ξ</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCurrency(1)}
              className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                selectedCurrency === 1
                  ? 'border-pink-500 bg-pink-50/80 shadow-sm ring-2 ring-pink-400/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <p className="font-bold text-xs text-slate-800">Mock USDT</p>
                <p className="text-[10px] text-slate-500">ERC-20 Stablecoin</p>
              </div>
              <span className="text-base font-bold text-emerald-600">$</span>
            </button>
          </div>
        </div>

        {/* Cost & Fee Transparency Breakdown */}
        <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs border border-slate-100">
          <div className="flex justify-between text-slate-600">
            <span>Item Subtotal ({quantity} {quantity === 1 ? 'edition' : 'editions'})</span>
            <span className="font-semibold text-slate-800">{totalPriceEth} ETH</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span className="flex items-center gap-1">
              Marketplace Fee (2.5%)
              <Info className="w-3 h-3 text-slate-400" title="Split into protocol revenue & loyalty rewards pool" />
            </span>
            <span>Included</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span className="flex items-center gap-1">
              Creator Royalty ({((listing.royaltyBps || 500) / 100).toFixed(1)}%)
              <ShieldCheck className="w-3 h-3 text-cyan-500" title="ERC-2981 On-chain Royalties paid to original artist" />
            </span>
            <span>Included</span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-bold text-sm text-slate-900">
            <span>Total Payment</span>
            <span className="text-base text-pink-600">{totalPriceEth} ETH</span>
          </div>
        </div>

        {/* Loyalty Points Banner */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-3 border border-pink-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-pink-500 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Earn Loyalty Rewards</p>
              <p className="text-[10px] text-slate-500">Tier progression + automated reward distribution</p>
            </div>
          </div>
          <span className="text-xs font-extrabold text-pink-600 bg-white px-2.5 py-1 rounded-full border border-pink-200 shadow-sm">
            +{estimatedPoints} Points
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={handleBuy}
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl font-extrabold text-white text-sm bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 shadow-lg shadow-pink-200 hover:shadow-pink-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              <span>Confirm Purchase for {totalPriceEth} ETH</span>
            </>
          )}
        </button>
      </div>
    </Modal>
  );
};

export default BuyModal;
