import { ethers } from "ethers";
import ChainArtNFTABI from "../abis/ChainArtNFT.json";
import ChainArtMarketplaceABI from "../abis/ChainArtMarketplace.json";
import ChainArtAuctionABI from "../abis/ChainArtAuction.json";
import ChainArtLoyaltyABI from "../abis/ChainArtLoyalty.json";
import MockUSDTABI from "../abis/MockUSDT.json";

export const CONTRACT_ADDRESSES = {
  chainId: 11155111,
  networkName: "Ethereum Sepolia",
  // Full Contract Names
  ChainArtNFT: "0xF9CFB066E7c755a22D9C632d941BCC29dd3C196f",
  ChainArtMarketplace: "0x9180901fd05AAE6fffB8E6b6eb19f36CB6de3C5f",
  ChainArtAuction: "0x591A265C464C7DC820e3e68C52eE174347071f25",
  ChainArtLoyalty: "0x34AbD91dac11A0b5718a2b506D8b68fC0707a5E4",
  MockUSDT: "0xd077a400968890eacc75cdc901f0356c943e4fdb",
  // Short keys
  nft: "0xF9CFB066E7c755a22D9C632d941BCC29dd3C196f",
  marketplace: "0x9180901fd05AAE6fffB8E6b6eb19f36CB6de3C5f",
  auction: "0x591A265C464C7DC820e3e68C52eE174347071f25",
  loyalty: "0x34AbD91dac11A0b5718a2b506D8b68fC0707a5E4",
  usdt: "0xd077a400968890eacc75cdc901f0356c943e4fdb",
  treasury: "0x041F913a616362e67CdcE5d476F6BDeC7776f309",
};

export const SEPOLIA_CONFIG = {
  chainId: "0xaa36a7", // 11155111 in hex
  chainName: "Ethereum Sepolia Testnet",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: [
    "https://ethereum-sepolia-rpc.publicnode.com",
    "https://rpc.sepolia.org",
    "https://1rpc.io/sepolia",
    "https://sepolia.drpc.org",
    "https://sepolia.infura.io/v3/ec27627d77a14d5fbd11fb8ba2f7c722"
  ],
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};

export const ABIS = {
  ChainArtNFT: ChainArtNFTABI,
  ChainArtMarketplace: ChainArtMarketplaceABI,
  ChainArtAuction: ChainArtAuctionABI,
  ChainArtLoyalty: ChainArtLoyaltyABI,
  MockUSDT: MockUSDTABI,
  nft: ChainArtNFTABI,
  marketplace: ChainArtMarketplaceABI,
  auction: ChainArtAuctionABI,
  loyalty: ChainArtLoyaltyABI,
  usdt: MockUSDTABI,
};

export function getContract(contractName, runner) {
  const address = CONTRACT_ADDRESSES[contractName] || CONTRACT_ADDRESSES[contractName.toLowerCase()];
  const abi = ABIS[contractName] || ABIS[contractName.toLowerCase()];
  if (!address || !abi) {
    throw new Error(`Contract configuration not found for: ${contractName}`);
  }
  return new ethers.Contract(address, abi, runner);
}
