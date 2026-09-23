import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useMarketplace } from '../../hooks/useMarketplace';
import { useNFT } from '../../hooks/useNFT';
import { useWeb3 } from '../../context/Web3Context';
import { CONTRACT_ADDRESSES } from '../../config/contracts';
import { LISTING_DURATIONS } from '../../config/constants';
import { Tag, Calendar, Layers, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { marketplaceApi } from '../../services/api';
import { shortenAddress } from '../../utils/formatters';

const CreateListingModal = ({ isOpen, onClose, nft, onListingSuccess }) => {
  const { account, isDealer, isAdmin, jwtToken } = useWeb3();
  const { createListing, loading: marketLoading } = useMarketplace();
  const { setApprovalForAll, loading: nftLoading } = useNFT();

  const [price, setPrice] = useState('0.05');
  const [amount, setAmount] = useState('1');
  const [durationDays, setDurationDays] = useState(7);
  const [currency, setCurrency] = useState(0); // 0 = ETH, 1 = USDT

  if (!nft) return null;

  const maxAmount = nft.availableSupply || nft.balance || nft.supply || 1;
  const loading = marketLoading || nftLoading;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!price || parseFloat(price) <= 0) return;

    const res = await createListing(
      nft.id || nft.tokenId,
      amount,
      price,
      durationDays,
      currency
    );

    if (res && res.success) {
      if (res.listingId) {
        try {
          await marketplaceApi.syncListing(
            {
              listingId: res.listingId,
              seller: account,
              tokenId: nft.id || nft.tokenId,
              quantity: amount,
              price: price,
              duration: durationDays * 86400,
              txHash: res.txHash || res.hash || "",
            },
            jwtToken
          );
        } catch (syncErr) {
          console.warn("Background listing sync warning:", syncErr);
        }
      }
      if (onListingSuccess) onListingSuccess(res);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="List NFT for Fixed Sale"
      size="md"
    >
      <form onSubmit={handleCreate} className="space-y-4">
        {/* Dealer Verification Check */}
        {!isDealer && !isAdmin && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">
                  Connected Account ({shortenAddress(account)}) is not a verified dealer.
                </p>
                <p className="text-amber-700 text-[11px] mt-0.5 leading-relaxed">
                  Only verified brand dealers can list luxury NFTs for sale. Please switch in MetaMask to your verified dealer account (<strong>Kashee's Brand</strong> or <strong>Aura Kicks Atelier</strong>) to list this asset.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-200/60">
              <Link
                to="/apply-dealership"
                onClick={onClose}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs flex items-center gap-1"
              >
                Apply for Dealership
              </Link>
            </div>
          </div>
        )}

        {/* NFT Preview */}
        <div className="flex items-center gap-3 p-3 bg-pink-50/50 rounded-2xl border border-pink-100">
          <img
            src={nft.image}
            alt={nft.name}
            className="w-14 h-14 rounded-xl object-cover border border-pink-200"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80';
            }}
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-800 text-sm truncate">{nft.name}</h4>
            <p className="text-xs text-slate-500">Token ID: #{nft.id || nft.tokenId} • Available: {maxAmount}</p>
          </div>
        </div>

        {/* Quantity to List */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Quantity to List (Max: {maxAmount})
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              max={maxAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
            <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        {/* Price Per Edition */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Price Per Edition
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 relative">
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
                placeholder="0.05"
              />
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <select
              value={currency}
              onChange={(e) => setCurrency(parseInt(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 px-3 py-2.5 focus:bg-white focus:border-pink-500 focus:outline-none"
            >
              <option value={0}>ETH (Sepolia)</option>
              <option value={1}>Mock USDT</option>
            </select>
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Listing Duration
          </label>
          <div className="grid grid-cols-4 gap-2">
            {LISTING_DURATIONS.map((d) => (
              <button
                key={d.days}
                type="button"
                onClick={() => setDurationDays(d.days)}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  durationDays === d.days
                    ? 'border-pink-500 bg-pink-50 text-pink-700 ring-2 ring-pink-200'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary note */}
        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 space-y-1">
          <div className="flex justify-between">
            <span>Marketplace Fee (Treasury)</span>
            <span className="font-semibold text-slate-700">2.5% on sale</span>
          </div>
          <div className="flex justify-between">
            <span>Dealer Milestone Cash Reward</span>
            <span className="font-semibold text-pink-600">2.0% volume payout every 10 sales</span>
          </div>
          <div className="flex justify-between">
            <span>Creator Royalty</span>
            <span className="font-semibold text-slate-700">5.0% on secondary sales</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-200">
            <span>Net Proceeds (est.)</span>
            <span className="font-bold text-emerald-600">
              {(parseFloat(price || 0) * parseInt(amount || 1) * 0.925).toFixed(4)} {currency === 1 ? 'USDT' : 'ETH'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <button
            type="submit"
            disabled={loading || (!isDealer && !isAdmin)}
            className="w-full py-3 px-4 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-md shadow-pink-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Tag className="w-4 h-4" />
                <span>List on Marketplace</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateListingModal;
