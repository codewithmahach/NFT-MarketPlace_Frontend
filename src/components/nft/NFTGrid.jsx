import React from 'react';
import NFTCard from './NFTCard';
import LoadingSkeleton from '../common/LoadingSkeleton';
import EmptyState from '../common/EmptyState';

const NFTGrid = ({ 
  items = [], 
  loading = false, 
  onQuickBuy, 
  onQuickBid, 
  onManageListing,
  emptyTitle = 'No NFTs Found',
  emptyDescription = 'There are currently no luxury collectibles matching your filter.',
  emptyActionLabel,
  onEmptyAction
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <LoadingSkeleton key={i} type="card" />
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {items.map((nft) => (
        <NFTCard
          key={`${nft.id}-${nft.listingId || nft.auctionId || ''}`}
          nft={nft}
          onQuickBuy={onQuickBuy}
          onQuickBid={onQuickBid}
          onManageListing={onManageListing}
        />
      ))}
    </div>
  );
};

export default NFTGrid;
