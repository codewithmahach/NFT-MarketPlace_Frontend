import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  ShoppingBag, 
  Gavel, 
  Sparkles,
  Gem,
  Loader2
} from 'lucide-react';
import CategoryFilter from '../components/nft/CategoryFilter';
import NFTGrid from '../components/nft/NFTGrid';
import BuyModal from '../components/marketplace/BuyModal';
import BidModal from '../components/auction/BidModal';
import { nftApi, marketplaceApi, auctionApi } from '../services/api';

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [listingType, setListingType] = useState('all'); // 'all', 'fixed', 'auction'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'price_low', 'price_high'
  
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNFTs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedCategory !== 'All') params.category = selectedCategory.toLowerCase();
      if (listingType === 'fixed') params.status = 'listed';
      else if (listingType === 'auction') params.status = 'auction';
      
      if (sortBy === 'price_low') params.sortBy = 'price_asc';
      else if (sortBy === 'price_high') params.sortBy = 'price_desc';
      else params.sortBy = 'newest';

      const res = await nftApi.getAllNFTs(params);
      if (res && res.success && res.data) {
        const rawNFTs = res.data.nfts || res.data || [];
        const formatted = rawNFTs.map((item) => {
          const isListingActive = !!item.activeListing;
          const isAuctionActive = !!item.activeAuction;
          const price = item.activeListing ? item.activeListing.priceInEth : (item.activeAuction ? item.activeAuction.highestBidInEth || item.activeAuction.startPriceInEth : '0');
          
          return {
            id: item.tokenId || item.id,
            tokenId: item.tokenId || item.id,
            name: item.title || `Luxury Asset #${item.tokenId}`,
            title: item.title || `Luxury Asset #${item.tokenId}`,
            description: item.description || '',
            category: item.category ? (item.category.charAt(0).toUpperCase() + item.category.slice(1)) : 'Luxury',
            image: item.image || '/images/placeholder.jpg',
            price: price,
            priceInEth: price,
            highestBid: item.activeAuction ? item.activeAuction.highestBidInEth : null,
            startPrice: item.activeAuction ? item.activeAuction.startPriceInEth : null,
            endTime: item.activeAuction ? item.activeAuction.endTime : null,
            listingId: item.activeListing ? item.activeListing.listingId : null,
            auctionId: item.activeAuction ? item.activeAuction.auctionId : null,
            isListed: isListingActive,
            isAuction: isAuctionActive,
            availableSupply: item.activeListing ? item.activeListing.quantity : (item.mintedSupply || 1),
            maxSupply: item.maxSupply || 10,
            creator: item.creator,
            seller: item.activeListing ? item.activeListing.seller : (item.activeAuction ? item.activeAuction.seller : item.creator),
          };
        });
        setNfts(formatted);
      } else {
        setNfts([]);
      }
    } catch (err) {
      console.warn('Error fetching live NFTs for explore:', err);
      setNfts([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, listingType, sortBy]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchNFTs();
    }, 250);
    return () => clearTimeout(timeout);
  }, [fetchNFTs]);

  // Compute category counts from live inventory
  const categoryCounts = useMemo(() => {
    const counts = { All: nfts.length };
    nfts.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [nfts]);

  const handleQuickBuy = (nft) => {
    setSelectedNFT(nft);
    setIsBuyModalOpen(true);
  };

  const handleQuickBid = (nft) => {
    setSelectedNFT(nft);
    setIsBidModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 crypto-watermark-overlay">
      {/* Header Banner with Luxury Ambient Glow */}
      <div className="relative overflow-hidden bg-gradient-to-r from-pink-500/15 via-purple-500/10 to-cyan-500/15 rounded-3xl p-6 sm:p-8 border border-pink-200/80 shadow-sm backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 text-pink-600 text-xs font-bold border border-pink-200 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-pink-500" />
              <span>ERC-1155 Multi-Token Catalogue</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
              Explore Luxury Collectibles
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl font-medium">
              Browse authentic luxury assets verified on Ethereum Sepolia. Filter across high-end categories, active English auctions, and fixed-price listings with on-chain royalties.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-pink-200 shadow-sm self-start md:self-auto">
            <Gem className="w-5 h-5 text-pink-500" />
            <div className="text-xs">
              <span className="font-bold text-slate-900 block">{nfts.length} Live Items</span>
              <span className="text-slate-400 text-[10px]">Real-Time Blockchain Index</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-pink-200/90 p-4 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search Luxury Items, Brands, Watches, Vehicles, Jewelry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all"
            />
          </div>

          {/* Listing Type Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setListingType('all')}
              className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                listingType === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setListingType('fixed')}
              className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                listingType === 'fixed'
                  ? 'bg-white text-pink-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Fixed Price</span>
            </button>
            <button
              onClick={() => setListingType('auction')}
              className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                listingType === 'auction'
                  ? 'bg-white text-purple-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Gavel className="w-3.5 h-3.5" />
              <span>Live Auctions</span>
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-pink-500 focus:outline-none"
            >
              <option value="newest">Recently Minted</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Categories Bar with Counts */}
        <div className="pt-2 border-t border-slate-100">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            counts={categoryCounts}
          />
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
        <span>
          Showing <strong>{nfts.length}</strong> luxury collectibles in <strong>{selectedCategory}</strong>
        </span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-pink-600 hover:underline font-bold"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Grid or Loader */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Syncing Live Collectibles...</p>
        </div>
      ) : (
        <NFTGrid
          items={nfts}
          onQuickBuy={handleQuickBuy}
          onQuickBid={handleQuickBid}
          emptyTitle="No Luxury Items Found"
          emptyDescription="There are currently no luxury NFTs matching your query. Verified brand dealers can mint new authentic items from the Dealer Studio."
          emptyActionLabel="Reset All Filters"
          onEmptyAction={() => {
            setSelectedCategory('All');
            setSearchQuery('');
            setListingType('all');
          }}
        />
      )}

      {/* Action Modals */}
      {selectedNFT && (
        <>
          <BuyModal
            isOpen={isBuyModalOpen}
            onClose={() => {
              setIsBuyModalOpen(false);
              setSelectedNFT(null);
              fetchNFTs();
            }}
            listing={selectedNFT}
          />
          <BidModal
            isOpen={isBidModalOpen}
            onClose={() => {
              setIsBidModalOpen(false);
              setSelectedNFT(null);
              fetchNFTs();
            }}
            auction={selectedNFT}
          />
        </>
      )}
    </div>
  );
};

export default Explore;
