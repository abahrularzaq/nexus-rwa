import {
  createPublicClient,
  fallback,
  http,
  type PublicClient,
} from 'viem';
import { base, baseSepolia } from 'viem/chains';

/** Narrow viem client typing for singleton map (fallback transport widens chain generics). */
const clients = new Map<string, PublicClient>();

function rpcUrlsForNetwork(network: string): string[] {
  if (network === 'base') {
    const primary = (process.env.BASE_MAINNET_RPC_URL ?? '').trim();
    const fb = (process.env.RPC_URL_BASE ?? 'https://mainnet.base.org').trim();
    return [primary, fb].filter(Boolean);
  }
  if (network === 'base-sepolia') {
    const primary = (process.env.BASE_SEPOLIA_RPC_URL ?? '').trim();
    const fb = (process.env.RPC_URL_BASE_SEPOLIA ?? 'https://sepolia.base.org').trim();
    return [primary, fb].filter(Boolean);
  }
  throw new Error(`Unsupported network for PublicClient: ${network}`);
}

/**
 * Returns a viem {@link PublicClient} for the given X402 network key.
 * One client per network (singleton); transport uses primary RPC with HTTP fallback.
 */
export function getPublicClient(network: string): PublicClient {
  const cached = clients.get(network);
  if (cached) return cached;

  const urls = rpcUrlsForNetwork(network);
  if (urls.length === 0) {
    throw new Error(
      `No RPC URL configured for ${network}. Set BASE_MAINNET_RPC_URL / BASE_SEPOLIA_RPC_URL or RPC_URL_* fallback.`,
    );
  }

  const transports = urls.map((url) => http(url));
  const transport = transports.length > 1 ? fallback(transports) : transports[0]!;

  const chain = network === 'base' ? base : baseSepolia;
  const client = createPublicClient({ chain, transport }) as PublicClient;
  clients.set(network, client);
  return client;
}
