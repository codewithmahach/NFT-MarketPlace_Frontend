import React, { useState, useEffect, useCallback } from 'react';
import { Gavel, Clock, ShieldCheck, RefreshCw, Loader2 } from 'lucide-react';
import CategoryFilter from '../components/nft/CategoryFilter';
import NFTGrid from '../components/nft/NFTGrid';
import BidModal from '../components/auction/BidModal';
import { auctionApi } from '../services/api';

const Auctions = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAuctions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory !== 'All') {
        params.category = selectedCategory.toLowerCase();
      }
      const res = await auctionApi.getAuctions(params);
      if (res && res.success && res.data) {
        const rawAuctions = res.data.auctions || res.data || [];
        const formatted = rawAuctions.map((a) => ({
          id: a.auctionId || a.id || a.tokenId,
          auctionId: a.auctionId || a.id,
          tokenId: a.tokenId,
          name: a.nft?.title || a.title || `Auction Item #${a.tokenId}`,
          title: a.nft?.title || a.title || `Auction Item #${a.tokenId}`,
          description: a.nft?.description || '',
          category: a.nft?.category ? (a.nft.category.charAt(0).toUpperCase() + a.nft.category.slice(1)) : 'Luxury',
          image: a.nft?.image || a.image || '/images/placeholder.jpg',
          highestBid: a.highestBidInEth || a.startPriceInEth || '0',
          highestBidInEth: a.highestBidInEth || a.startPriceInEth || '0',
          startPrice: a.startPriceInEth || '0',
          startPriceInEth: a.startPriceInEth || '0',
          endTime: a.endTime,
          seller: a.seller,
          highestBidder: a.highestBidder,
          isListed: false,
          isAuction: true,
          availableSupply: 1,
          maxSupply: a.nft?.maxSupply || 1,
        }));
        setAuctions(formatted);
      } else {
        setAuctions([]);
      }
    } catch (err) {
      console.warn('Error fetching live auctions:', err);
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  const handleQuickBid = (nft) => {
    setSelectedNFT(nft);
    setIsBidModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-pink-600 font-bold text-xs uppercase tracking-wider">
          <Gavel className="w-4 h-4" />
          <span>Decentralized English Auctions</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
          Live Luxury Auctions
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          Bid on rare, one-of-a-kind luxury collectibles. Equipped with anti-sniping protection and safe pull-payment escrow refunds.
        </p>
      </div>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-pink-100 shadow-sm flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <h4 className="font-bold text-slate-800">10-Min Anti-Sniping</h4>
            <p className="text-slate-500 mt-0.5">Bids in final 10 mins extend the auction clock by 10 mins.</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-pink-100 shadow-sm flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <h4 className="font-bold text-slate-800">100% Escrow Refunds</h4>
            <p className="text-slate-500 mt-0.5">Outbid funds remain available for 1-click withdrawal anytime.</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-pink-100 shadow-sm flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <h4 className="font-bold text-slate-800">Verified Smart Contract</h4>
            <p className="text-slate-500 mt-0.5">Automated NFT transfer and payment distribution on settlement.</p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-2xl border border-pink-100 p-3 shadow-sm">
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Grid or Loader */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading Live Auctions...</p>
        </div>
      ) : (
        <NFTGrid
          items={auctions}
          onQuickBid={handleQuickBid}
          emptyTitle="No Active Auctions Yet"
          emptyDescription="There are currently no active luxury auctions. Verified brand dealers can launch reserve price English auctions directly from their Dealer Studio."
          emptyActionLabel="View All Categories"
          onEmptyAction={() => setSelectedCategory('All')}
        />
      )}

      {/* Bid Modal */}
      {selectedNFT && (
        <BidModal
          isOpen={isBidModalOpen}
          onClose={() => {
            setIsBidModalOpen(false);
            setSelectedNFT(null);
            fetchAuctions();
          }}
          auction={selectedNFT}
        />
      )}
    </div>
  );
};

export default Auctions;
