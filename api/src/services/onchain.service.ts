import { createPublicClient, http, parseAbi } from 'viem';
import { base, mainnet, polygon } from 'viem/chains';
import { logger } from '../lib/logger.js';

const EVM_CHAIN_KEYS = ['ethereum', 'base', 'polygon'] as const;
export type EvmChainKey = (typeof EVM_CHAIN_KEYS)[number];

export const ERC20_ABI = parseAbi([
  'function totalSupply() view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
]);

const ethClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.RPC_URL_ETHEREUM ?? 'https://eth.llamarpc.com'),
});

const baseClient = createPublicClient({
  chain: base,
  transport: http(process.env.RPC_URL_BASE ?? 'https://mainnet.base.org'),
});

const polygonClient = createPublicClient({
  chain: polygon,
  transport: http(process.env.RPC_URL_POLYGON ?? 'https://polygon-rpc.com'),
});

export function normalizeEvmChain(chain: string): EvmChainKey | null {
  const key = chain.trim().toLowerCase();
  if (key === 'eth' || key === 'mainnet') return 'ethereum';
  return (EVM_CHAIN_KEYS as readonly string[]).includes(key) ? (key as EvmChainKey) : null;
}

export function isEvmContractAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}

function getEvmClient(chain: EvmChainKey) {
  if (chain === 'ethereum') return ethClient;
  if (chain === 'base') return baseClient;
  return polygonClient;
}

function formatUnitsToNumber(value: bigint, decimals: number): number {
  if (decimals <= 0) return Number(value);
  const baseUnit = 10n ** BigInt(decimals);
  const whole = value / baseUnit;
  const fraction = value % baseUnit;
  const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/u, '');
  const asStr = fractionStr.length > 0 ? `${whole.toString()}.${fractionStr}` : whole.toString();
  const out = Number(asStr);
  return Number.isFinite(out) ? out : Number.parseFloat(asStr);
}

export async function readErc20TotalSupply(
  contractAddress: string,
  chain: string,
): Promise<number | null> {
  const evmChain = normalizeEvmChain(chain);
  if (!evmChain) {
    return null;
  }
  if (!isEvmContractAddress(contractAddress)) {
    return null;
  }

  try {
    const client = getEvmClient(evmChain);
    const address = contractAddress as `0x${string}`;
    const [totalSupply, decimals] = await Promise.all([
      client.readContract({
        address,
        abi: ERC20_ABI,
        functionName: 'totalSupply',
      }),
      client.readContract({
        address,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }),
    ]);

    return formatUnitsToNumber(totalSupply, decimals);
  } catch (err) {
    logger.warn({ err, chain, contractAddress }, 'ERC20 totalSupply read failed');
    return null;
  }
}

/** @deprecated Use readErc20TotalSupply */
export async function getTokenTotalSupply(
  address: string,
  chain: 'ethereum' | 'base',
): Promise<number | null> {
  return readErc20TotalSupply(address, chain);
}

export async function getHolderCount(assetId: string): Promise<number | null> {
  void assetId;
  return null;
}

export async function fetchOnchainData(assetSlug: string): Promise<{
  totalSupply: number | null;
  holderCount: number | null;
}> {
  if (assetSlug === 'ondo-usdy') {
    const totalSupply = await readErc20TotalSupply(
      '0x96F6ef951840721AdBF46Ac996b59E0235CB985C',
      'ethereum',
    );
    return { totalSupply, holderCount: await getHolderCount(assetSlug) };
  }

  return { totalSupply: null, holderCount: null };
}
