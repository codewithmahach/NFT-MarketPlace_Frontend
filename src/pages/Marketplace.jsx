import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Sparkles, Tag, ArrowUpDown, Loader2 } from 'lucide-react';
import CategoryFilter from '../components/nft/CategoryFilter';
import NFTGrid from '../components/nft/NFTGrid';
import BuyModal from '../components/marketplace/BuyModal';
import { marketplaceApi, nftApi } from '../services/api';

const Marketplace = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        category: selectedCategory !== 'All' ? selectedCategory.toLowerCase() : undefined,
        sortBy,
      };
      const res = await marketplaceApi.getListings(params);
      if (res && res.success && res.data) {
        const rawListings = res.data.listings || res.data || [];
        const formatted = rawListings.map((l) => ({
          id: l.listingId || l.id || l.tokenId,
          listingId: l.listingId || l.id,
          tokenId: l.tokenId,
          name: l.title || l.name || (l.nft && l.nft.title) || `Luxury Asset #${l.tokenId}`,
          title: l.title || l.name || (l.nft && l.nft.title) || `Luxury Asset #${l.tokenId}`,
          category: l.category || (l.nft && l.nft.category) || 'Luxury',
          image: l.image || (l.nft && l.nft.image) || '/images/placeholder.jpg',
          price: l.priceInEth || l.price || '0',
          priceInEth: l.priceInEth || l.price || '0',
          currency: l.paymentToken && l.paymentToken !== '0x0000000000000000000000000000000000000000' ? 'USDT' : 'ETH',
          quantity: l.quantity || 1,
          seller: l.seller,
          isListed: true,
          isAuction: false,
          availableSupply: l.quantity || 1,
          maxSupply: (l.nft && l.nft.maxSupply) || l.quantity || 10,
        }));
        setListings(formatted);
      } else {
        setListings([]);
      }
    } catch (err) {
      console.warn('Error fetching live marketplace listings:', err);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, sortBy]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleQuickBuy = (nft) => {
    setSelectedNFT(nft);
    setIsBuyModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-pink-600 font-bold text-xs uppercase tracking-wider mb-1">
            <ShoppingBag className="w-4 h-4" />
            <span>Fixed Price Market</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
            Buy Luxury Assets Instantly
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Fixed-price authentic editions with partial quantity purchase support and instant settlement.
          </p>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:border-pink-500"
          >
            <option value="newest">Recently Listed</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
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
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading Live Listings...</p>
        </div>
      ) : (
        <NFTGrid
          items={listings}
          onQuickBuy={handleQuickBuy}
          emptyTitle="No Fixed-Price Listings Yet"
          emptyDescription="There are currently no active fixed-price luxury NFTs on the marketplace. Verified brand dealers can mint and list authentic editions directly from their Dealer Studio."
          emptyActionLabel="View All Categories"
          onEmptyAction={() => setSelectedCategory('All')}
        />
      )}

      {/* Buy Modal */}
      {selectedNFT && (
        <BuyModal
          isOpen={isBuyModalOpen}
          onClose={() => {
            setIsBuyModalOpen(false);
            setSelectedNFT(null);
            fetchListings();
          }}
          listing={selectedNFT}
        />
      )}
    </div>
  );
};

export default Marketplace;
