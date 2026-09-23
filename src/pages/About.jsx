import React from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  Award, 
  Gavel, 
  ShoppingBag, 
  ExternalLink,
  Code2,
  Lock,
  Zap,
  Gem,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 crypto-watermark-overlay">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-100/90 text-pink-700 text-xs font-bold border border-pink-200 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-pink-500" />
          <span>ChainArt ERC-1155 Architecture Overview</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight">
          The Future of Real-World Luxury Assets & <br />
          <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Loyalty-Powered Web3 Trading
          </span>
        </h1>
        <p className="text-base text-slate-600 leading-relaxed font-medium">
          <strong>Mint • List • Buy • Sell • Bid • Earn Rewards.</strong> ChainArt is built completely on the <strong>ERC-1155 Multi-Token Standard</strong> on Ethereum Sepolia, enabling tokenization of physical & digital luxury assets (Cars, Watches, Perfumes, Art, Handbags, Shoes, Jewelry, Collectibles).
        </p>
      </div>

      {/* Standards Explanation Box */}
      <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-cyan-50 rounded-3xl p-6 sm:p-8 border border-pink-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-pink-600 font-extrabold text-sm uppercase tracking-wider">
          <Code2 className="w-5 h-5" />
          <span>ERC-1155 Core Standard & ERC-2981 Royalty Integration</span>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          The smart contract code deployed on Sepolia (<code>ChainArtNFT.sol</code>) is an <strong>ERC-1155 Multi-Token contract</strong>. 
          Inside the ERC-1155 contract, the <strong>ERC-2981 Royalty Standard</strong> is implemented as an internal feature so that whenever any ERC-1155 token edition is traded on the secondary marketplace, the original verified dealer/artist automatically receives their <strong>5.0% royalty fee</strong>.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="bg-white p-4 rounded-2xl border border-pink-100 text-xs">
            <span className="font-bold text-slate-900 block mb-1">🏷️ ERC-1155 Token Standard</span>
            <p className="text-slate-500">
              Powers all luxury assets, supporting 1/1 unique master items or batch editions (e.g. 10/10 editions of a luxury watch) with partial quantity checkout.
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-pink-100 text-xs">
            <span className="font-bold text-slate-900 block mb-1">🛡️ ERC-2981 Royalty Standard (Built-in)</span>
            <p className="text-slate-500">
              On-chain royalty formula (500 bps = 5.0%) programmed directly inside the ERC-1155 contract to protect authentic creator earnings on all resales.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Architectural Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-pink-100 p-6 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-lg">ERC-1155 Multi-Token</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Multi-category token standard supporting both 1-of-1 master items and limited editions with partial quantity checkout.
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-pink-100 p-6 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-lg">UUPS Upgradeable</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Four interconnected UUPS upgradeable proxies deployed on Ethereum Sepolia ensure seamless protocol enhancements while preserving all storage and funds.
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-pink-100 p-6 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-lg">On-Chain Royalties</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Enforces 5.0% on-chain secondary royalties directly to authorized luxury dealers and creators on every subsequent transaction.
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-pink-100 p-6 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-lg">Built-in Loyalty Loop</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Buyers earn points on every trade, advancing through tiers and claiming automated 0.05 ETH milestone reward bonuses every 10 purchases.
          </p>
        </div>
      </div>

      {/* Contract Verification Table */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-pink-100 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h3 className="font-extrabold text-slate-900 text-xl">Deployed Proxy Smart Contracts</h3>
          <p className="text-xs text-slate-500 mt-1">Live and verified on Ethereum Sepolia Testnet (Chain ID: 11155111)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-pink-50/50 rounded-2xl border border-pink-100 space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-bold text-xs text-pink-700">ChainArtNFT (ERC-1155 Multi-Token)</span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded font-bold text-slate-600">UUPS Proxy</span>
            </div>
            <p className="text-xs font-mono text-slate-800">{CONTRACT_ADDRESSES.ChainArtNFT}</p>
            <a
              href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESSES.ChainArtNFT}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-pink-600 hover:underline pt-1"
            >
              <span>Verify on Etherscan</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-bold text-xs text-purple-700">ChainArtMarketplace (Fixed Price)</span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded font-bold text-slate-600">UUPS Proxy</span>
            </div>
            <p className="text-xs font-mono text-slate-800">{CONTRACT_ADDRESSES.ChainArtMarketplace}</p>
            <a
              href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESSES.ChainArtMarketplace}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:underline pt-1"
            >
              <span>Verify on Etherscan</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-4 bg-cyan-50/50 rounded-2xl border border-cyan-100 space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-bold text-xs text-cyan-700">ChainArtAuction (English Bidding)</span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded font-bold text-slate-600">UUPS Proxy</span>
            </div>
            <p className="text-xs font-mono text-slate-800">{CONTRACT_ADDRESSES.ChainArtAuction}</p>
            <a
              href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESSES.ChainArtAuction}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-600 hover:underline pt-1"
            >
              <span>Verify on Etherscan</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-bold text-xs text-emerald-700">ChainArtLoyalty (Points & Claims)</span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded font-bold text-slate-600">UUPS Proxy</span>
            </div>
            <p className="text-xs font-mono text-slate-800">{CONTRACT_ADDRESSES.ChainArtLoyalty}</p>
            <a
              href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESSES.ChainArtLoyalty}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:underline pt-1"
            >
              <span>Verify on Etherscan</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
