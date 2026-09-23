import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useWeb3 } from "../../context/Web3Context";
import { shortenAddress } from "../../utils/formatters";
import {
  Wallet,
  Menu,
  X,
  Search,
  Award,
  Sparkles,
  ShieldCheck,
  LayoutDashboard,
  ChevronDown,
  AlertTriangle,
  Gavel,
  ShoppingBag,
  Compass,
  PlusCircle,
  Building2,
  Bell
} from "lucide-react";

export function Navbar({ onOpenSidebar }) {
  const { account, balance, isConnecting, isCorrectNetwork, isDealer, isAdmin, connectWallet, switchNetwork } = useWeb3();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardDropdownOpen, setDashboardDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  useEffect(() => {
    setMobileMenuOpen(false);
    setDashboardDropdownOpen(false);
  }, [location.pathname]);

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-pink-100/80 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <img
              src="/logo.svg"
              alt="ChainArt Logo"
              className="h-10 w-auto transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Search Bar (Desktop) */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Rolex, Ferrari, Birkin, Diamonds... (Ctrl + K)"
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-50/80 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
            />
          </form>

          {/* Navigation Links (Desktop) */}
          <div className="hidden lg:flex items-center gap-5">
            <Link
              to="/explore"
              className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                location.pathname === "/explore" ? "text-pink-600" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Explore</span>
            </Link>

            <Link
              to="/marketplace"
              className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                location.pathname === "/marketplace" ? "text-pink-600" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Marketplace</span>
            </Link>

            <Link
              to="/auctions"
              className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                location.pathname === "/auctions" ? "text-pink-600" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Gavel className="w-4 h-4" />
              <span>Auctions</span>
            </Link>

            <Link
              to="/loyalty"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all ${
                location.pathname === "/loyalty"
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-sm shadow-pink-500/20"
                  : "bg-pink-50 text-pink-600 hover:bg-pink-100 border border-pink-100"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Loyalty Rewards</span>
            </Link>

            <Link
              to="/apply-dealership"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all ${
                location.pathname === "/apply-dealership"
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-500/20"
                  : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Apply Dealership</span>
            </Link>
          </div>

          {/* Right Action: Network & Wallet Controls */}
          <div className="flex items-center gap-3">
            {account && !isCorrectNetwork && (
              <button
                onClick={switchNetwork}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 animate-pulse transition-all cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Switch to Sepolia</span>
              </button>
            )}

            {account && isCorrectNetwork && (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                <span>Sepolia</span>
              </div>
            )}

            {account ? (
              <div className="relative">
                <button
                  onClick={() => setDashboardDropdownOpen(!dashboardDropdownOpen)}
                  className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all shadow-sm cursor-pointer"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{parseFloat(balance).toFixed(3)} ETH</span>
                  <span className="text-slate-400 font-normal">|</span>
                  <span>{shortenAddress(account)}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dashboard Menu Dropdown */}
                {dashboardDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-pink-100 py-2 z-50 animate-scaleUp">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-400 font-medium">Connected Wallet</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{shortenAddress(account, 6)}</p>
                    </div>

                    <Link
                      to="/dashboard/user"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-pink-50/50 font-medium"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-400" />
                      <span>Collector Dashboard</span>
                    </Link>

                    <Link
                      to="/dashboard/dealer"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-pink-600 hover:bg-pink-50/50 font-medium"
                    >
                      <PlusCircle className="w-4 h-4 text-pink-500" />
                      <span>Dealer Studio (Mint)</span>
                    </Link>

                    <Link
                      to="/dashboard/admin"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-purple-600 hover:bg-pink-50/50 font-medium"
                    >
                      <ShieldCheck className="w-4 h-4 text-purple-500" />
                      <span>Admin Protocol Supervision</span>
                    </Link>

                    <Link
                      to="/apply-dealership"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-indigo-600 hover:bg-pink-50/50 font-medium"
                    >
                      <Building2 className="w-4 h-4 text-indigo-500" />
                      <span>Dealership Portal</span>
                    </Link>

                    <Link
                      to="/loyalty"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-700 hover:bg-pink-50/50 font-medium border-t border-slate-100"
                    >
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>Loyalty Rewards</span>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:opacity-95 text-white text-sm font-bold shadow-md shadow-pink-500/25 transition-all cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
              </button>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => (onOpenSidebar ? onOpenSidebar() : setMobileMenuOpen(!mobileMenuOpen))}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-pink-100 px-4 pt-2 pb-6 space-y-3 animate-fadeIn">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search collections..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-sm text-slate-900"
              />
            </div>
          </form>

          <Link to="/explore" className="block py-2 text-sm font-semibold text-slate-700">Explore Collections</Link>
          <Link to="/marketplace" className="block py-2 text-sm font-semibold text-slate-700">Marketplace Listings</Link>
          <Link to="/auctions" className="block py-2 text-sm font-semibold text-slate-700">Live Auctions</Link>
          <Link to="/loyalty" className="block py-2 text-sm font-semibold text-pink-600">Loyalty & Milestone Rewards</Link>
          <Link to="/apply-dealership" className="block py-2 text-sm font-semibold text-purple-700">Apply for Dealership</Link>
          <Link to="/about" className="block py-2 text-sm font-semibold text-slate-700">About ChainArt (ERC-1155)</Link>

          {account && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <Link to="/dashboard/user" className="block py-2 text-sm font-semibold text-slate-900">User Dashboard</Link>
              <Link to="/dashboard/dealer" className="block py-2 text-sm font-semibold text-pink-600">Dealer Dashboard</Link>
              <Link to="/dashboard/admin" className="block py-2 text-sm font-semibold text-purple-600">Admin Supervision Dashboard</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
