import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Shield, Award, Layers, ExternalLink, Heart } from 'lucide-react';
import { CONTRACT_ADDRESSES } from '../../config/contracts';
import { shortenAddress } from '../../utils/formatters';

const Footer = () => {
  const nftAddr = CONTRACT_ADDRESSES.ChainArtNFT || CONTRACT_ADDRESSES.nft || '0x0f111da5e9364656F54b5F402F1B8D2598808ba5';
  const marketAddr = CONTRACT_ADDRESSES.ChainArtMarketplace || CONTRACT_ADDRESSES.marketplace || '0x09671389c8666615F76CE06445465fb9b840110A';
  const auctionAddr = CONTRACT_ADDRESSES.ChainArtAuction || CONTRACT_ADDRESSES.auction || '0x6770771d0cB72f6853741d2Fa21A30817F5987d0';
  const loyaltyAddr = CONTRACT_ADDRESSES.ChainArtLoyalty || CONTRACT_ADDRESSES.loyalty || '0xa6c74aE1348932243B1C9f757755D27E652eE306';

  return (
    <footer className="bg-white/80 backdrop-blur-md border-t border-pink-100 text-slate-600 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 via-pink-400 to-indigo-500 flex items-center justify-center shadow-md shadow-pink-200">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
                  ChainArt
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                  Loyalty NFT Marketplace
                </span>
              </div>
            </Link>
            <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
              Mint • List • Buy • Sell • Bid • Earn Rewards. Experience next-generation decentralized trading with built-in buyer loyalty tiers, pull-payment security, and multi-category luxury NFTs.
            </p>
            <div className="flex items-center space-x-4 pt-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-50 text-cyan-700 border border-cyan-200">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping mr-1.5"></span>
                Ethereum Sepolia
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-pink-50 text-pink-700 border border-pink-200">
                UUPS Upgradeable
              </span>
            </div>
          </div>

          {/* Marketplace Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              Marketplace
            </h4>
            <ul className="space-y-2 text-sm font-medium">
              <li>
                <Link to="/explore" className="hover:text-pink-600 transition-colors">
                  Explore Collections
                </Link>
              </li>
              <li>
                <Link to="/marketplace" className="hover:text-pink-600 transition-colors">
                  Fixed Price Listings
                </Link>
              </li>
              <li>
                <Link to="/auctions" className="hover:text-pink-600 transition-colors">
                  Live Auctions
                </Link>
              </li>
              <li>
                <Link to="/loyalty" className="hover:text-pink-600 transition-colors flex items-center gap-1.5">
                  Loyalty Rewards
                  <span className="bg-pink-100 text-pink-600 text-[10px] px-1.5 py-0.5 rounded font-bold">Earn</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Dashboards Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              Dashboards
            </h4>
            <ul className="space-y-2 text-sm font-medium">
              <li>
                <Link to="/dashboard/user" className="hover:text-pink-600 transition-colors">
                  Collector Dashboard
                </Link>
              </li>
              <li>
                <Link to="/dashboard/dealer" className="hover:text-pink-600 transition-colors flex items-center gap-1.5">
                  Dealer Portal
                  <span className="bg-purple-100 text-purple-600 text-[10px] px-1.5 py-0.5 rounded font-bold">Mint</span>
                </Link>
              </li>
              <li>
                <Link to="/dashboard/admin" className="hover:text-pink-600 transition-colors">
                  Governance Admin
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-pink-600 transition-colors">
                  Platform Architecture
                </Link>
              </li>
            </ul>
          </div>

          {/* Smart Contracts Verified */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              Contracts (Sepolia)
            </h4>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <a
                  href={`https://sepolia.etherscan.io/address/${nftAddr}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-pink-600 flex items-center gap-1 text-slate-500"
                >
                  <span>NFT: {shortenAddress(nftAddr)}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href={`https://sepolia.etherscan.io/address/${marketAddr}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-pink-600 flex items-center gap-1 text-slate-500"
                >
                  <span>Market: {shortenAddress(marketAddr)}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href={`https://sepolia.etherscan.io/address/${auctionAddr}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-pink-600 flex items-center gap-1 text-slate-500"
                >
                  <span>Auction: {shortenAddress(auctionAddr)}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href={`https://sepolia.etherscan.io/address/${loyaltyAddr}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-pink-600 flex items-center gap-1 text-slate-500"
                >
                  <span>Loyalty: {shortenAddress(loyaltyAddr)}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-pink-100/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} ChainArt Marketplace. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1 text-slate-500">
              Built with <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" /> for Web3 Collectors & Dealers
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
