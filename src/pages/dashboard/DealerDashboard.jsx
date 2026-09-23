import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useWeb3 } from '../../context/Web3Context';
import { useNFT } from '../../hooks/useNFT';
import { useLoyalty } from '../../hooks/useLoyalty';
import { useNotification } from '../../context/NotificationContext';
import MintModal from '../../components/nft/MintModal';
import CreateListingModal from '../../components/marketplace/CreateListingModal';
import CreateAuctionModal from '../../components/auction/CreateAuctionModal';
import ClaimRewardModal from '../../components/loyalty/ClaimRewardModal';
import { shortenAddress, formatETH, resolveIPFS } from '../../utils/formatters';
import { getCategoryFallbackImage } from '../../config/constants';
import { nftApi, dealerApi } from '../../services/api';
import { 
  Sparkles, 
  Layers, 
  Tag, 
  Gavel, 
  Flame, 
  ShieldCheck, 
  Boxes,
  Plus,
  Loader2,
  AlertCircle,
  Award,
  Coins,
  ArrowRight,
  Search,
  Building,
  Globe,
  ExternalLink,
  PackagePlus,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DealerDashboard = () => {
  const { account, isDealer, isAdmin, isConnected, jwtToken } = useWeb3();
  const { mintMore, burnNFT, loading: nftLoading } = useNFT();
  const { fetchUserLoyalty } = useLoyalty();
  const { showToast } = useNotification();

  // Modals state
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [isAuctionModalOpen, setIsAuctionModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  // Supply Replenishment Modal
  const [replenishModalItem, setReplenishModalItem] = useState(null);
  const [replenishAmount, setReplenishAmount] = useState('5');
  const [isReplenishing, setIsReplenishing] = useState(false);

  // View Filter: 'all' = All Marketplace Inventory, 'brand' = My Brand's Tokens
  const [viewFilter, setViewFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [allTokens, setAllTokens] = useState([]);
  const [brandInfo, setBrandInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const [loyaltyData, setLoyaltyData] = useState({
    points: 0,
    validSellerActivities: 0,
    eligibleRewards: 0,
    rewardMilestone: 0,
    pendingRewards: '0.0',
    calculatedMilestoneRewardETH: '0.0',
  });

  // Fetch Brand Info & All NFT Collections
  const fetchDealerNFTs = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    try {
      const [allRes, lData, myAppRes] = await Promise.all([
        nftApi.getAllNFTs({ limit: 100 }),
        fetchUserLoyalty(account).catch(() => null),
        dealerApi.getMyApplication(account).catch(() => null),
      ]);

      if (lData) setLoyaltyData(lData);
      if (myAppRes && myAppRes.success && myAppRes.data?.application) {
        setBrandInfo(myAppRes.data.application);
      } else if (account) {
        // Canonical brand mapping fallback
        if (account.toLowerCase() === '0xd26f32a37bc7039439a51387abf74c127ccdc659') {
          setBrandInfo({ businessName: "Kashee's Brand", category: 'jewelry' });
        } else if (account.toLowerCase() === '0xd172aa950446e954c499fdf8d69abfe452f9f79e') {
          setBrandInfo({ businessName: 'Aura Kicks Atelier', category: 'sneakers' });
        }
      }

      if (allRes && allRes.success && allRes.data) {
        const raw = allRes.data.nfts || allRes.data || [];
        const formatted = raw.map((item) => {
          const totalSup = item.totalSupply || item.initialSupply || 1;
          const maxSup = item.maxSupply || totalSup || 10;
          const royalty = item.royaltyFeeBps || item.royaltyBps || 500;
          
          let ownerBalance = 0;
          if (item.owners && Array.isArray(item.owners)) {
            const matched = item.owners.find(
              (o) => o.address?.toLowerCase() === account?.toLowerCase()
            );
            ownerBalance = matched ? matched.balance : 0;
          } else {
            ownerBalance = totalSup;
          }

          const isMyItem = item.creator?.toLowerCase() === account?.toLowerCase();

          return {
            id: item.tokenId || item.id,
            tokenId: item.tokenId || item.id,
            name: item.title || `Luxury Asset #${item.tokenId}`,
            title: item.title || `Luxury Asset #${item.tokenId}`,
            description: item.description || '',
            category: item.category ? (item.category.charAt(0).toUpperCase() + item.category.slice(1)) : 'Luxury',
            rawCategory: (item.category || 'luxury').toLowerCase(),
            image: item.image || '/images/placeholder.jpg',
            creator: item.creator || '',
            isMyAsset: isMyItem,
            price: item.activeListing ? item.activeListing.priceInEth : '0',
            availableSupply: item.activeListing ? item.activeListing.quantity : (isMyItem ? ownerBalance : totalSup),
            ownerBalance,
            mintedSupply: totalSup,
            initialSupply: item.initialSupply || totalSup,
            maxSupply: maxSup,
            royaltyBps: royalty,
            isListed: Boolean(item.activeListing && item.activeListing.isActive !== false),
            activeListing: item.activeListing,
            isAuction: Boolean(item.activeAuction && item.activeAuction.settled !== true && item.activeAuction.cancelled !== true),
            activeAuction: item.activeAuction,
          };
        });
        setAllTokens(formatted);
      } else {
        setAllTokens([]);
      }
    } catch (err) {
      console.warn('Error fetching dealer collections:', err);
      setAllTokens([]);
    } finally {
      setLoading(false);
    }
  }, [account, fetchUserLoyalty]);

  useEffect(() => {
    if (isConnected && account) {
      fetchDealerNFTs();
    }
  }, [isConnected, account, fetchDealerNFTs]);

  // Execute Supply Replenishment (+ Supply)
  const handleReplenishSupply = async (e) => {
    e.preventDefault();
    if (!replenishModalItem) return;
    const amount = parseInt(replenishAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid positive edition amount to mint.', 'warning');
      return;
    }

    setIsReplenishing(true);
    try {
      // 1. Call Smart Contract mintMore
      const res = await mintMore(replenishModalItem.tokenId, amount);
      if (res && res.success) {
        // 2. Call Backend to sync database supply & balance
        try {
          await nftApi.syncSupply({
            tokenId: replenishModalItem.tokenId,
            addedAmount: amount,
            recipient: account,
          }, jwtToken);
        } catch (syncErr) {
          console.warn('Backend supply sync warning:', syncErr);
        }

        showToast(`Successfully minted ${amount} additional editions for Token #${replenishModalItem.tokenId}!`, 'success');
        setReplenishModalItem(null);
        setReplenishAmount('5');
        fetchDealerNFTs();
      }
    } catch (err) {
      console.error('Supply replenishment failed:', err);
    } finally {
      setIsReplenishing(false);
    }
  };

  // Burn unsold copy
  const handleBurn = async (tokenId) => {
    if (window.confirm(`Are you sure you want to burn 1 unsold edition of Token #${tokenId}? This action is irreversible on Sepolia.`)) {
      const res = await burnNFT(tokenId, 1);
      if (res && res.success) {
        showToast(`1 edition of Token #${tokenId} burned successfully.`, 'info');
        fetchDealerNFTs();
      }
    }
  };

  // Filter Tokens based on active tabs & search
  const myBrandTokens = allTokens.filter((t) => t.isMyAsset);
  const displayedTokens = (viewFilter === 'brand' ? myBrandTokens : allTokens).filter((item) => {
    const matchesCategory = categoryFilter === 'all' || item.rawCategory === categoryFilter.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tokenId.toString().includes(searchQuery) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.creator.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate Accurate KPIs
  const currentDisplayedAll = viewFilter === 'brand' ? myBrandTokens : allTokens;
  const totalAssetsCount = currentDisplayedAll.length;
  const totalEditionsMinted = currentDisplayedAll.reduce((acc, c) => acc + (c.mintedSupply || 0), 0);
  const activeListingsCount = currentDisplayedAll.filter((c) => c.isListed || c.isAuction).length;
  const salesCount = loyaltyData.validSellerActivities || 0;
  const nextMilestoneSalesNeeded = 10 - (salesCount % 10);

  const activeBrandName = brandInfo?.businessName || (account?.toLowerCase() === '0xd26f32a37bc7039439a51387abf74c127ccdc659' ? "Kashee's Brand" : account?.toLowerCase() === '0xd172aa950446e954c499fdf8d69abfe452f9f79e' ? "Aura Kicks Atelier" : "Luxury Brand Dealer");

  return (
    <DashboardLayout
      title="Dealer Studio & Minting Suite"
      subtitle="Exclusive portal for verified luxury brand dealers. Mint multi-category ERC-1155 editions with ERC-2981 royalties, replenish edition stock, and launch direct marketplace listings."
    >
      {/* Non-Dealer Alert if not approved */}
      {!isDealer && !isAdmin && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 text-xs shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">
                Connected Wallet: <span className="font-mono text-amber-900 font-bold">{shortenAddress(account)}</span> is not a verified dealer.
              </p>
              <p className="text-amber-700 text-[11px] mt-0.5 leading-relaxed">
                Minting and listing luxury NFTs on Sepolia requires <strong>DEALER_ROLE</strong> authorization. If you are already a registered dealer, please switch to your verified dealer account in MetaMask (e.g., <strong>Kashee's Brand</strong> or <strong>Aura Kicks Atelier</strong>), or submit a new accreditation application.
              </p>
            </div>
          </div>
          <Link
            to="/apply-dealership"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shrink-0 flex items-center gap-1 shadow-sm self-end sm:self-center"
          >
            <span>Apply for Dealership</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Metric 1: Dealer Role & Brand Identity */}
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-pink-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Brand Partner</span>
              {(isDealer || isAdmin) && (
                <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-full font-bold text-[10px] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-cyan-600" />
                  Verified
                </span>
              )}
            </div>
            <div className="mt-1">
              <h3 className="text-lg font-black text-slate-900 truncate" title={activeBrandName}>
                {activeBrandName}
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{shortenAddress(account)}</p>
            </div>
          </div>
          {(isDealer || isAdmin) && (
            <button
              onClick={() => setIsMintModalOpen(true)}
              className="mt-3 w-full py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-pink-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Mint New Edition</span>
            </button>
          )}
        </div>

        {/* Metric 2: 2.0% Volume Milestone Reward */}
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-pink-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">2% Sales Reward</span>
              <Award className="w-4 h-4 text-pink-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              {loyaltyData.calculatedMilestoneRewardETH > 0 ? `${loyaltyData.calculatedMilestoneRewardETH} ETH` : '2.0% Volume'}
            </h3>
            <p className="text-xs text-pink-600 font-semibold mt-1">
              {salesCount} Total Sales ({nextMilestoneSalesNeeded === 10 ? 'Milestone Ready!' : `${nextMilestoneSalesNeeded} more for next payout`})
            </p>
          </div>
          <button
            onClick={() => setIsClaimModalOpen(true)}
            className="mt-3 w-full py-2 bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Claim 2% Milestone ETH</span>
          </button>
        </div>

        {/* Metric 3: Total Luxury Assets */}
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-pink-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Luxury Assets</span>
              <Boxes className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {totalAssetsCount} {totalAssetsCount === 1 ? 'Collection' : 'Collections'}
            </h3>
            <p className="text-xs text-emerald-600 font-semibold mt-1">
              5.0% On-Chain Royalties Enforced
            </p>
          </div>
          <div className="mt-3 py-1.5 px-3 bg-slate-50 text-slate-600 text-xs font-medium rounded-xl flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-purple-600" />
            <span>Mint Gas Fee: 0.0005 ETH</span>
          </div>
        </div>

        {/* Metric 4: Total Editions Minted */}
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-pink-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Editions Minted</span>
              <Layers className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {totalEditionsMinted} Editions
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {activeListingsCount} active live listings on marketplace
            </p>
          </div>
          <div className="mt-3 py-1.5 px-3 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-xl flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>ERC-1155 UUPS Active</span>
          </div>
        </div>
      </div>

      {/* Main Inventory Hub */}
      <div className="bg-white rounded-2xl border border-pink-100 overflow-hidden shadow-sm">
        {/* Header & View Switcher */}
        <div className="p-5 border-b border-pink-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Luxury Asset Inventory & Dealer Management</h3>
              <p className="text-xs text-slate-500">
                Replenish edition supply, create new fixed-price listings, launch English auctions, or mint new luxury collections.
              </p>
            </div>
            {(isDealer || isAdmin) && (
              <button
                onClick={() => setIsMintModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-pink-200 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Mint New Luxury Asset</span>
              </button>
            )}
          </div>

          {/* Controls Bar: View Toggle + Search + Category Filter */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
            {/* View Mode Tabs */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setViewFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-purple-600" />
                <span>All Protocol Collections ({allTokens.length})</span>
              </button>
              <button
                onClick={() => setViewFilter('brand')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewFilter === 'brand'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building className="w-3.5 h-3.5 text-pink-600" />
                <span>My Brand's Assets ({myBrandTokens.length})</span>
              </button>
            </div>

            {/* Search & Category */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-pink-400 transition-colors"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-pink-400 cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="watches">Watches</option>
                <option value="sneakers">Sneakers</option>
                <option value="vehicles">Vehicles</option>
                <option value="art">Art</option>
                <option value="jewelry">Jewelry</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inventory Table Body */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Syncing Dealer Inventory & Blockchain State...</p>
          </div>
        ) : displayedTokens.length === 0 ? (
          <div className="py-20 px-4 text-center space-y-3">
            <Boxes className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-800 text-sm">
              {viewFilter === 'brand' ? 'No Brand Assets Found Under This Wallet' : 'No Luxury Collections Found'}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {viewFilter === 'brand'
                ? `You have not minted any tokens from ${shortenAddress(account)} yet. Switch to "All Protocol Collections" to inspect existing luxury items or mint a new one.`
                : 'No items match your active search or category filter. Try clearing filters or minting a new luxury asset.'}
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              {viewFilter === 'brand' && allTokens.length > 0 && (
                <button
                  onClick={() => setViewFilter('all')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  View All {allTokens.length} Platform Collections
                </button>
              )}
              {(isDealer || isAdmin) && (
                <button
                  onClick={() => setIsMintModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Mint New Luxury Asset</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-pink-100 text-slate-500 font-semibold text-xs">
                <tr>
                  <th className="p-4">Luxury Asset</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Creator / Brand</th>
                  <th className="p-4">Editions (Minted / Cap)</th>
                  <th className="p-4">Market Status</th>
                  <th className="p-4">Royalty</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {displayedTokens.map((c) => (
                  <tr key={c.id} className="hover:bg-pink-50/20 transition-colors">
                    {/* Item Info */}
                    <td className="p-4 flex items-center gap-3">
                      <img 
                        src={resolveIPFS(c.image, c.category)} 
                        alt={c.name} 
                        className="w-12 h-12 rounded-xl object-cover border border-pink-100 bg-slate-100 shrink-0 shadow-xs" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = getCategoryFallbackImage(c.category);
                        }}
                      />
                      <div>
                        <Link 
                          to={`/nft/${c.id}`}
                          className="font-bold text-slate-900 hover:text-pink-600 transition-colors flex items-center gap-1 group"
                        >
                          <span>{c.name}</span>
                          <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        <p className="text-xs text-slate-400 font-mono">Token ID: #{c.id}</p>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-pink-50 text-pink-700 text-xs font-bold rounded-lg border border-pink-100">
                        {c.category}
                      </span>
                    </td>

                    {/* Creator / Brand */}
                    <td className="p-4">
                      <div className="text-xs">
                        <span className="font-bold text-slate-800">
                          {c.creator.toLowerCase() === '0xd26f32a37bc7039439a51387abf74c127ccdc659'
                            ? "Kashee's Brand"
                            : c.creator.toLowerCase() === '0xd172aa950446e954c499fdf8d69abfe452f9f79e'
                            ? "Aura Kicks Atelier"
                            : shortenAddress(c.creator)}
                        </span>
                        {c.isMyAsset && (
                          <span className="ml-1.5 px-1.5 py-0.5 bg-purple-50 text-purple-700 font-bold text-[10px] rounded">
                            You
                          </span>
                        )}
                        <p className="text-[11px] text-slate-400 font-mono">{shortenAddress(c.creator)}</p>
                      </div>
                    </td>

                    {/* Editions Supply */}
                    <td className="p-4">
                      <div className="text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <span>{c.mintedSupply} / {c.maxSupply}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({c.availableSupply} available)</span>
                        </div>
                        <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-pink-500 to-purple-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, (c.mintedSupply / c.maxSupply) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Market Status */}
                    <td className="p-4">
                      {c.isListed ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg flex items-center gap-1 w-max">
                          <Tag className="w-3 h-3 text-emerald-600" />
                          <span>Listed: {c.price} ETH</span>
                        </span>
                      ) : c.isAuction ? (
                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold rounded-lg flex items-center gap-1 w-max">
                          <Gavel className="w-3 h-3 text-purple-600" />
                          <span>Live Auction</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg w-max block">
                          Vault Stock
                        </span>
                      )}
                    </td>

                    {/* Royalty */}
                    <td className="p-4 text-xs font-bold text-slate-600">
                      {(c.royaltyBps / 100).toFixed(1)}% ({c.royaltyBps} bps)
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedNFT(c);
                            setIsListingModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="List editions for fixed sale"
                        >
                          <Tag className="w-3 h-3" />
                          <span>List</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedNFT(c);
                            setIsAuctionModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Launch English auction"
                        >
                          <Gavel className="w-3 h-3" />
                          <span>Auction</span>
                        </button>

                        <button
                          onClick={() => {
                            setReplenishModalItem(c);
                            setReplenishAmount('5');
                          }}
                          className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Mint additional editions (+ Supply)"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          <span>+ Supply</span>
                        </button>

                        <button
                          onClick={() => handleBurn(c.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Burn 1 unsold edition"
                        >
                          <Flame className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: SUPPLY REPLENISHMENT (+ SUPPLY) */}
      {/* ========================================================================= */}
      {replenishModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-pink-100 shadow-2xl max-w-md w-full overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
                  <PackagePlus className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Replenish Edition Supply</h3>
                  <p className="text-xs text-purple-200">Token #{replenishModalItem.tokenId} • {replenishModalItem.name}</p>
                </div>
              </div>
              <button
                onClick={() => setReplenishModalItem(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleReplenishSupply} className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <img
                  src={resolveIPFS(replenishModalItem.image, replenishModalItem.category)}
                  alt={replenishModalItem.name}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{replenishModalItem.name}</h4>
                  <p className="text-xs text-slate-500">
                    Current Minted: <strong>{replenishModalItem.mintedSupply}</strong> / Max Cap: <strong>{replenishModalItem.maxSupply}</strong>
                  </p>
                  <span className="text-[10px] text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded font-bold mt-1 inline-block">
                    ERC-1155 Batch Multi-Token
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Additional Editions to Mint
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={replenishAmount}
                  onChange={(e) => setReplenishAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-pink-500 transition-colors"
                  placeholder="e.g. 5"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  New total supply will become: <strong>{(replenishModalItem.mintedSupply || 0) + (parseInt(replenishAmount, 10) || 0)} editions</strong>.
                </p>
              </div>

              <div className="p-3 bg-pink-50/60 rounded-xl border border-pink-100 text-xs text-pink-800 space-y-1">
                <span className="font-bold block">Provenance & Blockchain Note:</span>
                <p className="text-[11px] leading-relaxed">
                  Minting extra editions calls <code>mintMore()</code> on the Sepolia smart contract and automatically updates your brand's marketplace vault balance.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReplenishModalItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReplenishing || nftLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isReplenishing || nftLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <PackagePlus className="w-4 h-4" />
                  )}
                  <span>Confirm & Mint on Sepolia</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mint Modal */}
      <MintModal
        isOpen={isMintModalOpen}
        onClose={() => {
          setIsMintModalOpen(false);
          fetchDealerNFTs();
        }}
      />

      {/* Listing / Auction Modals */}
      {selectedNFT && (
        <>
          <CreateListingModal
            isOpen={isListingModalOpen}
            onClose={() => {
              setIsListingModalOpen(false);
              setSelectedNFT(null);
              fetchDealerNFTs();
            }}
            nft={selectedNFT}
          />
          <CreateAuctionModal
            isOpen={isAuctionModalOpen}
            onClose={() => {
              setIsAuctionModalOpen(false);
              setSelectedNFT(null);
              fetchDealerNFTs();
            }}
            nft={selectedNFT}
          />
        </>
      )}

      {/* Claim 2% Milestone Modal */}
      <ClaimRewardModal
        isOpen={isClaimModalOpen}
        onClose={() => {
          setIsClaimModalOpen(false);
          fetchDealerNFTs();
        }}
        loyaltyData={loyaltyData}
      />
    </DashboardLayout>
  );
};

export default DealerDashboard;
