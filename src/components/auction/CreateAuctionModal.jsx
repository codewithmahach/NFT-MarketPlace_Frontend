import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useAuction } from '../../hooks/useAuction';
import { useNFT } from '../../hooks/useNFT';
import { useWeb3 } from '../../context/Web3Context';
import { CONTRACT_ADDRESSES } from '../../config/contracts';
import { AUCTION_DURATIONS } from '../../config/constants';
import { Gavel, Clock, Layers, DollarSign, ShieldAlert, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { auctionApi } from '../../services/api';
import { shortenAddress } from '../../utils/formatters';

const CreateAuctionModal = ({ isOpen, onClose, nft, onAuctionCreated }) => {
  const { account, isDealer, isAdmin, jwtToken } = useWeb3();
  const { createAuction, loading: auctionLoading } = useAuction();
  const { setApprovalForAll, loading: nftLoading } = useNFT();

  const [startPrice, setStartPrice] = useState('0.05');
  const [amount, setAmount] = useState('1');
  const [durationDays, setDurationDays] = useState(3);

  if (!nft) return null;

  const maxAmount = nft.availableSupply || nft.balance || nft.supply || 1;
  const loading = auctionLoading || nftLoading;

  const handleCreateAuction = async (e) => {
    e.preventDefault();
    if (!startPrice || parseFloat(startPrice) <= 0) return;

    const res = await createAuction(
      nft.id || nft.tokenId,
      amount,
      startPrice,
      durationDays
    );

    if (res && res.success) {
      if (res.auctionId) {
        try {
          await auctionApi.syncAuction(
            {
              auctionId: res.auctionId,
              seller: account,
              tokenId: nft.id || nft.tokenId,
              quantity: amount,
              startPrice: startPrice,
              duration: durationDays * 86400,
              txHash: res.txHash || res.hash || "",
            },
            jwtToken
          );
        } catch (syncErr) {
          console.warn("Background auction sync warning:", syncErr);
        }
      }
      if (onAuctionCreated) onAuctionCreated(res);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Live NFT English Auction"
      size="md"
    >
      <form onSubmit={handleCreateAuction} className="space-y-4">
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
                  Only verified brand dealers can launch English auctions. Please switch in MetaMask to your verified dealer account (<strong>Kashee's Brand</strong> or <strong>Aura Kicks Atelier</strong>) to launch this auction.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-200/60">
              <Link
                to="/apply-dealership"
                onClick={onClose}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs"
              >
                Apply for Dealership
              </Link>
            </div>
          </div>
        )}

        {/* NFT Item preview */}
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

        {/* Quantity to Auction */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Quantity to Auction (Max: {maxAmount})
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

        {/* Starting Price */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Starting Bid Price (ETH)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.0001"
              min="0.0001"
              value={startPrice}
              onChange={(e) => setStartPrice(e.target.value)}
              required
              className="w-full pl-9 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
              placeholder="0.05"
            />
            <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">ETH</span>
          </div>
        </div>

        {/* Auction Duration */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Auction Duration
          </label>
          <div className="grid grid-cols-4 gap-2">
            {AUCTION_DURATIONS.map((d) => (
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

        {/* Notice */}
        <div className="p-3 bg-pink-50/70 rounded-xl text-xs text-slate-600 space-y-1 border border-pink-100">
          <p className="font-semibold text-pink-700 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            Auction Terms:
          </p>
          <ul className="list-disc pl-4 text-[11px] text-slate-500 space-y-0.5">
            <li>NFT will be transferred to the Auction contract escrow.</li>
            <li>Anti-sniping 10-minute auto-extension is enabled by default.</li>
            <li>Upon settlement, winner gets NFT and you receive highest bid proceeds.</li>
            <li>Successful sales count toward your <strong>2.0% volume milestone reward</strong>.</li>
          </ul>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || (!isDealer && !isAdmin)}
            className="w-full py-3 px-4 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 shadow-md shadow-pink-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Gavel className="w-4 h-4" />
                <span>Launch Live Auction</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateAuctionModal;
