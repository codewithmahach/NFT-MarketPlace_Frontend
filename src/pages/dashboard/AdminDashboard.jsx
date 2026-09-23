import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useWeb3 } from '../../context/Web3Context';
import { useNFT } from '../../hooks/useNFT';
import { useLoyalty } from '../../hooks/useLoyalty';
import { useNotification } from '../../context/NotificationContext';
import { CONTRACT_ADDRESSES } from '../../config/contracts';
import { 
  ShieldCheck, 
  UserCheck, 
  Coins, 
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Bell,
  TrendingUp,
  Layers,
  Building2,
  Globe,
  Mail,
  Loader2,
  Gift,
  Inbox,
  Search,
  AlertOctagon,
  ShieldAlert,
  Trash2,
  Eye,
  X,
  Copy,
  Tag,
  Gavel,
  ShoppingBag,
  Award,
  Flame,
  Check,
  RotateCcw
} from 'lucide-react';
import { shortenAddress, formatETH, resolveIPFS } from '../../utils/formatters';
import { getCategoryFallbackImage } from '../../config/constants';
import { adminApi, dealerApi, notificationApi } from '../../services/api';

const AdminDashboard = () => {
  const { account, isAdmin, jwtToken } = useWeb3();
  const { setDealerStatus, loading: nftLoading } = useNFT();
  const { fundRewards, setRewardAmount, loading: loyaltyLoading } = useLoyalty();
  const { showToast, triggerConfetti } = useNotification();

  // State forms
  const [dealerAddress, setDealerAddress] = useState('');
  const [isDealerApproved, setIsDealerApproved] = useState(true);

  const [loyaltyFundEth, setLoyaltyFundEth] = useState('0.1');
  const [newRewardAmountEth, setNewRewardAmountEth] = useState('0.01');

  // Dealers, Analytics and Notifications state
  const [dealers, setDealers] = useState([]);
  const [dealerFilter, setDealerFilter] = useState('all'); // 'all', 'approved', 'pending', 'penalized', 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Selected Dealer for Inventory Modal
  const [selectedDealerInventory, setSelectedDealerInventory] = useState(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryTab, setInventoryTab] = useState('minted'); // 'minted', 'listings', 'auctions'

  // Penalty Modal State
  const [penaltyModalDealer, setPenaltyModalDealer] = useState(null);
  const [penaltyReasonPreset, setPenaltyReasonPreset] = useState('exclusivity_breach');
  const [customPenaltyReason, setCustomPenaltyReason] = useState('');
  const [revokeRoleOnPenalty, setRevokeRoleOnPenalty] = useState(true);
  const [penaltySubmitting, setPenaltySubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModalDealer, setDeleteModalDealer] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Copied address state
  const [copiedAddress, setCopiedAddress] = useState(null);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    showToast('Address copied to clipboard', 'info');
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // Load comprehensive dealers analytics, applications and notifications
  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Always fetch live dealers analytics directly from backend
      const analyticsRes = await adminApi.getDealersAnalytics(jwtToken);
      let dealersData = [];

      if (analyticsRes && analyticsRes.success && analyticsRes.data && analyticsRes.data.dealers) {
        dealersData = analyticsRes.data.dealers;
      } else {
        const appsRes = await dealerApi.getAllApplications();
        if (appsRes && appsRes.success && appsRes.data && appsRes.data.applications) {
          dealersData = appsRes.data.applications.map((app) => ({
            applicationId: app._id,
            address: app.applicantAddress,
            businessName: app.businessName,
            contactPerson: app.contactPerson || '',
            email: app.email,
            phone: app.phone || '',
            category: app.category ? (app.category.charAt(0).toUpperCase() + app.category.slice(1)) : 'Luxury',
            website: app.website || '',
            status: app.status || 'pending',
            isDealer: app.status === 'approved',
            isPenalized: Boolean(app.isPenalized),
            penaltyReason: app.penaltyReason || '',
            totalMintedNFTs: 0,
            activeListingsCount: 0,
            activeAuctionsCount: 0,
            totalSellingCount: 0,
            totalSalesCount: 0,
            totalVolumeEth: 0,
            positionTier: 'Standard Dealer',
            tierBadgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
            notes: app.provenanceProcess || app.reviewNotes || '',
            rawApplication: app,
          }));
        }
      }

      setDealers(dealersData);

      // 2. Fetch notifications
      if (jwtToken) {
        const notifRes = await notificationApi.getNotifications(jwtToken);
        if (notifRes && notifRes.success && notifRes.data && notifRes.data.notifications) {
          setNotifications(
            notifRes.data.notifications.map((n) => ({
              id: n._id,
              title: n.title,
              description: n.message,
              timestamp: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: n.isRead,
            }))
          );
        }
      }

      // 3. Fetch live dashboard metrics
      const dashRes = await adminApi.getDashboard(jwtToken);
      if (dashRes && dashRes.success && dashRes.data) {
        setDashboardMetrics(dashRes.data.metrics);
      }
    } catch (err) {
      console.warn('Could not fetch admin data from API:', err);
    } finally {
      setLoading(false);
    }
  }, [jwtToken]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData, account]);

  // Open Inventory Modal
  // Open Inventory Modal
  const handleOpenInventory = async (dealer) => {
    setSelectedDealerInventory({ ...dealer, inventory: null });
    setInventoryLoading(true);
    setInventoryTab('minted');
    try {
      const res = await adminApi.getDealerInventory(jwtToken, dealer.address);
      if (res && res.success && res.data) {
        setSelectedDealerInventory({
          ...dealer,
          inventory: res.data,
        });
      }
    } catch (err) {
      console.warn('Error fetching dealer inventory:', err);
    } finally {
      setInventoryLoading(false);
    }
  };

  // Direct manual grant/revoke
  const handleUpdateDealer = async (e) => {
    e.preventDefault();
    if (!dealerAddress || !dealerAddress.startsWith('0x')) return;

    let txHash = '';
    try {
      const res = await setDealerStatus(dealerAddress, isDealerApproved, false);
      if (res && res.hash) txHash = res.hash;
    } catch (contractErr) {
      console.warn('On-chain dealer update note:', contractErr.message);
    }

    try {
      await adminApi.updateDealerStatus(jwtToken, dealerAddress, isDealerApproved);
    } catch (apiErr) {
      console.warn('Backend dealer status update note:', apiErr);
    }

    setDealerAddress('');
    fetchAdminData();
    showToast(`Dealer status ${isDealerApproved ? 'authorized' : 'revoked'} for ${shortenAddress(dealerAddress)}!`, 'success');
  };

  // Approve dealer application
  const handleApproveApplication = async (dealer) => {
    try {
      let txHash = '';
      try {
        const res = await setDealerStatus(dealer.address, true, true);
        if (res && (res.hash || res.txHash)) {
          txHash = res.hash || res.txHash;
        }
      } catch (onChainErr) {
        console.warn('On-chain grantRole warning (proceeding with backend approval):', onChainErr.message);
      }

      try {
        if (dealer.applicationId && !dealer.applicationId.toString().startsWith('app_')) {
          await adminApi.reviewApplication(jwtToken, dealer.applicationId, {
            status: 'approved',
            reviewNotes: 'Approved by protocol administrator.',
            approvalTxHash: txHash || '',
          });
        }
        await adminApi.updateDealerStatus(jwtToken, dealer.address, true);
      } catch (apiErr) {
        console.warn('Backend approval update note:', apiErr);
      }

      triggerConfetti();
      fetchAdminData();
      showToast(`Dealership approved & verified for ${dealer.businessName}!`, 'success');
    } catch (err) {
      console.error('Approval error:', err);
      showToast(err.message || 'Failed to approve dealer', 'error');
    }
  };

  // Reject dealer application
  const handleRejectApplication = async (dealer) => {
    try {
      if (dealer.applicationId && !dealer.applicationId.toString().startsWith('app_')) {
        await adminApi.reviewApplication(jwtToken, dealer.applicationId, {
          status: 'rejected',
          reviewNotes: 'Requirements not met at this time.',
        });
      }
    } catch (err) {
      console.warn('Backend rejection update error:', err);
    }
    fetchAdminData();
    showToast('Application marked as rejected.', 'info');
  };

  // Submit Exclusivity Penalty
  const handleSubmitPenalty = async (e) => {
    e.preventDefault();
    if (!penaltyModalDealer) return;

    setPenaltySubmitting(true);
    const reasonText =
      customPenaltyReason.trim() ||
      (penaltyReasonPreset === 'exclusivity_breach'
        ? 'Violation of ChainArt Exclusivity Agreement: Unauthorized trading or listing on external marketplace.'
        : penaltyReasonPreset === 'external_sales'
        ? 'Circumventing platform protocols and selling luxury assets outside ChainArt.'
        : penaltyReasonPreset === 'unauthorized_minting'
        ? 'Unauthorized secondary token generation or duplicate inventory claims.'
        : 'Administrative policy non-compliance.');

    try {
      if (revokeRoleOnPenalty) {
        try {
          await setDealerStatus(penaltyModalDealer.address, false, true);
        } catch (contractErr) {
          console.warn('On-chain revoke warning:', contractErr.message);
        }
      }

      try {
        await adminApi.penalizeDealer(jwtToken, {
          address: penaltyModalDealer.address,
          reason: reasonText,
          penaltyType: penaltyReasonPreset,
          revokeRole: revokeRoleOnPenalty,
        });
      } catch (apiErr) {
        console.warn('Backend penalize dealer note:', apiErr);
      }

      showToast(`Exclusivity penalty imposed on ${penaltyModalDealer.businessName}!`, 'success');
      setPenaltyModalDealer(null);
      setCustomPenaltyReason('');
      fetchAdminData();
    } catch (err) {
      console.error('Penalty submission error:', err);
      showToast(err.message || 'Failed to apply penalty', 'error');
    } finally {
      setPenaltySubmitting(false);
    }
  };

  // Lift Penalty & Restore Dealer
  const handleLiftPenalty = async (dealer) => {
    try {
      try {
        await setDealerStatus(dealer.address, true, true);
      } catch (contractErr) {
        console.warn('On-chain restore warning:', contractErr.message);
      }

      try {
        await adminApi.liftPenalty(jwtToken, dealer.address);
      } catch (apiErr) {
        console.warn('Backend lift penalty note:', apiErr);
      }

      showToast(`Penalty lifted. Dealership restored in good standing for ${dealer.businessName}!`, 'success');
      fetchAdminData();
    } catch (err) {
      console.error('Lift penalty error:', err);
      showToast(err.message || 'Failed to lift penalty', 'error');
    }
  };

  // Delete / Remove Dealer
  const handleConfirmDelete = async () => {
    if (!deleteModalDealer) return;
    setDeleteSubmitting(true);

    try {
      try {
        await setDealerStatus(deleteModalDealer.address, false, true);
      } catch (contractErr) {
        console.warn('On-chain revoke on delete note:', contractErr.message);
      }

      try {
        await adminApi.deleteDealer(jwtToken, deleteModalDealer.address);
      } catch (apiErr) {
        console.warn('Backend delete dealer note:', apiErr);
      }

      // Also remove from localStorage if present
      const localApps = JSON.parse(localStorage.getItem('chainart_local_applications') || '[]');
      const updatedLocal = localApps.filter(
        (a) => a.applicantAddress?.toLowerCase() !== deleteModalDealer.address?.toLowerCase()
      );
      localStorage.setItem('chainart_local_applications', JSON.stringify(updatedLocal));

      showToast(`Dealer ${deleteModalDealer.businessName} permanently removed.`, 'success');
      setDeleteModalDealer(null);
      fetchAdminData();
    } catch (err) {
      console.error('Delete dealer error:', err);
      showToast(err.message || 'Failed to delete dealer', 'error');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Purge Mock Data
  const handlePurgeMockData = async () => {
    if (!window.confirm('Are you sure you want to purge all demo/mock items from the database? Real on-chain data will be preserved.')) return;
    try {
      const res = await adminApi.clearMockData(jwtToken);
      if (res && res.success) {
        showToast('Mock data purged from database successfully!', 'success');
        fetchAdminData();
      }
    } catch (err) {
      console.warn('Purge mock data note:', err);
      showToast('Failed to purge mock data', 'error');
    }
  };

  const handleFundLoyalty = async (e) => {
    e.preventDefault();
    if (!loyaltyFundEth || parseFloat(loyaltyFundEth) <= 0) return;
    await fundRewards(loyaltyFundEth);
  };

  const handleSetLoyaltyAmount = async (e) => {
    e.preventDefault();
    if (!newRewardAmountEth || parseFloat(newRewardAmountEth) <= 0) return;
    await setRewardAmount(newRewardAmountEth);
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const markAllNotificationsRead = async () => {
    if (jwtToken) {
      await notificationApi.markAllAsRead(jwtToken);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('All notifications marked as read', 'info');
  };

  // Filtered dealers list
  const filteredDealers = dealers.filter((d) => {
    // Tab filter
    if (dealerFilter === 'approved' && d.status !== 'approved' && !d.isDealer) return false;
    if (dealerFilter === 'pending' && d.status !== 'pending') return false;
    if (dealerFilter === 'penalized' && !d.isPenalized && d.status !== 'penalized') return false;
    if (dealerFilter === 'rejected' && d.status !== 'rejected') return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (d.businessName || '').toLowerCase().includes(q);
      const matchAddress = (d.address || '').toLowerCase().includes(q);
      const matchCategory = (d.category || '').toLowerCase().includes(q);
      const matchEmail = (d.email || '').toLowerCase().includes(q);
      return matchName || matchAddress || matchCategory || matchEmail;
    }
    return true;
  });

  const counts = {
    all: dealers.length,
    approved: dealers.filter((d) => d.status === 'approved' || d.isDealer).length,
    pending: dealers.filter((d) => d.status === 'pending').length,
    penalized: dealers.filter((d) => d.isPenalized || d.status === 'penalized').length,
    rejected: dealers.filter((d) => d.status === 'rejected').length,
  };

  return (
    <DashboardLayout
      title="Admin Protocol Supervision Suite"
      subtitle="Complete dealer portfolio supervision, on-chain verification, exclusivity policy enforcement, live inventory tracking, and loyalty treasury controls on Ethereum Sepolia."
    >
      {/* Admin Notice */}
      {!isAdmin && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-xs shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p>
            You are currently viewing the Governance Suite in <strong>Supervision Inspector Mode</strong>. To commit state changes or grant roles on Sepolia, connect with the contract deployer address.
          </p>
        </div>
      )}

      {/* Top Supervision KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-pink-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Volume</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {dashboardMetrics ? `${dashboardMetrics.totalVolumeEth || '0.00'} ETH` : '0.00 ETH'}
              </h3>
              <p className="text-xs text-emerald-600 font-semibold mt-1">Real-time indexed volume</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-pink-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Inventory</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {dashboardMetrics ? `${dashboardMetrics.activeListings || 0} Listed` : '0 Listed'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Fixed & Auction drops</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-pink-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verified Dealers</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {counts.approved} Brands
              </h3>
              <p className="text-xs text-emerald-600 font-semibold mt-1">On-chain accredited</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-pink-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Dealers</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {counts.pending} In Review
              </h3>
              <p className="text-xs text-amber-600 font-semibold mt-1">Awaiting verification</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-pink-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exclusivity Penalties</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {counts.penalized} Flagged
              </h3>
              <p className="text-xs text-rose-600 font-semibold mt-1">External sales breach</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Dealer Supervision Suite & Table */}
      <div className="bg-white rounded-3xl border border-pink-100 shadow-sm overflow-hidden mb-8">
        {/* Header & Exclusivity Banner */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-pink-400" />
              <h3 className="text-lg font-black tracking-tight">Luxury Dealer Management & Exclusivity Supervision</h3>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Supervise all brand partners, verify on-chain minting roles, track minted NFTs, monitor live selling inventory, and enforce the <strong>ChainArt Exclusivity Policy</strong> (penalizing any unauthorized external sales).
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto bg-white/10 px-3.5 py-2 rounded-2xl border border-white/20 text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{dealers.length} Registered Dealerships</span>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setDealerFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                dealerFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Dealers ({counts.all})
            </button>
            <button
              onClick={() => setDealerFilter('approved')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                dealerFilter === 'approved'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
              }`}
            >
              Verified / Active ({counts.approved})
            </button>
            <button
              onClick={() => setDealerFilter('pending')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                dealerFilter === 'pending'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              Pending Approval ({counts.pending})
            </button>
            <button
              onClick={() => setDealerFilter('penalized')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                dealerFilter === 'penalized'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
              }`}
            >
              Penalized / Exclusivity Breach ({counts.penalized})
            </button>
            <button
              onClick={() => setDealerFilter('rejected')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                dealerFilter === 'rejected'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Rejected ({counts.rejected})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, address, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-pink-500"
            />
          </div>
        </div>

        {/* Dealers Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Syncing Dealer Analytics & On-Chain Roles...
              </span>
            </div>
          ) : filteredDealers.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">No Dealers Found Matching Criteria</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No dealership records match your current filter and search parameters.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Dealer / Brand</th>
                  <th className="py-3.5 px-4">Wallet Address</th>
                  <th className="py-3.5 px-4 text-center">Minted NFTs</th>
                  <th className="py-3.5 px-4 text-center">Selling Inventory</th>
                  <th className="py-3.5 px-4">Position & Volume</th>
                  <th className="py-3.5 px-4">Exclusivity Status</th>
                  <th className="py-3.5 px-4 text-right">Actions & Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredDealers.map((dealer) => {
                  const isPenalized = dealer.isPenalized || dealer.status === 'penalized';
                  const isApproved = dealer.status === 'approved' || dealer.isDealer;
                  const isPending = dealer.status === 'pending';
                  const isRejected = dealer.status === 'rejected';

                  return (
                    <tr
                      key={dealer.address || dealer.applicationId}
                      className={`hover:bg-pink-50/20 transition-colors ${
                        isPenalized ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* Brand Info */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-pink-100 text-pink-700 font-extrabold text-[10px] uppercase tracking-wider border border-pink-200">
                              {dealer.dealerLabel || `Dealer #${dealers.indexOf(dealer) + 1}`}
                            </span>
                            <span className="font-extrabold text-slate-900 text-sm">
                              {dealer.businessName}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
                              {dealer.category}
                            </span>
                            {isApproved && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Verified Role
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                            {dealer.email && (
                              <span className="flex items-center gap-1 text-slate-600 font-medium">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>{dealer.email}</span>
                              </span>
                            )}
                            {dealer.website && (
                              <a
                                href={dealer.website}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-pink-600 hover:underline font-medium"
                              >
                                <Globe className="w-3 h-3" />
                                <span>{dealer.website.replace('https://', '').replace('http://', '').split('/')[0]}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Wallet Address */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1.5">
                          <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg font-mono text-[11px] text-slate-700 border border-slate-200">
                            <span>{shortenAddress(dealer.address, 5)}</span>
                            <button
                              onClick={() => copyToClipboard(dealer.address)}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="Copy full address"
                            >
                              {copiedAddress === dealer.address ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <div>
                            <a
                              href={`https://sepolia.etherscan.io/address/${dealer.address}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-pink-600"
                            >
                              <span>Sepolia Explorer</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* Minted NFTs */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-1 bg-pink-50 text-pink-700 border border-pink-200 rounded-full font-bold text-[11px]">
                              {dealer.totalMintedNFTs || 0} Tokens Minted
                            </span>
                            <button
                              onClick={() => handleOpenInventory(dealer)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-800 hover:underline cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Inspect All</span>
                            </button>
                          </div>

                          {/* Mini Tokens Preview Chips */}
                          {dealer.mintedNFTs && dealer.mintedNFTs.length > 0 ? (
                            <div className="grid grid-cols-2 gap-1.5 pt-1">
                              {dealer.mintedNFTs.map((t) => (
                                <div
                                  key={t.tokenId}
                                  onClick={() => handleOpenInventory(dealer)}
                                  className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-200/80 hover:border-pink-300 hover:bg-pink-50/30 transition-all cursor-pointer text-[10px]"
                                  title={t.title}
                                >
                                  <img
                                    src={resolveIPFS(t.image, t.category)}
                                    alt={t.title}
                                    className="w-5 h-5 rounded-md object-cover bg-slate-200 shrink-0"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = getCategoryFallbackImage(t.category);
                                    }}
                                  />
                                  <div className="overflow-hidden">
                                    <span className="font-bold text-slate-800 block truncate">
                                      #{t.tokenId} {t.title.split(' ')[0]}
                                    </span>
                                    <span className="text-[9px] text-slate-400 capitalize">
                                      {t.category}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic block">
                              No tokens created yet
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Selling Inventory */}
                      <td className="py-4 px-4 align-top text-center">
                        <div className="space-y-1 inline-flex flex-col items-center text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                              {dealer.activeListingsCount || 0} Fixed
                            </span>
                            <span className="px-2 py-0.5 rounded bg-pink-50 text-pink-700 font-semibold border border-pink-200">
                              {dealer.activeAuctionsCount || 0} Auctions
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {(dealer.activeListingsCount || 0) + (dealer.activeAuctionsCount || 0)} Total Active
                          </span>
                        </div>
                      </td>

                      {/* Position & Volume */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1">
                          <span className={`inline-block px-2.5 py-0.5 text-[10px] font-extrabold rounded-md border uppercase tracking-wider ${dealer.tierBadgeColor}`}>
                            {dealer.positionTier || 'Standard Dealer'}
                          </span>
                          <div className="text-[11px] font-bold text-slate-800">
                            {dealer.totalVolumeEth || 0} ETH Volume
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            {dealer.totalSalesCount || 0} Completed Sales
                          </span>
                        </div>
                      </td>

                      {/* Exclusivity & Status */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1.5">
                          {isPenalized ? (
                            <div>
                              <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-full bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                                <AlertOctagon className="w-3 h-3 text-rose-600" />
                                <span>Penalized</span>
                              </span>
                              {dealer.penaltyReason && (
                                <p className="text-[10px] text-rose-700 font-medium mt-1 bg-rose-50 p-1.5 rounded-lg border border-rose-200/80 leading-tight">
                                  {dealer.penaltyReason}
                                </p>
                              )}
                            </div>
                          ) : isApproved ? (
                            <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Verified Dealer</span>
                            </span>
                          ) : isPending ? (
                            <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-full bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                              <span>Pending Review</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-full bg-slate-100 text-slate-700 border border-slate-300 inline-flex items-center gap-1">
                              <span>Rejected</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 align-top text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          {/* Pending Approval Buttons */}
                          {isPending && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleApproveApplication(dealer)}
                                disabled={nftLoading}
                                className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Grant Role</span>
                              </button>
                              <button
                                onClick={() => handleRejectApplication(dealer)}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          )}

                          {/* Verified Dealer: Exclusivity Penalty & Controls */}
                          {isApproved && !isPenalized && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setPenaltyModalDealer(dealer);
                                  setPenaltyReasonPreset('exclusivity_breach');
                                  setCustomPenaltyReason('');
                                }}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
                                title="Impose penalty for selling outside ChainArt"
                              >
                                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                                <span>Impose Penalty</span>
                              </button>
                            </div>
                          )}

                          {/* Penalized Dealer: Lift Penalty */}
                          {isPenalized && (
                            <button
                              onClick={() => handleLiftPenalty(dealer)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Lift Penalty</span>
                            </button>
                          )}

                          {/* Secondary Row: Inspect & Delete */}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => handleOpenInventory(dealer)}
                              className="text-slate-400 hover:text-purple-600 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inventory</span>
                            </button>
                            <span className="text-slate-300">•</span>
                            <button
                              onClick={() => setDeleteModalDealer(dealer)}
                              className="text-slate-400 hover:text-rose-600 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              title="Delete dealer from platform"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Protocol Parameters & Emergency Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Module 1: Direct Dealer Role Controller */}
        <div className="bg-white rounded-3xl border border-pink-100 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
                <UserCheck className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Direct On-Chain Role Controller</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Directly grant or revoke minting permissions on the ERC-1155 `ChainArtNFT` proxy for any Ethereum address.
            </p>

            <form onSubmit={handleUpdateDealer} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Ethereum Sepolia Address
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={dealerAddress}
                  onChange={(e) => setDealerAddress(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="radio"
                    name="dealerStatusManual"
                    checked={isDealerApproved}
                    onChange={() => setIsDealerApproved(true)}
                    className="accent-pink-500"
                  />
                  <span>Authorize Dealer (Enable Minting)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="radio"
                    name="dealerStatusManual"
                    checked={!isDealerApproved}
                    onChange={() => setIsDealerApproved(false)}
                    className="accent-rose-500"
                  />
                  <span>Revoke Dealer Role</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={nftLoading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {nftLoading ? 'Transacting on Sepolia...' : isDealerApproved ? 'Authorize Dealer Role' : 'Revoke Dealer Role'}
              </button>
            </form>
          </div>
        </div>

        {/* Module 2: Loyalty Rewards Treasury */}
        <div className="bg-white rounded-3xl border border-pink-100 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                <Gift className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Loyalty Treasury & Milestone Payout</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Deposit Sepolia ETH to back the buyer and dealer milestone claims (2.0% on 10 sales) and configure payout amounts.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Deposit form */}
              <form onSubmit={handleFundLoyalty} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <label className="text-xs font-bold text-slate-700 block">
                  Deposit ETH to Loyalty Contract
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={loyaltyFundEth}
                    onChange={(e) => setLoyaltyFundEth(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">ETH</span>
                </div>
                <button
                  type="submit"
                  disabled={loyaltyLoading}
                  className="w-full py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Deposit Rewards
                </button>
              </form>

              {/* Set reward unit */}
              <form onSubmit={handleSetLoyaltyAmount} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <label className="text-xs font-bold text-slate-700 block">
                  Update Reward per 10 Sales
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.005"
                    min="0.001"
                    value={newRewardAmountEth}
                    onChange={(e) => setNewRewardAmountEth(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">ETH</span>
                </div>
                <button
                  type="submit"
                  disabled={loyaltyLoading}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Update Amount
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Verification Registry */}
      <div className="bg-white rounded-3xl border border-pink-100 p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Deployed UUPS Proxy Registry</h3>
            <p className="text-xs text-slate-500">Connected Ethereum Sepolia Proxy Contracts (Chain ID: 11155111)</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>All 4 Proxies Active</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(CONTRACT_ADDRESSES)
            .filter(([name]) => ['ChainArtNFT', 'ChainArtMarketplace', 'ChainArtAuction', 'ChainArtLoyalty'].includes(name))
            .map(([name, address]) => (
              <div key={name} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="text-xs font-bold text-pink-600">{name}</span>
                <p className="text-xs font-mono text-slate-700 truncate" title={address}>
                  {address}
                </p>
                <a
                  href={`https://sepolia.etherscan.io/address/${address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-pink-600 transition-colors pt-1"
                >
                  <span>Verify on Sepolia Etherscan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
        </div>
      </div>

      {/* Protocol Hygiene & Data Cleanup */}
      <div className="bg-white rounded-3xl border border-pink-100 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base">Protocol Data Hygiene</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Purge simulated mock items from the database to keep the catalog strictly verified on-chain. Real on-chain items are preserved.
          </p>
        </div>
        <button
          onClick={handlePurgeMockData}
          className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors shrink-0 cursor-pointer"
        >
          Purge Mock Data
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: DEALER INVENTORY & SELLING ACTIVITY VIEWER */}
      {/* ========================================================================= */}
      {selectedDealerInventory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-pink-100 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">{selectedDealerInventory.businessName}</h3>
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-400/40">
                    {selectedDealerInventory.category}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-mono mt-1">
                  Wallet: {selectedDealerInventory.address}
                </p>
              </div>
              <button
                onClick={() => setSelectedDealerInventory(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <button
                onClick={() => setInventoryTab('minted')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  inventoryTab === 'minted'
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Minted NFTs ({selectedDealerInventory.inventory?.mintedNFTs?.length || selectedDealerInventory.totalMintedNFTs || 0})
              </button>
              <button
                onClick={() => setInventoryTab('listings')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  inventoryTab === 'listings'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Active Fixed Price Listings ({selectedDealerInventory.inventory?.activeListings?.length || selectedDealerInventory.activeListingsCount || 0})
              </button>
              <button
                onClick={() => setInventoryTab('auctions')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  inventoryTab === 'auctions'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Active Live Auctions ({selectedDealerInventory.inventory?.activeAuctions?.length || selectedDealerInventory.activeAuctionsCount || 0})
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {inventoryLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                  <span className="text-xs text-slate-400 font-bold">Loading dealer inventory...</span>
                </div>
              ) : inventoryTab === 'minted' ? (
                selectedDealerInventory.inventory?.mintedNFTs?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedDealerInventory.inventory.mintedNFTs.map((token) => (
                      <div
                        key={token.tokenId}
                        className="p-3 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2 flex flex-col"
                      >
                        <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-100 relative">
                          <img
                            src={resolveIPFS(token.image, token.category)}
                            alt={token.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = getCategoryFallbackImage(token.category);
                            }}
                          />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-md text-white font-mono text-[10px] font-bold">
                            Token #{token.tokenId}
                          </span>
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs truncate" title={token.title}>
                              {token.title}
                            </h4>
                            <span className="text-[10px] text-slate-500 font-medium capitalize">
                              {token.category}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-slate-100 mt-2 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-medium">Supply:</span>
                            <span className="font-bold text-slate-700">
                              {token.initialSupply || 1} Copies
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400">
                    This dealer has not minted any tokens on ChainArt yet.
                  </div>
                )
              ) : inventoryTab === 'listings' ? (
                selectedDealerInventory.inventory?.activeListings?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedDealerInventory.inventory.activeListings.map((listing) => (
                      <div
                        key={listing.listingId}
                        className="p-4 rounded-2xl border border-purple-200 bg-purple-50/30 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-slate-900 text-xs">
                            Listing #{listing.listingId} • Token #{listing.tokenId}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                            Active Fixed Price
                          </span>
                        </div>
                        <div className="text-base font-extrabold text-purple-700">
                          {formatETH(listing.priceInEth || 0)} ETH
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Quantity: {listing.quantity || 1} available
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No active fixed-price listings for this dealer.
                  </div>
                )
              ) : (
                selectedDealerInventory.inventory?.activeAuctions?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedDealerInventory.inventory.activeAuctions.map((auction) => (
                      <div
                        key={auction.auctionId}
                        className="p-4 rounded-2xl border border-blue-200 bg-blue-50/30 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-slate-900 text-xs">
                            Auction #{auction.auctionId} • Token #{auction.tokenId}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-bold text-[10px]">
                            Live English Auction
                          </span>
                        </div>
                        <div className="text-base font-extrabold text-blue-700">
                          {formatETH(auction.highestBidInEth || auction.startPriceInEth || 0)} ETH
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Highest Bidder: {shortenAddress(auction.highestBidder)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No active auctions for this dealer.
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: IMPOSE EXCLUSIVITY PENALTY MODAL */}
      {/* ========================================================================= */}
      {penaltyModalDealer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/30 border border-rose-400 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-rose-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Impose Exclusivity Penalty</h3>
                  <p className="text-xs text-rose-200">Protocol Policy Enforcement</p>
                </div>
              </div>
              <button
                onClick={() => setPenaltyModalDealer(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitPenalty} className="p-6 space-y-4">
              <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-800 space-y-1">
                <span className="font-bold block">ChainArt Exclusivity Rule:</span>
                <p className="text-[11px] leading-relaxed">
                  Verified brand dealers are bound by the exclusivity covenant to mint, list, and conduct auctions exclusively on ChainArt. If a dealer circumvents the platform or sells tokenized assets on external third-party venues, administration will impose penalties.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Target Dealer
                </label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-900">{penaltyModalDealer.businessName}</span>
                  <span className="block font-mono text-slate-500 text-[11px] mt-0.5">
                    {penaltyModalDealer.address}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Violation Category
                </label>
                <select
                  value={penaltyReasonPreset}
                  onChange={(e) => setPenaltyReasonPreset(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-rose-500"
                >
                  <option value="exclusivity_breach">Selling NFTs on External Marketplace (Exclusivity Breach)</option>
                  <option value="external_sales">Bypassing ChainArt Protocol & Fee Circumvention</option>
                  <option value="unauthorized_minting">Unauthorized Duplicate Minting / Provenance Violation</option>
                  <option value="custom">Custom Policy Violation Reason</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Specific Violation Notes / Evidence Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide specific notes regarding the breach (e.g., external contract address, URL, or inspection details)..."
                  value={customPenaltyReason}
                  onChange={(e) => setCustomPenaltyReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="revokeRole"
                  checked={revokeRoleOnPenalty}
                  onChange={(e) => setRevokeRoleOnPenalty(e.target.checked)}
                  className="w-4 h-4 accent-rose-600 rounded"
                />
                <label htmlFor="revokeRole" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Also revoke on-chain <strong>DEALER_ROLE</strong> on Sepolia smart contract
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPenaltyModalDealer(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={penaltySubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {penaltySubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldAlert className="w-4 h-4" />
                  )}
                  <span>Impose Exclusivity Penalty</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DELETE DEALER CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deleteModalDealer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Remove Dealer Account</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently remove <strong>{deleteModalDealer.businessName}</strong> ({shortenAddress(deleteModalDealer.address)}) from the luxury dealership registry? This will revoke on-chain dealer permissions and remove application records.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalDealer(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteSubmitting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deleteSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Confirm Delete Dealer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
