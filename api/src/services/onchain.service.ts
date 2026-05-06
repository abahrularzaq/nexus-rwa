import { createPublicClient, http, parseAbi } from 'viem';
import { base, mainnet } from 'viem/chains';

const ethClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.RPC_URL_ETHEREUM ?? 'https://eth.llamarpc.com'),
});

const baseClient = createPublicClient({
  chain: base,
  transport: http(process.env.RPC_URL_BASE ?? 'https://mainnet.base.org'),
});

// ONDO USDY on Ethereum mainnet
const ONDO_USDY_ETHEREUM_ADDRESS = '0x96F6ef951840721AdBF46Ac996b59E0235CB985C' as const;

export const ERC20_ABI = parseAbi([
  'function totalSupply() view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
]);

function formatUnitsToNumber(value: bigint, decimals: number): number {
  if (decimals <= 0) return Number(value);
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const fraction = value % base;
  const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/u, '');
  const asStr = fractionStr.length > 0 ? `${whole.toString()}.${fractionStr}` : whole.toString();
  const out = Number(asStr);
  return Number.isFinite(out) ? out : Number.parseFloat(asStr);
}

function getClient(chain: 'ethereum' | 'base') {
  return chain === 'ethereum' ? ethClient : baseClient;
}

export async function getTokenTotalSupply(
  address: string,
  chain: 'ethereum' | 'base',
): Promise<number | null> {
  try {
    const client = getClient(chain);
    const [totalSupply, decimals] = await Promise.all([
      client.readContract({
        address: address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'totalSupply',
      }) as Promise<bigint>,
      client.readContract({
        address: address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }) as Promise<number>,
    ]);

    return formatUnitsToNumber(totalSupply, decimals);
  } catch {
    return null;
  }
}

export async function getHolderCount(assetId: string): Promise<number | null> {
  // TODO: Implement holder count via indexer (e.g. The Graph / Dune / custom ETL) per assetId.
  void assetId;
  return null;
}

export async function fetchOnchainData(assetId: string): Promise<{
  totalSupply: number | null;
  holderCount: number | null;
}> {
  // Dispatch based on our internal asset slugs.
  if (assetId === 'ondo-usdy') {
    const [totalSupply, holderCount] = await Promise.all([
      getTokenTotalSupply(ONDO_USDY_ETHEREUM_ADDRESS, 'ethereum'),
      getHolderCount(assetId),
    ]);
    return { totalSupply, holderCount };
  }

  return { totalSupply: null, holderCount: null };
}

