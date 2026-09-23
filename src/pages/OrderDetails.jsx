import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { 
  CheckCircle2, 
  Sparkles, 
  ExternalLink, 
  ShoppingBag, 
  Award, 
  ShieldCheck, 
  ArrowRight, 
  Receipt,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { shortenAddress } from '../utils/formatters';
import { orderApi } from '../services/api';

const OrderDetails = () => {
  const { id } = useParams();
  const location = useLocation();

  const [receipt, setReceipt] = useState(location.state?.receipt || null);
  const [loading, setLoading] = useState(!location.state?.receipt);

  useEffect(() => {
    if (!receipt && id) {
      setLoading(true);
      orderApi.getOrderById(id).then((res) => {
        if (res && res.success && res.data && res.data.order) {
          const ord = res.data.order;
          setReceipt({
            orderId: ord._id ? ord._id.slice(-6).toUpperCase() : id.slice(-6).toUpperCase(),
            tokenId: ord.tokenId,
            nftName: res.data.nft ? res.data.nft.title : `NFT #${ord.tokenId}`,
            category: res.data.nft ? (res.data.nft.category?.charAt(0).toUpperCase() + res.data.nft.category?.slice(1)) : 'Luxury',
            image: res.data.nft?.image || '/images/placeholder.jpg',
            buyer: ord.buyer,
            seller: ord.seller,
            quantity: ord.quantity || 1,
            currency: 'ETH',
            totalPrice: ord.totalPriceInEth?.toString() || '0',
            loyaltyPointsEarned: ord.orderType === 'direct_sale' ? 10 : 5,
            txHash: ord.txHash || '',
            timestamp: ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
          });
        }
      }).catch((err) => {
        console.warn("Error loading order receipt:", err);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [id, receipt]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verifying Receipt on Sepolia...</p>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-2xl font-black text-slate-900">Receipt Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested transaction receipt could not be found or has not been confirmed on-chain yet.
        </p>
        <Link
          to="/dashboard/user"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>View Collector Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Success Badge */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-md">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Transaction Confirmed!
        </h1>
        <p className="text-xs text-slate-500">
          Your NFT purchase was successfully verified and settled on Ethereum Sepolia.
        </p>
      </div>

      {/* Digital Receipt Card */}
      <div className="bg-white rounded-3xl border border-pink-100 p-6 sm:p-8 shadow-lg space-y-6">
        <div className="flex items-center justify-between border-b border-pink-100 pb-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-pink-600" />
            <h3 className="font-extrabold text-slate-900 text-base">Order Summary #{receipt.orderId}</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">{receipt.timestamp}</span>
        </div>

        {/* Item Summary */}
        <div className="flex items-center gap-4 p-4 bg-pink-50/40 rounded-2xl border border-pink-100">
          <img
            src={receipt.image || '/images/placeholder.jpg'}
            alt={receipt.nftName}
            className="w-16 h-16 rounded-xl object-cover border border-pink-200"
          />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold text-pink-600 uppercase">{receipt.category || 'Luxury Asset'}</span>
            <h4 className="font-bold text-slate-900 text-sm truncate">{receipt.nftName}</h4>
            <p className="text-xs text-slate-500">Quantity: {receipt.quantity} edition</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Total</span>
            <span className="font-extrabold text-slate-900 text-base">{receipt.totalPrice} {receipt.currency}</span>
          </div>
        </div>

        {/* Fee & Royalty Breakdown */}
        <div className="space-y-2 text-xs text-slate-600 border-b border-slate-100 pb-4">
          <div className="flex justify-between">
            <span>Item Price</span>
            <span className="font-semibold text-slate-900">{(parseFloat(receipt.totalPrice || 0) * 0.925).toFixed(4)} {receipt.currency}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Marketplace Protocol Fee (2.5%)</span>
            <span>{(parseFloat(receipt.totalPrice || 0) * 0.025).toFixed(4)} {receipt.currency}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Creator ERC-2981 Royalty (5.0%)</span>
            <span>{(parseFloat(receipt.totalPrice || 0) * 0.05).toFixed(4)} {receipt.currency}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-sm text-slate-900">
            <span>Amount Charged</span>
            <span className="text-pink-600">{receipt.totalPrice} {receipt.currency}</span>
          </div>
        </div>

        {/* Loyalty Reward Granted */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-2xl border border-pink-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-pink-500 text-white flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Loyalty Cashback Accrued</p>
              <p className="text-[10px] text-slate-500">Contributes to your next 10-sale milestone payout</p>
            </div>
          </div>
          <span className="text-xs font-extrabold text-pink-600 bg-white px-3 py-1 rounded-full border border-pink-200">
            +{receipt.loyaltyPointsEarned} Points
          </span>
        </div>

        {/* Blockchain Tx Link */}
        {receipt.txHash && (
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs font-mono">
            <span className="text-slate-500">Transaction Hash:</span>
            <a
              href={`https://sepolia.etherscan.io/tx/${receipt.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-pink-600 hover:underline flex items-center gap-1 font-bold"
            >
              <span>{shortenAddress(receipt.txHash)}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <Link
            to="/dashboard/user"
            className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl text-center transition-colors"
          >
            View in Collector Dashboard
          </Link>
          <Link
            to="/explore"
            className="py-3 px-4 bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold rounded-xl text-center transition-colors flex items-center justify-center gap-1"
          >
            <span>Continue Exploring</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
