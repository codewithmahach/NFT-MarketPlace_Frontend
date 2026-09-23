import React, { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import { useNFT } from '../../hooks/useNFT';
import { useWeb3 } from '../../context/Web3Context';
import { CATEGORIES } from '../../config/constants';
import { 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Image as ImageIcon, 
  Tag, 
  Percent, 
  UploadCloud, 
  Coins, 
  AlertCircle, 
  CheckCircle2, 
  FileUp, 
  Loader2,
  Trash2,
  Building2,
  Link as LinkIcon
} from 'lucide-react';
import { nftApi, dealerApi } from '../../services/api';
import { shortenAddress } from '../../utils/formatters';
import { Link } from 'react-router-dom';

const DEFAULT_CATEGORY_IMAGES = {
  Watches: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
  Cars: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&w=1200&q=80',
  Jewelry: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80',
  Handbags: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80',
  Art: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
  Shoes: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1200&q=80',
  Spirits: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=1200&q=80',
  Antiques: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
  Fashion: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1200&q=80',
};

const MintModal = ({ isOpen, onClose, onMintSuccess }) => {
  const { isDealer, isAdmin, account, jwtToken } = useWeb3();
  const { createNFT, loading: mintLoading } = useNFT();

  // Form Fields
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [category, setCategory] = useState('Jewelry');
  const [description, setDescription] = useState('');
  const [editions, setEditions] = useState('10');
  const [royaltyPercentage, setRoyaltyPercentage] = useState('5.0');
  
  // Dealer / Brand Selection State
  const [dealersList, setDealersList] = useState([]);
  const [selectedDealerAddress, setSelectedDealerAddress] = useState(account || '');
  const [activeBrandName, setActiveBrandName] = useState('');

  // Image & Pinata / Local Upload State
  const [imageMode, setImageMode] = useState('upload'); // 'upload' | 'url'
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(DEFAULT_CATEGORY_IMAGES.Jewelry);
  const [ipfsImageUri, setIpfsImageUri] = useState('');
  const [ipfsGatewayUrl, setIpfsGatewayUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [currentStep, setCurrentStep] = useState('idle'); // 'idle' | 'uploading' | 'metadata' | 'blockchain' | 'syncing'
  const fileInputRef = useRef(null);

  // Load verified dealers when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (account) {
      setSelectedDealerAddress(account.toLowerCase());
    }

    dealerApi.getVerifiedDealers().then((res) => {
      if (res && res.success && res.data) {
        setDealersList(res.data);
        const match = res.data.find(
          (d) => d.address.toLowerCase() === (account || '').toLowerCase()
        );
        if (match) {
          setActiveBrandName(match.businessName);
          setSelectedDealerAddress(match.address.toLowerCase());
        } else if (res.data.length > 0 && !selectedDealerAddress) {
          setSelectedDealerAddress(res.data[0].address.toLowerCase());
          setActiveBrandName(res.data[0].businessName);
        }
      }
    }).catch(() => {});
  }, [isOpen, account]);

  const handleDealerSelect = (addr) => {
    setSelectedDealerAddress(addr.toLowerCase());
    const match = dealersList.find((d) => d.address.toLowerCase() === addr.toLowerCase());
    if (match) {
      setActiveBrandName(match.businessName);
      if (match.category && CATEGORIES.includes(match.category)) {
        handleCategoryChange(match.category);
      }
    }
  };

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    if (!selectedFile && !customImageUrl && DEFAULT_CATEGORY_IMAGES[newCat]) {
      setPreviewUrl(DEFAULT_CATEGORY_IMAGES[newCat]);
    }
  };

  // When dealer picks an image file from computer
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setIpfsImageUri('');
    setIpfsGatewayUrl('');
    setIsUploadingImage(true);
    setCurrentStep('uploading');

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('name', name || file.name);

      const uploadRes = await nftApi.uploadImage(formData, jwtToken);

      if (uploadRes && uploadRes.success && uploadRes.data) {
        const { ipfsUri, gatewayUrl } = uploadRes.data;
        setIpfsImageUri(ipfsUri);
        setIpfsGatewayUrl(gatewayUrl);
      }
    } catch (err) {
      console.warn('Direct image upload fallback:', err);
    } finally {
      setIsUploadingImage(false);
      setCurrentStep('idle');
    }
  };

  const handleRemoveImage = (e) => {
    e?.stopPropagation();
    setSelectedFile(null);
    setIpfsImageUri('');
    setIpfsGatewayUrl('');
    setCustomImageUrl('');
    setPreviewUrl(DEFAULT_CATEGORY_IMAGES[category] || DEFAULT_CATEGORY_IMAGES.Jewelry);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCustomUrlChange = (url) => {
    setCustomImageUrl(url);
    if (url.trim()) {
      setPreviewUrl(url.trim());
      setIpfsGatewayUrl(url.trim());
      setIpfsImageUri(url.trim());
    } else {
      setPreviewUrl(DEFAULT_CATEGORY_IMAGES[category] || DEFAULT_CATEGORY_IMAGES.Jewelry);
      setIpfsGatewayUrl('');
      setIpfsImageUri('');
    }
  };

  const handleMint = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const targetCreator = (selectedDealerAddress || account || '').toLowerCase();

      // 1. If image file was selected but not uploaded yet, upload now
      let finalImageUri = customImageUrl.trim() || ipfsGatewayUrl || ipfsImageUri;
      if (imageMode === 'upload' && selectedFile && !finalImageUri) {
        setCurrentStep('uploading');
        setIsUploadingImage(true);
        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('name', name || selectedFile.name);
        const uploadRes = await nftApi.uploadImage(formData, jwtToken);
        if (uploadRes && uploadRes.success && uploadRes.data) {
          finalImageUri = uploadRes.data.gatewayUrl || uploadRes.data.localUrl || uploadRes.data.ipfsUri;
          setIpfsImageUri(uploadRes.data.ipfsUri || '');
          setIpfsGatewayUrl(uploadRes.data.gatewayUrl || uploadRes.data.localUrl || '');
        }
        setIsUploadingImage(false);
      }

      if (!finalImageUri) {
        finalImageUri = previewUrl;
      }

      // 2. Automatically generate Pinata IPFS metadata JSON
      setCurrentStep('metadata');
      const royaltyBps = Math.floor(parseFloat(royaltyPercentage) * 100);
      const totalCopies = parseInt(editions, 10) || 10;
      let finalTokenURI = `ipfs://bafkrei${Math.random().toString(36).substring(2, 15)}/metadata.json`;

      try {
        const metaRes = await nftApi.generateMetadata(
          {
            name,
            symbol: symbol || `${name.slice(0, 4).toUpperCase()}`,
            category,
            description: description || `Authentic ${category} collectible with verified provenance.`,
            image: finalImageUri,
            initialSupply: totalCopies,
            maxSupply: totalCopies,
            royaltyBps,
            creator: targetCreator,
            attributes: [
              { trait_type: "Category", value: category },
              { trait_type: "Symbol", value: symbol || "LUX" },
              { trait_type: "Total Supply", value: `${totalCopies} Editions` },
              { trait_type: "Authenticity", value: "Verified Brand Dealer" },
              { trait_type: "Brand", value: activeBrandName || "Luxury Dealer" },
            ]
          },
          jwtToken
        );
        if (metaRes && metaRes.success && metaRes.data && metaRes.data.tokenURI) {
          finalTokenURI = metaRes.data.tokenURI;
        }
      } catch (err) {
        console.warn("Background metadata auto-generation fallback:", err);
      }

      // 3. Dispatch on-chain createNFT transaction on Sepolia blockchain
      setCurrentStep('blockchain');
      const res = await createNFT(
        totalCopies,
        totalCopies,
        finalTokenURI,
        royaltyBps,
        category,
        name,
        description,
        finalImageUri
      );

      // 4. Sync in Database
      if (res && res.success) {
        setCurrentStep('syncing');
        if (res.tokenId) {
          try {
            await nftApi.syncMintedNFT(
              {
                tokenId: res.tokenId,
                title: name,
                name: name,
                category,
                description: description || `Authentic ${category} collectible with verified provenance.`,
                image: finalImageUri,
                initialSupply: totalCopies,
                maxSupply: totalCopies,
                metadataURI: finalTokenURI,
                royaltyFeeBps: royaltyBps,
                creator: targetCreator,
                txHash: res.txHash || res.hash || "",
              },
              jwtToken
            );
          } catch (syncErr) {
            console.warn("Background NFT sync warning:", syncErr);
          }
        }
        if (onMintSuccess) onMintSuccess(res);
        onClose();
      }
    } catch (err) {
      console.error("Mint workflow error:", err);
    } finally {
      setCurrentStep('idle');
    }
  };

  const loading = mintLoading || isUploadingImage || currentStep !== 'idle';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mint New Luxury NFT on Blockchain"
      size="lg"
    >
      <form onSubmit={handleMint} className="space-y-4">
        {/* Dealer Verification & Active Brand Header */}
        {isAdmin ? (
          <div className="p-3.5 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-purple-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-purple-600" />
                <span>Admin Minting Control — Assign to Brand / Dealership:</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200 text-purple-800">
                Admin Mode
              </span>
            </div>
            <select
              value={selectedDealerAddress}
              onChange={(e) => handleDealerSelect(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500 shadow-xs"
            >
              {dealersList.length > 0 ? (
                dealersList.map((d) => (
                  <option key={d.address} value={d.address.toLowerCase()}>
                    {d.businessName || 'Dealer'} ({shortenAddress(d.address, 4)}) — {d.category || 'Luxury'}
                  </option>
                ))
              ) : (
                <option value={account || ''}>Connected Wallet ({shortenAddress(account, 4)})</option>
              )}
            </select>
          </div>
        ) : isDealer ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-emerald-950 block">
                  Minting as Verified Brand: <strong>{activeBrandName || 'Registered Dealership'}</strong>
                </span>
                <span className="text-[10px] text-emerald-700 font-mono">
                  Wallet: {shortenAddress(account, 5)}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
              Verified Role
            </span>
          </div>
        ) : (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">
                  Connected Account ({shortenAddress(account)}) is not a verified dealer.
                </p>
                <p className="text-amber-700 text-[11px] mt-0.5 leading-relaxed">
                  Only accredited brand dealers can mint luxury editions on Sepolia. Please switch in MetaMask to your verified dealer account (<strong>Kashee's Brand</strong> or <strong>Aura Kicks Atelier</strong>).
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-200/60">
              <Link
                to="/apply-dealership"
                onClick={onClose}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs"
              >
                Apply for Dealership
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column: Asset Information */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                NFT Asset Name / Title <span className="text-pink-600">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Silver Pendent- Premium"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-pink-500 focus:outline-none"
                >
                  {CATEGORIES.filter(c => c !== 'All').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Symbol / Code
                </label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g., LUX-JWL"
                  maxLength={8}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-pink-500 focus:outline-none uppercase"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Description & Provenance Notes
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details regarding gemstone purity, carat, physical vault storage, CoA..."
                rows="2"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-pink-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Total Copies (Supply)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={editions}
                    onChange={(e) => setEditions(e.target.value)}
                    required
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-pink-500 focus:outline-none"
                  />
                  <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center justify-between">
                  <span>Royalty</span>
                  <span className="text-pink-600 font-bold">{royaltyPercentage}%</span>
                </label>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="0.5"
                    value={royaltyPercentage}
                    onChange={(e) => setRoyaltyPercentage(e.target.value)}
                    className="w-full accent-pink-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Direct Image Upload & Instant Card Preview */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  NFT Artwork / Photo
                </label>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setImageMode('upload')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      imageMode === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      imageMode === 'url' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Image URL
                  </button>
                </div>
              </div>

              {imageMode === 'url' ? (
                <div className="space-y-1.5">
                  <div className="relative">
                    <input
                      type="url"
                      value={customImageUrl}
                      onChange={(e) => handleCustomUrlChange(e.target.value)}
                      placeholder="Paste high-res image URL (e.g. https://...)"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-pink-500 focus:outline-none"
                    />
                    <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Paste any direct image link or Unsplash artwork URL.
                  </span>
                </div>
              ) : (
                <>
                  {/* Hidden Native File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Drag & Drop / Click Upload Box */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                      selectedFile
                        ? 'border-emerald-300 bg-emerald-50/30'
                        : 'border-pink-200 hover:border-pink-400 bg-pink-50/40 hover:bg-pink-50/70'
                    }`}
                  >
                    {isUploadingImage ? (
                      <div className="flex flex-col items-center gap-1.5 py-3 text-pink-600">
                        <Loader2 className="w-7 h-7 animate-spin" />
                        <span className="text-xs font-bold">Storing Image & Decentralizing on IPFS...</span>
                      </div>
                    ) : selectedFile ? (
                      <div className="w-full flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={previewUrl}
                            alt="Thumbnail"
                            className="w-12 h-12 rounded-xl object-cover border border-emerald-200 shrink-0"
                          />
                          <div className="text-left truncate">
                            <p className="text-xs font-bold text-slate-800 truncate">{selectedFile.name}</p>
                            <p className="text-[10px] text-slate-400">
                              {(selectedFile.size / 1024).toFixed(1)} KB • Click to change
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-7 h-7 text-pink-500" />
                        <span className="text-xs font-bold text-slate-700">
                          Click to choose image from computer
                        </span>
                        <span className="text-[10px] text-slate-400">
                          PNG, JPG, WEBP, GIF (Saved permanently on server & IPFS)
                        </span>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Live Card Preview */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Live Card Preview
              </label>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-20 h-20 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0 bg-slate-200"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_CATEGORY_IMAGES[category] || DEFAULT_CATEGORY_IMAGES.Jewelry;
                  }}
                />
                <div className="flex-1 min-w-0 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[10px] uppercase text-pink-600 bg-pink-100/80 px-2 py-0.5 rounded">
                      {category}
                    </span>
                    {symbol && (
                      <span className="font-mono font-bold text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                        {symbol}
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-slate-800 truncate mt-1 text-sm">{name || 'Asset Title'}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">Supply: {editions} Copies</p>
                  <p className="text-slate-400 text-[10px]">Brand: {activeBrandName || 'Luxury Dealer'}</p>
                </div>
              </div>
            </div>

            {/* Network & Gas Info */}
            <div className="p-2.5 bg-slate-100/80 rounded-xl border border-slate-200 text-xs flex items-center justify-between text-slate-600">
              <div className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-purple-600" />
                <span className="font-medium text-[11px]">Network Validation Fee:</span>
              </div>
              <span className="font-bold font-mono text-slate-900 text-xs">0.0005 ETH</span>
            </div>
          </div>
        </div>

        {/* Step Progress Notice while Minting */}
        {currentStep !== 'idle' && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-center gap-2.5 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-purple-600 shrink-0" />
            <span className="font-semibold">
              {currentStep === 'uploading' && 'Step 1/3: Storing and pinning artwork to IPFS...'}
              {currentStep === 'metadata' && 'Step 2/3: Generating decentralized metadata JSON on Pinata...'}
              {currentStep === 'blockchain' && 'Step 3/3: Submitting transaction on Sepolia blockchain (confirm in MetaMask)...'}
              {currentStep === 'syncing' && 'Finalizing: Syncing NFT on ChainArt marketplace...'}
            </span>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || (!isDealer && !isAdmin)}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 shadow-md shadow-pink-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing Mint on Sepolia...</span>
              </div>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Mint {editions} NFT Copies to Sepolia</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default MintModal;


