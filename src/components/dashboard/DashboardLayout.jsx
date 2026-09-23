import React from 'react';
import { NavLink } from 'react-router-dom';
import { useWeb3 } from '../../context/Web3Context';
import { 
  User, 
  PlusCircle, 
  ShieldCheck, 
  Wallet, 
  Layers, 
  Award, 
  AlertCircle 
} from 'lucide-react';
import { shortenAddress } from '../../utils/formatters';

const DashboardLayout = ({ title, subtitle, children }) => {
  const { account, isConnected, isDealer, isAdmin, connectWallet } = useWeb3();

  return (
    <div className="min-h-[80vh] py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Dashboard Top Banner */}
      <div className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10 rounded-3xl p-6 sm:p-8 border border-pink-200/60 mb-8 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              {subtitle}
            </p>
          </div>

          {/* Connected User Badge */}
          {isConnected ? (
            <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-pink-200 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-pink-400 flex items-center justify-center font-bold text-white shadow-sm">
                {account.slice(2, 4).toUpperCase()}
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-800">{shortenAddress(account)}</span>
                  {isAdmin && (
                    <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 font-bold rounded text-[10px]">
                      Admin
                    </span>
                  )}
                  {isDealer && (
                    <span className="px-1.5 py-0.2 bg-cyan-100 text-cyan-700 font-bold rounded text-[10px]">
                      Dealer
                    </span>
                  )}
                </div>
                <span className="text-slate-400 text-[11px]">Ethereum Sepolia</span>
              </div>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center gap-2 shadow-md"
            >
              <Wallet className="w-4 h-4" />
              <span>Connect Wallet to Access</span>
            </button>
          )}
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 border-t border-pink-200/50 pt-4">
          <NavLink
            to="/dashboard/user"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-white text-pink-600 shadow-sm border border-pink-200'
                  : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
              }`
            }
          >
            <User className="w-3.5 h-3.5" />
            <span>Collector Dashboard</span>
          </NavLink>

          <NavLink
            to="/dashboard/dealer"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-white text-pink-600 shadow-sm border border-pink-200'
                  : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
              }`
            }
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Dealer Studio</span>
            <span className="px-1.5 py-0.2 bg-pink-100 text-pink-700 rounded-full text-[10px] font-bold">
              Mint
            </span>
          </NavLink>

          <NavLink
            to="/dashboard/admin"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-white text-pink-600 shadow-sm border border-pink-200'
                  : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
              }`
            }
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Governance</span>
          </NavLink>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div>{children}</div>
    </div>
  );
};

export default DashboardLayout;
