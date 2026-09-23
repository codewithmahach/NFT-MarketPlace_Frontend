import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useWeb3 } from '../../context/Web3Context';
import { useMarketplace } from '../../hooks/useMarketplace';
import { useAuction } from '../../hooks/useAuction';
import { useLoyalty } from '../../hooks/useLoyalty';
import CreateListingModal from '../../components/marketplace/CreateListingModal';
import CreateAuctionModal from '../../components/auction/CreateAuctionModal';
import ClaimRewardModal from '../../components/loyalty/ClaimRewardModal';
import { formatETH, shortenAddress } from '../../utils/formatters';
import { 
  Layers, 
  Tag, 
  Gavel, 
  Award, 
  ArrowDownToLine, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  Loader2,
  Boxes,
  Inbox
} from 'lucide-react';

import { orderApi, authApi, nftApi, marketplaceApi, auctionApi } from '../../services/api';

const UserDashboard = () => {
  const { account, isConnected, jwtToken } = useWeb3();
  const { cancelListing, withdrawEarnings, loading: marketLoading } = useMarketplace();
  const { cancelAuction, withdrawAuctionFunds, settleAuction, loading: auctionLoading } = useAuction();
  const { fetchUserLoyalty } = useLoyalty();

  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'listings', 'bids', 'history'
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [isAuctionModalOpen, setIsAuctionModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  // Escrow pull-payment states
  const [pendingSellerEarnings, setPendingSellerEarnings] = useState('0.0');
  const [pendingAuctionRefunds, setPendingAuctionRefunds] = useState('0.0');
  const [loyaltyData, setLoyaltyData] = useState({
    points: 0,
    tier: 0,
    purchaseCount: 0,
    pendingRewards: '0.0',
    eligibleRewards: 0,
  });

  const [userInventory, setUserInventory] = useState([]);
  const [userListings, setUserListings] = useState([]);
  const [userAuctions, setUserAuctions] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAllUserData = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    try {
      // 1. Fetch user loyalty
      const lData = await fetchUserLoyalty(account);
      if (lData) setLoyaltyData(lData);

      // 2. Fetch user owned NFTs
      const invRes = await nftApi.getUserNFTs(account, 'owned');
      if (invRes && invRes.success && invRes.data) {
        const raw = invRes.data.nfts || invRes.data || [];
        setUserInventory(raw.map((item) => ({
          id: item.tokenId || item.id,
          tokenId: item.tokenId || item.id,
          name: item.title || `Luxury Asset #${item.tokenId}`,
          category: item.category ? (item.category.charAt(0).toUpperCase() + item.category.slice(1)) : 'Luxury',
          image: item.image || '/images/placeholder.jpg',
          balance: item.balance || 1,
          availableSupply: item.availableSupply || 1,
          maxSupply: item.maxSupply || 10,
        })));
      } else {
        setUserInventory([]);
      }

      // 3. Fetch user active listings
      const listRes = await marketplaceApi.getUserListings(account);
      if (listRes && listRes.success && listRes.data) {
        const rawList = listRes.data.listings || listRes.data || [];
        setUserListings(rawList.map((l) => ({
          id: l.listingId || l.id,
          listingId: l.listingId || l.id,
          tokenId: l.tokenId,
          name: l.nft?.title || l.title || `Listing #${l.listingId}`,
          image: l.nft?.image || l.image || '/images/placeholder.jpg',
          price: l.priceInEth || l.price || '0',
          availableSupply: l.quantity || 1,
        })));
      } else {
        setUserListings([]);
      }

      // 4. Fetch user auctions / bids
      const aucRes = await auctionApi.getUserAuctions(account);
      if (aucRes && aucRes.success && aucRes.data) {
        const rawAuc = aucRes.data.auctions || aucRes.data || [];
        setUserAuctions(rawAuc.map((a) => ({
          id: a.auctionId || a.id,
          auctionId: a.auctionId || a.id,
          tokenId: a.tokenId,
          name: a.nft?.title || a.title || `Auction #${a.auctionId}`,
          image: a.nft?.image || a.image || '/images/placeholder.jpg',
          highestBid: a.highestBidInEth || a.startPriceInEth || '0',
          endTime: a.endTime,
          settled: a.settled,
        })));
      } else {
        setUserAuctions([]);
      }

      // 5. Fetch verified orders & receipts
      const ordersRes = await orderApi.getUserOrders(account);
      if (ordersRes && ordersRes.success && ordersRes.data) {
        const mapped = ordersRes.data.map((ord) => ({
          orderId: ord._id.slice(-6).toUpperCase(),
          tokenId: ord.tokenId,
          nftName: ord.nft ? ord.nft.title : `NFT #${ord.tokenId}`,
          category: ord.nft ? ord.nft.category : 'Luxury',
          buyer: ord.buyer,
          seller: ord.seller,
          quantity: ord.quantity,
          currency: 'ETH',
          totalPrice: ord.totalPriceInEth?.toString() || '0',
          loyaltyPointsEarned: ord.orderType === 'direct_sale' ? 10 : 5,
          txHash: ord.txHash,
          timestamp: new Date(ord.createdAt).toLocaleDateString(),
        }));
        setUserOrders(mapped);
      } else {
        setUserOrders([]);
      }

      // 6. Fetch pending withdrawals if authenticated
      if (jwtToken) {
        const meRes = await authApi.getMe(jwtToken);
        if (meRes && meRes.success && meRes.data && meRes.data.withdrawals) {
          setPendingSellerEarnings(meRes.data.withdrawals.marketplacePendingEth || '0.0');
          setPendingAuctionRefunds(meRes.data.withdrawals.auctionPendingEth || '0.0');
        }
      }
    } catch (err) {
      console.warn("User dashboard data loading error:", err);
    } finally {
      setLoading(false);
    }
  }, [account, jwtToken, fetchUserLoyalty]);

  useEffect(() => {
    if (isConnected && account) {
      loadAllUserData();
    }
  }, [isConnected, account, loadAllUserData]);

  const handleWithdrawMarket = async () => {
    const res = await withdrawEarnings();
    if (res && res.success) {
      setPendingSellerEarnings('0.0');
      loadAllUserData();
    }
  };

  const handleWithdrawAuction = async () => {
    const res = await withdrawAuctionFunds();
    if (res && res.success) {
      setPendingAuctionRefunds('0.0');
      loadAllUserData();
    }
  };

  return (
    <DashboardLayout
      title="Collector Dashboard"
      subtitle="Manage your luxury NFT portfolio, active marketplace listings, live auction bids, and escrow pull-payment balances."
    >
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Metric 1: Loyalty Tier */}
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-pink-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loyalty Tier</span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                {['Normal', 'Bronze', 'Silver', 'Gold'][loyaltyData.tier] || 'Normal'} Tier
              </h3>
              <p className="text-xs text-pink-600 font-semibold mt-1">
                {loyaltyData.points} Total Points
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <button
            onClick={() => setIsClaimModalOpen(true)}
            className="mt-4 w-full py-1.5 px-3 bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Check Rewards</span>
          </button>
        </div>

        {/* Metric 2: Marketplace Escrow Balance (Pull-Payment) */}
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-pink-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sales Earnings</span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                {pendingSellerEarnings} ETH
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Marketplace pull-payment</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <Tag className="w-5 h-5" />
            </div>
          </div>
          <button
            onClick={handleWithdrawMarket}
            disabled={parseFloat(pendingSellerEarnings) === 0 || marketLoading}
            className="mt-4 w-full py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 disabled:opacity-40 cursor-pointer"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>Withdraw Earnings</span>
          </button>
        </div>

        {/* Metric 3: Outbid Escrow Refunds (Pull-Payment) */}
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-pink-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outbid Refunds</span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                {pendingAuctionRefunds} ETH
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Auction escrow pull-payment</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-600">
              <Gavel className="w-5 h-5" />
            </div>
          </div>
          <button
            onClick={handleWithdrawAuction}
            disabled={parseFloat(pendingAuctionRefunds) === 0 || auctionLoading}
            className="mt-4 w-full py-1.5 px-3 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 disabled:opacity-40 cursor-pointer"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>Withdraw Refund</span>
          </button>
        </div>

        {/* Metric 4: Total Inventory Items */}
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-pink-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Collected Assets</span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                {userInventory.length} Luxury NFTs
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Verified on Ethereum Sepolia</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-xs font-medium text-emerald-600 bg-emerald-50 py-1.5 px-3 rounded-xl flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>On-chain Token Balance</span>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="bg-white rounded-2xl border border-pink-100/80 p-2 mb-6 flex items-center gap-2 overflow-x-auto shadow-sm">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'inventory'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>My Collected NFTs ({userInventory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('listings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'listings'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Active Listings ({userListings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bids')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'bids'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Gavel className="w-4 h-4" />
          <span>Live Auction Bids ({userAuctions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Order Receipts & History ({userOrders.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Syncing Portfolio State...</p>
        </div>
      ) : (
        <>
          {/* Tab 1: Collected NFTs */}
          {activeTab === 'inventory' && (
            <div>
              {userInventory.length === 0 ? (
                <div className="bg-white rounded-2xl border border-pink-100 p-12 text-center space-y-3 shadow-sm">
                  <Boxes className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-sm">No Collected NFTs Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You have not purchased any luxury collectibles yet. Explore the marketplace or join live auctions to begin your collection.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {userInventory.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl border border-pink-100 overflow-hidden shadow-sm flex flex-col justify-between">
                      <div className="relative aspect-square">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[10px] font-bold">
                          Owned: {item.balance}
                        </span>
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <span className="text-[10px] font-bold text-pink-600 uppercase">{item.category}</span>
                          <h4 className="font-bold text-slate-900 text-sm truncate">{item.name}</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => {
                              setSelectedNFT(item);
                              setIsListingModalOpen(true);
                            }}
                            className="py-1.5 px-2 bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Tag className="w-3.5 h-3.5" />
                            <span>List Sale</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedNFT(item);
                              setIsAuctionModalOpen(true);
                            }}
                            className="py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Gavel className="w-3.5 h-3.5" />
                            <span>Auction</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Active Listings */}
          {activeTab === 'listings' && (
            <div className="bg-white rounded-2xl border border-pink-100 overflow-hidden shadow-sm">
              {userListings.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-sm">No Active Listings</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You do not have any active fixed-price listings on the marketplace.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-pink-100 text-slate-500 font-semibold text-xs">
                      <tr>
                        <th className="p-4">Item</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Quantity</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {userListings.map((l) => (
                        <tr key={l.id} className="hover:bg-pink-50/30 transition-colors">
                          <td className="p-4 flex items-center gap-3">
                            <img src={l.image} alt={l.name} className="w-10 h-10 rounded-lg object-cover" />
                            <div>
                              <p className="font-bold text-slate-900">{l.name}</p>
                              <p className="text-xs text-slate-400">Listing #{l.listingId}</p>
                            </div>
                          </td>
                          <td className="p-4 font-bold text-slate-900">{l.price} ETH</td>
                          <td className="p-4">{l.availableSupply} editions</td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200">
                              Active
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={async () => {
                                await cancelListing(l.listingId);
                                loadAllUserData();
                              }}
                              className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Cancel Listing
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Live Bids */}
          {activeTab === 'bids' && (
            <div className="bg-white rounded-2xl border border-pink-100 overflow-hidden shadow-sm">
              {userAuctions.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-sm">No Active Auction Bids</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You have not placed bids on any active auctions recently.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-pink-100 text-slate-500 font-semibold text-xs">
                      <tr>
                        <th className="p-4">Auction Item</th>
                        <th className="p-4">Highest Bid</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {userAuctions.map((a) => (
                        <tr key={a.id} className="hover:bg-pink-50/30 transition-colors">
                          <td className="p-4 flex items-center gap-3">
                            <img src={a.image} alt={a.name} className="w-10 h-10 rounded-lg object-cover" />
                            <div>
                              <p className="font-bold text-slate-900">{a.name}</p>
                              <p className="text-xs text-slate-400">Auction #{a.auctionId}</p>
                            </div>
                          </td>
                          <td className="p-4 font-bold text-slate-900">{a.highestBid} ETH</td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 font-bold text-xs rounded-full border border-purple-200">
                              Active
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={async () => {
                                await settleAuction(a.auctionId);
                                loadAllUserData();
                              }}
                              className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Settle if Ended
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Order History */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-2xl border border-pink-100 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-pink-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 text-sm">Verified Transaction History & Receipts</h3>
                <span className="text-xs text-slate-400">Sepolia Network</span>
              </div>
              {userOrders.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-sm">No Orders Recorded Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    When you purchase luxury items on the marketplace, your on-chain receipts and loyalty point confirmations will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {userOrders.map((order) => (
                    <div key={order.orderId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-pink-50/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{order.nftName} ({order.quantity}x)</h4>
                          <p className="text-xs text-slate-400">
                            {order.timestamp} • Order #{order.orderId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-xs">
                        <div>
                          <span className="text-slate-400 block">Total Paid</span>
                          <span className="font-bold text-slate-900">{order.totalPrice} {order.currency}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Loyalty Points</span>
                          <span className="font-bold text-pink-600">+{order.loyaltyPointsEarned} pts</span>
                        </div>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${order.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-slate-400 hover:text-pink-600 rounded-lg hover:bg-slate-100"
                          title="View on Etherscan"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {selectedNFT && (
        <>
          <CreateListingModal
            isOpen={isListingModalOpen}
            onClose={() => {
              setIsListingModalOpen(false);
              setSelectedNFT(null);
              loadAllUserData();
            }}
            nft={selectedNFT}
          />
          <CreateAuctionModal
            isOpen={isAuctionModalOpen}
            onClose={() => {
              setIsAuctionModalOpen(false);
              setSelectedNFT(null);
              loadAllUserData();
            }}
            nft={selectedNFT}
          />
        </>
      )}

      <ClaimRewardModal
        isOpen={isClaimModalOpen}
        onClose={() => {
          setIsClaimModalOpen(false);
          loadAllUserData();
        }}
        loyaltyData={loyaltyData}
      />
    </DashboardLayout>
  );
};

export default UserDashboard;
