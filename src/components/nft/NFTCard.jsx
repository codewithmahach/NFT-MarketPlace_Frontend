import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Gavel, 
  ShoppingBag, 
  Clock, 
  Flame, 
  ShieldCheck, 
  Layers,
  ArrowUpRight,
  Boxes
} from 'lucide-react';
import Badge from '../common/Badge';
import CountdownTimer from '../common/CountdownTimer';
import { formatETH, shortenAddress, resolveIPFS } from '../../utils/formatters';
import { getCategoryFallbackImage } from '../../config/constants';

const NFTCard = ({ 
  nft, 
  onQuickBuy, 
  onQuickBid, 
  onManageListing 
}) => {
  const navigate = useNavigate();

  if (!nft) return null;

  const isAuction = Boolean(nft.isAuction || nft.listingType === 'auction');
  const isFixedSale = Boolean(nft.isListed && !isAuction && nft.price && parseFloat(nft.price) > 0);
  const imageUrl = resolveIPFS(nft.image, nft.category);

  return (
    <div className="group relative bg-white/90 backdrop-blur-sm rounded-2xl border border-pink-100/90 hover:border-pink-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1">
      {/* Image & Badges Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100 cursor-pointer" onClick={() => navigate(`/nft/${nft.id}`)}>
        <img
          src={imageUrl}
          alt={nft.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = getCategoryFallbackImage(nft.category);
          }}
        />

        {/* Top Floating Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <Badge variant="cyan" size="sm" className="shadow-md backdrop-blur-md bg-cyan-50/90 font-semibold">
            {nft.category || 'Collectibles'}
          </Badge>

          {isAuction ? (
            <Badge variant="pink" size="sm" className="shadow-md backdrop-blur-md bg-pink-500/90 text-white font-semibold flex items-center gap-1">
              <Gavel className="w-3 h-3" />
              <span>Live Auction</span>
            </Badge>
          ) : isFixedSale ? (
            <Badge variant="purple" size="sm" className="shadow-md backdrop-blur-md bg-purple-600/90 text-white font-semibold flex items-center gap-1">
              <ShoppingBag className="w-3 h-3" />
              <span>Fixed Price: {formatETH(nft.price)} ETH</span>
            </Badge>
          ) : (
            <Badge variant="neutral" size="sm" className="shadow-md backdrop-blur-md bg-slate-800/80 text-white font-semibold flex items-center gap-1">
              <Boxes className="w-3 h-3 text-cyan-400" />
              <span>Vault Stock (Unlisted)</span>
            </Badge>
          )}
        </div>

        {/* Live Auction Timer Floating on Bottom of Image */}
        {isAuction && (nft.endTime || nft.auctionEndTime) && (
          <div className="absolute bottom-3 left-3 right-3 bg-slate-900/80 backdrop-blur-md rounded-xl p-2 text-white flex items-center justify-between text-xs border border-white/10 shadow-lg">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Clock className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
              <span>Ends in:</span>
            </div>
            <CountdownTimer targetTimestamp={nft.endTime || nft.auctionEndTime} compact />
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        {/* Title & Token ID */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
            <span className="font-mono">#{nft.id}</span>
            <div className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-slate-400" />
              <span>{nft.availableSupply || nft.supply || 1}/{nft.maxSupply || nft.supply || 1} Editions</span>
            </div>
          </div>

          <Link to={`/nft/${nft.id}`} className="hover:text-pink-600 transition-colors">
            <h3 className="font-bold text-slate-800 text-base truncate" title={nft.name}>
              {nft.name}
            </h3>
          </Link>

          {/* Creator / Dealer Details */}
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
            <span>By</span>
            <span className="font-medium text-slate-700 font-mono">
              {shortenAddress(nft.creator || nft.seller || '0x0000000000000000000000000000000000000000')}
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-500 inline fill-cyan-50" title="Verified Dealer" />
          </div>
        </div>

        {/* Price & Action Section */}
        <div className="pt-3 border-t border-pink-100/70 flex items-end justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              {isAuction ? 'Current Highest Bid' : isFixedSale ? 'Price Per Edition' : 'Market Status'}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              {isAuction ? (
                <>
                  <span className="text-base font-extrabold text-slate-900 bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
                    {formatETH(nft.highestBid || nft.startPrice || 0)}
                  </span>
                  <span className="text-xs font-bold text-slate-500">ETH</span>
                </>
              ) : isFixedSale ? (
                <>
                  <span className="text-base font-extrabold text-slate-900 bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
                    {formatETH(nft.price || 0)}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {nft.currency === 1 ? 'USDT' : 'ETH'}
                  </span>
                </>
              ) : (
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  Minted • In Vault
                </span>
              )}
            </div>
          </div>

          {/* Quick Action Button */}
          {isAuction ? (
            <button
              onClick={() => (onQuickBid ? onQuickBid(nft) : navigate(`/nft/${nft.id}`))}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-md shadow-pink-200 hover:shadow-pink-300 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <span>Bid</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          ) : isFixedSale ? (
            <button
              onClick={() => (onQuickBuy ? onQuickBuy(nft) : navigate(`/nft/${nft.id}`))}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-slate-300 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <span>Buy</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Link
              to={`/nft/${nft.id}`}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-pink-50 hover:bg-pink-100 text-pink-700 transition-colors flex items-center gap-1"
            >
              <span>View / List</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default NFTCard;
