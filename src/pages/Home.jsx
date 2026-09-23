import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ShoppingBag, 
  Gavel, 
  Award, 
  ArrowRight, 
  ShieldCheck, 
  Flame, 
  TrendingUp, 
  Layers, 
  CheckCircle2,
  Gem,
  Building2,
  Loader2
} from 'lucide-react';
import CategoryFilter from '../components/nft/CategoryFilter';
import NFTGrid from '../components/nft/NFTGrid';
import BuyModal from '../components/marketplace/BuyModal';
import BidModal from '../components/auction/BidModal';
import { nftApi, orderApi } from '../services/api';
import { formatETH, shortenAddress } from '../utils/formatters';

const Home = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);

  const [nfts, setNfts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [nftRes] = await Promise.all([
        nftApi.getAllNFTs(),
      ]);

      if (nftRes && nftRes.success && nftRes.data) {
        const rawNFTs = nftRes.data.nfts || nftRes.data || [];
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
      console.warn('Error loading home data:', err);
      setNfts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter items based on category
  const filteredItems = selectedCategory === 'All'
    ? nfts
    : nfts.filter(item => item.category.toLowerCase() === selectedCategory.toLowerCase());

  const liveAuctions = nfts.filter(item => item.isAuction).slice(0, 4);
  const featuredDrops = nfts.filter(item => item.isListed && !item.isAuction).slice(0, 4);

  const handleQuickBuy = (nft) => {
    setSelectedNFT(nft);
    setIsBuyModalOpen(true);
  };

  const handleQuickBid = (nft) => {
    setSelectedNFT(nft);
    setIsBidModalOpen(true);
  };

  return (
    <div className="space-y-16 pb-12 crypto-watermark-overlay">
      {/* 1. Hero Section with Glow */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-20">
        {/* Glow backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-pink-300/40 via-purple-300/30 to-cyan-300/40 blur-3xl rounded-full -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-pink-200/90 shadow-sm text-xs font-bold text-pink-600">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-pink-500" />
            <span>Next-Gen ERC-1155 Luxury Multi-Token Marketplace</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-tight">
            Discover, Collect & Trade <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
              High-Value Real Assets
            </span>
          </h1>

          {/* Tagline */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
            <strong>Mint • List • Buy • Sell • Bid • Earn Rewards.</strong> Built on Ethereum Sepolia using verified <strong>ERC-1155 Multi-Token standard</strong> with built-in ERC-2981 secondary royalties and automated buyer loyalty cashbacks.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/explore"
              className="px-8 py-3.5 rounded-2xl font-extrabold text-white text-sm bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 shadow-xl shadow-pink-200 hover:shadow-pink-300 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/auctions"
              className="px-7 py-3.5 rounded-2xl font-extrabold text-slate-800 text-sm bg-white/95 hover:bg-pink-50/80 border border-pink-200/90 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Gavel className="w-4 h-4 text-pink-500" />
              <span>Live English Auctions</span>
            </Link>

            <Link
              to="/apply-dealership"
              className="px-6 py-3.5 rounded-2xl font-bold text-purple-700 text-sm bg-purple-50/90 hover:bg-purple-100 border border-purple-200 transition-all flex items-center gap-2"
            >
              <Building2 className="w-4 h-4 text-purple-600" />
              <span>Apply for Dealership</span>
            </Link>
          </div>

          {/* Key Stats Pill */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-slate-700 text-xs sm:text-sm font-semibold">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-500" />
              <span>ERC-1155 Verified UUPS Smart Contracts</span>
            </div>
            <div className="flex items-center gap-2">
              <Gem className="w-4 h-4 text-pink-500" />
              <span>Real-Time Sepolia Blockchain State</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Pull-Payment Escrow Security</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Live Activity Feed Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10 backdrop-blur-md rounded-2xl p-4 border border-pink-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <Flame className="w-5 h-5 text-rose-500 animate-bounce" />
            <span className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
              Sepolia Live Network:
            </span>
          </div>
          <div className="flex-1 text-xs font-medium text-slate-700 flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-xl border border-pink-100 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-500 font-semibold">Chain ID: 11155111 (Sepolia)</span>
              <span className="text-slate-300">•</span>
              <span className="text-pink-600 font-bold">{nfts.length} Total Registered Collectibles</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Live Auctions Showcase */}
      {liveAuctions.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-pink-600 font-bold text-xs uppercase tracking-wider mb-1">
                <Gavel className="w-4 h-4" />
                <span>Anti-Sniping Live Bidding</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Featured Live Auctions
              </h2>
            </div>
            <Link
              to="/auctions"
              className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 group"
            >
              <span>View All Live Auctions ({liveAuctions.length})</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <NFTGrid
            items={liveAuctions}
            onQuickBid={handleQuickBid}
            onQuickBuy={handleQuickBuy}
          />
        </section>
      )}

      {/* 4. Explore by Luxury Category */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 text-pink-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4" />
              <span>Curated Catalogue</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Explore Luxury Categories
            </h2>
          </div>

          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Syncing Live Marketplace...</p>
          </div>
        ) : (
          <NFTGrid
            items={filteredItems.slice(0, 8)}
            onQuickBuy={handleQuickBuy}
            onQuickBid={handleQuickBid}
            emptyTitle="No Items in this Category"
            emptyDescription="There are currently no listed luxury items in this category."
            emptyActionLabel="View All Categories"
            onEmptyAction={() => setSelectedCategory('All')}
          />
        )}

        <div className="text-center pt-6">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white hover:bg-pink-50 text-pink-600 border border-pink-200 rounded-2xl font-bold text-sm shadow-sm hover:shadow-md transition-all"
          >
            <span>Explore All {filteredItems.length} Luxury Listings</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 5. Loyalty Rewards Promo Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-pink-500/20 via-purple-500/20 to-transparent blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-500/20 border border-pink-400/40 text-pink-300 text-xs font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>ChainArt Loyalty Program</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight">
              Earn Points & Automated ETH Rewards on Every Purchase & Sale
            </h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Every marketplace trade accrues on-chain loyalty points. Progress from Normal to Bronze, Silver, and Gold tiers. Verified dealers unlock a <strong>2.0% volume cash reward</strong> distributed directly in ETH every 10 successful sales.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                to="/loyalty"
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
              >
                View Your Loyalty Dashboard
              </Link>
              <Link
                to="/about"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all"
              >
                Learn How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Action Modals */}
      {selectedNFT && (
        <>
          <BuyModal
            isOpen={isBuyModalOpen}
            onClose={() => {
              setIsBuyModalOpen(false);
              setSelectedNFT(null);
              fetchData();
            }}
            listing={selectedNFT}
          />
          <BidModal
            isOpen={isBidModalOpen}
            onClose={() => {
              setIsBidModalOpen(false);
              setSelectedNFT(null);
              fetchData();
            }}
            auction={selectedNFT}
          />
        </>
      )}
    </div>
  );
};

export default Home;
