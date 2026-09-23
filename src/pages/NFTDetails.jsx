import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ShieldCheck, 
  ShoppingBag, 
  Gavel, 
  Clock, 
  Layers, 
  ExternalLink, 
  Heart, 
  ArrowLeft,
  Award,
  Loader2,
  Tag,
  PlusCircle,
  Boxes
} from 'lucide-react';
import { formatETH, shortenAddress, resolveIPFS } from '../utils/formatters';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import { getCategoryFallbackImage } from '../config/constants';
import CountdownTimer from '../components/common/CountdownTimer';
import Badge from '../components/common/Badge';
import BuyModal from '../components/marketplace/BuyModal';
import BidModal from '../components/auction/BidModal';
import CreateListingModal from '../components/marketplace/CreateListingModal';
import CreateAuctionModal from '../components/auction/CreateAuctionModal';
import { useWeb3 } from '../context/Web3Context';
import { nftApi } from '../services/api';

const NFTDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { account, isConnected, isDealer, isAdmin } = useWeb3();

  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [isAuctionModalOpen, setIsAuctionModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'provenance', 'royalties'

  const fetchNFTDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await nftApi.getNFTById(id);
      if (res && res.success && res.data && res.data.nft) {
        const item = res.data.nft;
        const activeListing = res.data.activeListing || item.activeListing;
        const activeAuction = res.data.activeAuction || item.activeAuction;

        const isListingActive = !!activeListing && activeListing.isActive !== false;
        const isAuctionActive = !!activeAuction && !activeAuction.settled && !activeAuction.cancelled;

        const price = isListingActive
          ? (activeListing.priceInEth || activeListing.price || '0')
          : isAuctionActive
          ? (activeAuction.highestBidInEth || activeAuction.startPriceInEth || '0')
          : '0';

        setNft({
          id: item.tokenId || item.id,
          tokenId: item.tokenId || item.id,
          name: item.title || `Luxury Asset #${item.tokenId}`,
          title: item.title || `Luxury Asset #${item.tokenId}`,
          description: item.description || 'Authentic luxury asset tokenized on ChainArt with verifiable provenance and on-chain royalty guarantee.',
          category: item.category ? (item.category.charAt(0).toUpperCase() + item.category.slice(1)) : 'Luxury',
          image: item.image || '/images/placeholder.jpg',
          price: price,
          priceInEth: price,
          highestBid: isAuctionActive ? (activeAuction.highestBidInEth || activeAuction.highestBid) : null,
          startPrice: isAuctionActive ? (activeAuction.startPriceInEth || activeAuction.startingPriceInEth) : null,
          endTime: isAuctionActive ? activeAuction.endTime : null,
          listingId: isListingActive ? (activeListing.listingId || activeListing.id) : null,
          auctionId: isAuctionActive ? (activeAuction.auctionId || activeAuction.id) : null,
          isListed: isListingActive,
          isAuction: isAuctionActive,
          availableSupply: isListingActive ? activeListing.quantity : (item.mintedSupply || item.initialSupply || 1),
          maxSupply: item.maxSupply || 10,
          creator: item.creator,
          seller: isListingActive ? activeListing.seller : (isAuctionActive ? activeAuction.seller : item.creator),
          royaltyBps: item.royaltyFeeBps || item.royaltyBps || 500,
          paymentToken: isListingActive ? activeListing.paymentToken : null,
        });
      } else {
        setNft(null);
      }
    } catch (err) {
      console.warn('Error loading NFT details:', err);
      setNft(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchNFTDetails();
  }, [fetchNFTDetails]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading Asset Details from Chain...</p>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-2xl font-black text-slate-900">Luxury Asset Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested token does not exist or has not yet been indexed from the Sepolia network.
        </p>
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Explore</span>
        </Link>
      </div>
    );
  }

  const isAuction = nft.isAuction;
  const isListed = nft.isListed;
  const imageUrl = resolveIPFS(nft.image, nft.category);

  // Check if current user is the owner / dealer / admin who can list this asset
  const isOwnerOrDealer = isConnected && (
    (account && nft.creator && account.toLowerCase() === nft.creator.toLowerCase()) ||
    (account && nft.seller && account.toLowerCase() === nft.seller.toLowerCase()) ||
    isDealer ||
    isAdmin
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-pink-600 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Market</span>
      </button>

      {/* Main Grid: Left Media & Right Purchase Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Col: High-Res Asset Media (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-white border border-pink-100 shadow-lg group">
            <img
              src={imageUrl}
              alt={nft.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = getCategoryFallbackImage(nft.category);
              }}
            />
            {/* Top Badges */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <Badge variant="cyan" size="md" className="backdrop-blur-md bg-white/90 font-bold shadow-sm">
                {nft.category}
              </Badge>
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`w-9 h-9 rounded-xl backdrop-blur-md flex items-center justify-center transition-all cursor-pointer ${
                  isLiked
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                    : 'bg-white/90 text-slate-500 hover:text-rose-500'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Auction Timer Overlay */}
            {isAuction && nft.endTime && (
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/85 backdrop-blur-md rounded-2xl p-3 text-white border border-white/10 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-pink-400 animate-pulse" />
                  <span className="text-xs font-semibold text-slate-300">Auction ends in:</span>
                </div>
                <CountdownTimer targetTimestamp={nft.endTime} />
              </div>
            )}
          </div>

          {/* Quick Contract Verification Pill */}
          <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-pink-100 flex items-center justify-between text-xs text-slate-500 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>ERC-1155 Verified Luxury Asset</span>
            </div>
            <a
              href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESSES.ChainArtNFT}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-pink-600 hover:underline flex items-center gap-1"
            >
              <span>{shortenAddress(CONTRACT_ADDRESSES.ChainArtNFT)}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Right Col: Details & Action Box (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-pink-600 bg-pink-100/70 px-2.5 py-0.5 rounded-full">
                {nft.category} Collection
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                Token ID #{nft.id}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 leading-tight">
              {nft.name}
            </h1>

            {/* Creator / Dealer Bar */}
            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                  D
                </div>
                <div className="text-xs">
                  <span className="text-slate-400 block text-[10px]">Verified Dealer</span>
                  <span className="font-mono font-bold text-slate-700">{shortenAddress(nft.creator || nft.seller)}</span>
                </div>
              </div>

              <div className="h-6 w-px bg-slate-200" />

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs">
                  <span className="text-slate-400 block text-[10px]">Supply Available</span>
                  <span className="font-bold text-slate-700">{nft.availableSupply} / {nft.maxSupply} Editions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Execution Card */}
          <div className="bg-gradient-to-br from-pink-50/80 via-purple-50/60 to-white p-6 rounded-3xl border border-pink-200/80 shadow-md space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {isAuction ? 'Current Highest Bid' : isListed ? 'Fixed Purchase Price' : 'Market Status'}
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-slate-900 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    {isAuction
                      ? formatETH(nft.highestBid || nft.startPrice)
                      : isListed
                      ? formatETH(nft.price)
                      : 'Unlisted'}
                  </span>
                  {(isListed || isAuction) && (
                    <span className="text-sm font-bold text-slate-500">
                      ETH (Sepolia)
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {isAuction ? (
                  <button
                    onClick={() => setIsBidModalOpen(true)}
                    className="px-8 py-3.5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-pink-200 hover:shadow-pink-300 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Gavel className="w-4 h-4" />
                    <span>Place Bid Now</span>
                  </button>
                ) : isListed ? (
                  <button
                    onClick={() => setIsBuyModalOpen(true)}
                    className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm rounded-2xl shadow-lg hover:shadow-slate-300 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Buy with Loyalty Cashback</span>
                  </button>
                ) : isOwnerOrDealer ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsListingModalOpen(true)}
                      className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>List for Fixed Sale</span>
                    </button>
                    <button
                      onClick={() => setIsAuctionModalOpen(true)}
                      className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Gavel className="w-3.5 h-3.5" />
                      <span>Launch Auction</span>
                    </button>
                  </div>
                ) : (
                  <button
                    disabled
                    className="px-6 py-3.5 bg-slate-100 text-slate-500 font-bold text-xs rounded-2xl border border-slate-200 cursor-not-allowed flex items-center gap-1.5"
                  >
                    <Boxes className="w-3.5 h-3.5 text-slate-400" />
                    <span>In Dealer Vault (Unlisted)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Loyalty Guarantee Banner */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3 border border-pink-200/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-slate-700">
                  Earn on-chain loyalty cashback points & milestones on purchase
                </span>
              </div>
              <span className="text-[11px] font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded">
                Tier Progress
              </span>
            </div>
          </div>

          {/* Tabbed Metadata & Activity */}
          <div className="bg-white rounded-3xl border border-pink-100 overflow-hidden shadow-sm">
            {/* Tabs Header */}
            <div className="flex border-b border-pink-100 bg-slate-50/50 p-2 gap-2">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'details'
                    ? 'bg-white text-pink-600 shadow-xs border border-pink-100'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Item Overview & Specs
              </button>
              <button
                onClick={() => setActiveTab('royalties')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'royalties'
                    ? 'bg-white text-pink-600 shadow-xs border border-pink-100'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ERC-2981 Royalties
              </button>
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'details' && (
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Description</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {nft.description}
                  </p>
                </div>

                <div className="pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Luxury Attributes</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-pink-50/40 rounded-xl border border-pink-100 text-xs">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Category</span>
                      <span className="font-extrabold text-slate-800">{nft.category}</span>
                    </div>
                    <div className="p-3 bg-pink-50/40 rounded-xl border border-pink-100 text-xs">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Authenticity</span>
                      <span className="font-extrabold text-slate-800">Verified Dealer Certificate</span>
                    </div>
                    <div className="p-3 bg-pink-50/40 rounded-xl border border-pink-100 text-xs">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Token Standard</span>
                      <span className="font-extrabold text-slate-800">ERC-1155 Multi-Token</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Royalties */}
            {activeTab === 'royalties' && (
              <div className="p-6 space-y-3 text-xs text-slate-600">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-cyan-500" />
                  <span>ERC-2981 Standard Royalty Compliance</span>
                </div>
                <p>
                  This NFT implements standard ERC-2981 on-chain royalty calculation. The original dealer/creator receives exactly <strong>{(nft.royaltyBps / 100).toFixed(1)}% ({nft.royaltyBps} basis points)</strong> of all secondary market sales automatically.
                </p>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 font-mono text-[11px]">
                  <span>Royalty Receiver: {nft.creator || '0x041F913a616362e67CdcE5d476F6BDeC7776f309'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Modals */}
      {isListed && (
        <BuyModal
          isOpen={isBuyModalOpen}
          onClose={() => {
            setIsBuyModalOpen(false);
            fetchNFTDetails();
          }}
          listing={nft}
        />
      )}
      {isAuction && (
        <BidModal
          isOpen={isBidModalOpen}
          onClose={() => {
            setIsBidModalOpen(false);
            fetchNFTDetails();
          }}
          auction={nft}
        />
      )}
      <CreateListingModal
        isOpen={isListingModalOpen}
        onClose={() => {
          setIsListingModalOpen(false);
          fetchNFTDetails();
        }}
        nft={nft}
      />
      <CreateAuctionModal
        isOpen={isAuctionModalOpen}
        onClose={() => {
          setIsAuctionModalOpen(false);
          fetchNFTDetails();
        }}
        nft={nft}
      />
    </div>
  );
};

export default NFTDetails;
