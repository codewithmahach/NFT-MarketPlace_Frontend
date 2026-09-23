import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  ShoppingBag, 
  Gavel, 
  Award, 
  PlusCircle, 
  User, 
  ShieldCheck, 
  Layers, 
  Wallet,
  Sparkles,
  TrendingUp,
  Info,
  Building2
} from 'lucide-react';
import { useWeb3 } from '../../context/Web3Context';

const Sidebar = ({ isOpen, onClose }) => {
  const { isDealer, isAdmin, isConnected } = useWeb3();

  const links = [
    { name: 'Explore All', path: '/explore', icon: Layers },
    { name: 'Fixed Marketplace', path: '/marketplace', icon: ShoppingBag },
    { name: 'Live Auctions', path: '/auctions', icon: Gavel, badge: 'Live' },
    { name: 'Loyalty Rewards', path: '/loyalty', icon: Award, highlight: true },
    { name: 'Apply Dealership', path: '/apply-dealership', icon: Building2, badge: 'Apply' },
    { name: 'Collector Dashboard', path: '/dashboard/user', icon: User },
    { name: 'Dealer Studio', path: '/dashboard/dealer', icon: PlusCircle, badge: 'Mint' },
    { name: 'Admin Protocol Supervision', path: '/dashboard/admin', icon: ShieldCheck, badge: 'Admin' },
    { name: 'About ChainArt (ERC-1155)', path: '/about', icon: Info },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer / Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl border-r border-pink-100 shadow-xl transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-pink-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 via-pink-400 to-indigo-500 flex items-center justify-center shadow-md shadow-pink-200">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <span className="font-extrabold text-xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
                ChainArt
              </span>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              ✕
            </button>
          </div>

          {/* Nav List */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-200 font-semibold'
                        : 'text-slate-600 hover:bg-pink-50/60 hover:text-pink-600'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </div>
                  {link.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-pink-100 text-pink-700 border border-pink-200">
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="p-4 border-t border-pink-100 bg-slate-50/50">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>Sepolia Network Connected</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
