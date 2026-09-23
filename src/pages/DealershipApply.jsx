import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, 
  ShieldCheck, 
  Building2, 
  Globe, 
  Mail, 
  Wallet, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  Layers, 
  Award,
  Lock
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { useNotification } from '../context/NotificationContext';
import { CATEGORIES } from '../config/constants';
import { shortenAddress } from '../utils/formatters';
import { dealerApi } from '../services/api';

const DealershipApply = () => {
  const { account, isConnected, connectWallet, isDealer } = useWeb3();
  const { showToast, triggerConfetti } = useNotification();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    businessName: '',
    category: 'Watches',
    website: '',
    email: '',
    walletAddress: account || '',
    location: 'Geneva, Switzerland',
    registrationNumber: '',
    description: '',
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [existingApplication, setExistingApplication] = useState(null);

  // Sync wallet address and check existing application
  React.useEffect(() => {
    if (account) {
      if (!formData.walletAddress) {
        setFormData((prev) => ({ ...prev, walletAddress: account }));
      }
      dealerApi.getMyApplication(account).then((res) => {
        if (res && res.success && res.data && res.data.application) {
          setExistingApplication(res.data.application);
        }
      }).catch(() => {});
    }
  }, [account]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.businessName || !formData.email || !formData.walletAddress) {
      showToast('Please complete all required fields.', 'error');
      return;
    }

    const payload = {
      applicantAddress: formData.walletAddress.toLowerCase(),
      businessName: formData.businessName,
      contactPerson: formData.businessName,
      email: formData.email,
      category: formData.category.toLowerCase(),
      website: formData.website || 'https://chainart.luxury',
      physicalStoreAddress: formData.location || 'Geneva, Switzerland',
      provenanceProcess: formData.description || 'Verified luxury boutique provenance.',
      yearsInBusiness: '5',
    };

    // 1. Save locally for instant UI sync
    try {
      const localApp = {
        id: 'app_' + Date.now(),
        applicantName: formData.businessName,
        applicantAddress: formData.walletAddress,
        category: formData.category,
        website: formData.website || 'https://chainart.luxury',
        contactEmail: formData.email,
        verificationStatus: 'Pending',
        appliedDate: new Date().toLocaleDateString(),
        notes: formData.description || 'Application submitted for admin review.',
        raw: payload,
      };

      const existingLocal = JSON.parse(localStorage.getItem('chainart_local_applications') || '[]');
      const filtered = existingLocal.filter(
        (a) => a.applicantAddress?.toLowerCase() !== formData.walletAddress.toLowerCase()
      );
      filtered.unshift(localApp);
      localStorage.setItem('chainart_local_applications', JSON.stringify(filtered));
      setExistingApplication(payload);
    } catch (err) {
      console.warn("Local storage write error:", err);
    }

    // 2. Transmit to backend API
    try {
      await dealerApi.apply(payload);
    } catch (err) {
      console.warn("Backend submission fallback:", err);
    }

    setIsSubmitted(true);
    triggerConfetti();
    showToast('Dealership application submitted for Admin review!', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 crypto-watermark-overlay">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl border border-pink-500/20">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-pink-500/20 via-purple-500/20 to-transparent blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-400/40 text-pink-300 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ChainArt Verified Dealer Accreditation</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Apply for Verified Luxury Dealership
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Become an authorized dealer on the ChainArt protocol. Mint authentic multi-category luxury ERC-1155 editions, configure on-chain creator royalties, and launch live English auctions on Ethereum Sepolia.
          </p>
        </div>
      </div>

      {/* Dealer Privileges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-pink-100 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <h4 className="font-extrabold text-slate-900 text-sm">Authorized Minting Suite</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Direct access to mint ERC-1155 master items and batch editions on the deployed Sepolia proxy contract.
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-pink-100 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <h4 className="font-extrabold text-slate-900 text-sm">ERC-2981 Royalties</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Earn automatic 5.0% on-chain secondary royalties paid directly to your dealer wallet on every resale.
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-pink-100 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="font-extrabold text-slate-900 text-sm">Verified Badge & Status</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Authenticity badge displayed across all marketplace listings and collection leaderboards.
          </p>
        </div>
      </div>

      {/* Main Application Form or Success State */}
      {isSubmitted ? (
        <div className="bg-white rounded-3xl border border-pink-200 p-8 sm:p-12 text-center shadow-lg space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">Application Submitted for On-Chain Review!</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
              Your dealership application for <strong>{formData.businessName}</strong> ({formData.category}) has been logged in the Admin Governance queue.
            </p>
          </div>

          {/* Details Summary */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2 max-w-md mx-auto">
            <div className="flex justify-between">
              <span className="text-slate-400">Target Wallet:</span>
              <span className="font-mono font-bold text-slate-800">{shortenAddress(formData.walletAddress, 6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Category:</span>
              <span className="font-bold text-pink-600">{formData.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Pending Admin Approval</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/dashboard/admin"
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              View in Admin Governance Queue
            </Link>
            <Link
              to="/explore"
              className="px-6 py-3 bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-xs rounded-xl transition-all"
            >
              Explore Marketplace
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-pink-100 p-6 sm:p-8 shadow-lg space-y-6">
          <div className="border-b border-pink-100 pb-4">
            <h3 className="font-extrabold text-slate-900 text-lg">Dealership Application Form</h3>
            <p className="text-xs text-slate-500 mt-0.5">Please provide authentic credentials for your luxury brand or boutique.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Business Name */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Brand / Boutique Business Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="e.g., Geneva Horology & Co."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
                />
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Primary Category */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Primary Luxury Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-pink-500 focus:outline-none"
              >
                {CATEGORIES.filter(c => c !== 'All').map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Official Website */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Official Website / Online Boutique *
              </label>
              <div className="relative">
                <input
                  type="url"
                  required
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
                />
                <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Contact Email */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Official Contact Email *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="concierge@brand.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Ethereum Address */}
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex justify-between items-center">
                <span>Ethereum Sepolia Address (For Minting & Royalties) *</span>
                {account && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, walletAddress: account })}
                    className="text-pink-600 hover:underline text-[11px] font-bold"
                  >
                    Use Connected Wallet
                  </button>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.walletAddress}
                  onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                  placeholder="0x..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
                />
                <Wallet className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Business Registration */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Business Registration / Chamber ID
              </label>
              <input
                type="text"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                placeholder="e.g., CHE-123.456.789"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-pink-500 focus:outline-none"
              />
            </div>

            {/* Boutique Location */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Headquarters / Boutique Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Milan, Italy"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-pink-500 focus:outline-none"
              />
            </div>

            {/* Description & Catalog details */}
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Brand Overview & Tokenization Plan
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Briefly describe your luxury inventory, physical vault custody, and planned NFT drops..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-pink-500 focus:outline-none"
              />
            </div>

            {/* Exclusivity Covenant */}
            <div className="md:col-span-2 p-4 bg-purple-50/70 border border-purple-200 rounded-2xl flex items-start gap-3">
              <input
                type="checkbox"
                id="exclusivityCovenant"
                required
                defaultChecked={true}
                className="w-4 h-4 mt-0.5 accent-pink-600 rounded cursor-pointer"
              />
              <label htmlFor="exclusivityCovenant" className="text-xs text-purple-900 leading-relaxed cursor-pointer">
                <strong>ChainArt Exclusivity Covenant:</strong> I agree that as an authorized ChainArt luxury dealer, all minted collections and digital twins will be tokenized, listed, and traded exclusively on the ChainArt protocol. Unauthorized secondary listings on third-party platforms are prohibited and subject to protocol penalties.
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl font-extrabold text-white text-sm bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 shadow-lg shadow-pink-200 hover:shadow-pink-300 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Submit Dealership Application</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DealershipApply;
