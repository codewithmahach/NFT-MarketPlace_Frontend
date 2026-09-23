const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Universal API Request Helper
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });
    const json = await res.json();
    return json;
  } catch (error) {
    console.warn(`[API] Network error calling ${url}:`, error.message);
    return {
      success: false,
      message: error.message,
      data: null,
      error: { code: "NETWORK_ERROR", details: error.message },
    };
  }
}

// 1. Authentication APIs
export const authApi = {
  getNonce: (address) =>
    apiRequest("/auth/nonce", {
      method: "POST",
      body: JSON.stringify({ address }),
    }),

  verifySignature: (address, signature) =>
    apiRequest("/auth/verify", {
      method: "POST",
      body: JSON.stringify({ address, signature }),
    }),

  getMe: (token) =>
    apiRequest("/auth/me", {
      method: "GET",
      token,
    }),

  updateProfile: (token, profile) =>
    apiRequest("/auth/profile", {
      method: "PUT",
      token,
      body: JSON.stringify(profile),
    }),
};

// 2. NFT Catalog APIs
export const nftApi = {
  getAllNFTs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/nfts${query ? `?${query}` : ""}`);
  },

  getNFTById: (tokenId) => apiRequest(`/nfts/${tokenId}`),

  getCategories: () => apiRequest("/nfts/categories"),

  getFeaturedNFTs: () => apiRequest("/nfts/featured"),

  getUserNFTs: (address, type = "owned") =>
    apiRequest(`/nfts/user/${address}?type=${type}`),

  uploadImage: (formData, token) =>
    apiRequest("/nfts/upload-image", {
      method: "POST",
      token,
      body: formData,
    }),

  generateMetadata: (payload, token) =>
    apiRequest("/nfts/generate-metadata", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),

  syncMintedNFT: (payload, token) =>
    apiRequest("/nfts/sync-minted", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),

  syncSupply: (payload, token) =>
    apiRequest("/nfts/sync-supply", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),
};

// 3. Marketplace Direct Sales APIs
export const marketplaceApi = {
  getListings: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/marketplace/listings${query ? `?${query}` : ""}`);
  },

  getListingById: (listingId) =>
    apiRequest(`/marketplace/listings/${listingId}`),

  verifyPurchase: (txHash) =>
    apiRequest("/marketplace/verify-purchase", {
      method: "POST",
      body: JSON.stringify({ txHash }),
    }),

  getUserListings: (address, status = "active") =>
    apiRequest(`/marketplace/user/${address}?status=${status}`),

  syncListing: (payload, token) =>
    apiRequest("/marketplace/sync-listing", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),
};

// 4. Auctions & Bidding APIs
export const auctionApi = {
  getAuctions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/auctions${query ? `?${query}` : ""}`);
  },

  getAuctionById: (auctionId) => apiRequest(`/auctions/${auctionId}`),

  verifyBid: (txHash) =>
    apiRequest("/auctions/verify-bid", {
      method: "POST",
      body: JSON.stringify({ txHash }),
    }),

  getUserAuctions: (address, type = "created") =>
    apiRequest(`/auctions/user/${address}?type=${type}`),

  syncAuction: (payload, token) =>
    apiRequest("/auctions/sync-auction", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),
};

// 5. Orders & Receipts APIs
export const orderApi = {
  getUserOrders: (address, role = "all") =>
    apiRequest(`/orders/user/${address}?role=${role}`),

  getOrderById: (orderId) => apiRequest(`/orders/${orderId}`),
};

// 6. Loyalty Program APIs
export const loyaltyApi = {
  getProfile: (address) => apiRequest(`/loyalty/profile/${address}`),

  getLeaderboard: (limit = 20) =>
    apiRequest(`/loyalty/leaderboard?limit=${limit}`),

  verifyClaim: (txHash, userAddress) =>
    apiRequest("/loyalty/verify-claim", {
      method: "POST",
      body: JSON.stringify({ txHash, userAddress }),
    }),
};

// 7. Dealership Application APIs
export const dealerApi = {
  apply: (payload) =>
    apiRequest("/dealers/apply", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getAllApplications: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/dealers/applications${query ? `?${query}` : ""}`);
  },

  getMyApplication: (address) =>
    apiRequest(`/dealers/my-application/${address}`),

  getVerifiedDealers: () => apiRequest("/dealers/verified"),
};

// 8. Protocol Admin Supervision APIs
export const adminApi = {
  getDashboard: (token) =>
    apiRequest("/admin/dashboard", {
      method: "GET",
      token,
    }),

  getApplications: (token, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/applications${query ? `?${query}` : ""}`, {
      method: "GET",
      token,
    });
  },

  reviewApplication: (token, id, payload) =>
    apiRequest(`/admin/applications/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(payload),
    }),

  updateDealerStatus: (token, address, status) =>
    apiRequest("/admin/dealers/status", {
      method: "POST",
      token,
      body: JSON.stringify({ address, status }),
    }),

  getDealersAnalytics: (token) =>
    apiRequest("/admin/dealers-analytics", {
      method: "GET",
      token,
    }),

  getDealerInventory: (token, address) =>
    apiRequest(`/admin/dealers/${address}/inventory`, {
      method: "GET",
      token,
    }),

  penalizeDealer: (token, payload) =>
    apiRequest("/admin/dealers/penalize", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),

  liftPenalty: (token, address) =>
    apiRequest("/admin/dealers/lift-penalty", {
      method: "POST",
      token,
      body: JSON.stringify({ address }),
    }),

  deleteDealer: (token, address) =>
    apiRequest(`/admin/dealers/${address}`, {
      method: "DELETE",
      token,
    }),

  clearMockData: (token) =>
    apiRequest("/admin/mock-data", {
      method: "DELETE",
      token,
    }),

  getEvents: (token, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/events${query ? `?${query}` : ""}`, {
      method: "GET",
      token,
    });
  },

  getHealth: () => apiRequest("/admin/health"),
};

// 9. Notifications APIs
export const notificationApi = {
  getNotifications: (token, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/notifications${query ? `?${query}` : ""}`, {
      method: "GET",
      token,
    });
  },

  markAsRead: (token, id) =>
    apiRequest(`/notifications/${id}/read`, {
      method: "PUT",
      token,
    }),

  markAllAsRead: (token) =>
    apiRequest("/notifications/read-all", {
      method: "PUT",
      token,
    }),
};

export default {
  auth: authApi,
  nft: nftApi,
  marketplace: marketplaceApi,
  auction: auctionApi,
  order: orderApi,
  loyalty: loyaltyApi,
  dealer: dealerApi,
  admin: adminApi,
  notifications: notificationApi,
};
