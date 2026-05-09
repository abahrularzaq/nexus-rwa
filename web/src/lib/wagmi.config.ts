import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { base, baseSepolia } from "viem/chains";
import { createConfig, fallback, http } from "wagmi";

const appName = "Nexus RWA";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        rainbowWallet,
        metaMaskWallet,
        coinbaseWallet,
        walletConnectWallet,
      ],
    },
  ],
  { appName, projectId },
);

const baseMainnetRpcUrls = [
  process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL,
  "https://mainnet.base.org",
].filter((url): url is string => Boolean(url));

const baseSepoliaRpcUrls = [
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL,
  "https://sepolia.base.org",
].filter((url): url is string => Boolean(url));

export const chains = [base, baseSepolia] as const;

export const config = createConfig({
  chains,
  connectors,
  ssr: true,
  transports: {
    [base.id]: fallback(baseMainnetRpcUrls.map((url) => http(url))),
    [baseSepolia.id]: fallback(baseSepoliaRpcUrls.map((url) => http(url))),
  },
});
