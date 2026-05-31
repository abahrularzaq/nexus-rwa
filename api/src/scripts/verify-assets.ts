import { createRequire } from 'module';

const require = createRequire(import.meta.url);
require('dotenv').config();

import { db } from '../lib/database.js';
import { logger } from '../lib/logger.js';

type VerifiedAsset = {
  id: string;
  name: string;
  symbol: string;
  protocol: string;
  category: string;
  chain: string;
  contractAddress: string;
  explorerUrl: string;
  officialUrl: string;
  defiLlamaSlug: string;
  rwaXyzId?: string;
  verified: boolean;
  verifiedAt: string | null;
  verifiedBy: string | null;
};

export const VERIFIED_ASSETS: VerifiedAsset[] = [
  {
    id: 'ondo-usdy',
    name: 'Ondo USDY',
    symbol: 'USDY',
    protocol: 'Ondo Finance',
    category: 'TREASURY',
    chain: 'base',
    contractAddress: '0x96F6ef951840721AdBF46Ac996b59E0235CB985C',
    explorerUrl: 'https://basescan.org/token/0x96F6ef951840721AdBF46Ac996b59E0235CB985C',
    officialUrl: 'https://ondo.finance/usdy',
    defiLlamaSlug: 'ondo-finance',
    rwaXyzId: 'USDY',
    verified: true,
    verifiedAt: '2026-05-07',
    verifiedBy: 'manual-basescan',
  },
  {
    id: 'ondo-ousg',
    name: 'Ondo OUSG',
    symbol: 'OUSG',
    protocol: 'Ondo Finance',
    category: 'TREASURY',
    chain: 'ethereum',
    contractAddress: '0x1bfe8cb57a0f5ecca7e7666798d9fb3f3a9befae',
    explorerUrl: 'https://etherscan.io/token/0x1bfe8cb57a0f5ecca7e7666798d9fb3f3a9befae',
    officialUrl: 'https://ondo.finance/ousg',
    defiLlamaSlug: 'ondo-finance',
    verified: false,
    verifiedAt: null,
    verifiedBy: null,
  },
  {
    id: 'maple-usdc',
    name: 'Maple USDC',
    symbol: 'mUSDC',
    protocol: 'Maple Finance',
    category: 'CREDIT',
    chain: 'ethereum',
    contractAddress: '0x36d8c79B4c18D3b39d9aA27C7Fde5f04CeBc9D7',
    explorerUrl: 'https://etherscan.io/token/0x36d8c79B4c18D3b39d9aA27C7Fde5f04CeBc9D7',
    officialUrl: 'https://maple.finance',
    defiLlamaSlug: 'maple-finance',
    verified: false,
    verifiedAt: null,
    verifiedBy: null,
  },
  {
    id: 'centrifuge-drop',
    name: 'Centrifuge DROP',
    symbol: 'DROP',
    protocol: 'Centrifuge',
    category: 'CREDIT',
    chain: 'ethereum',
    contractAddress: '0x0C32Fa1FA1513C4C2cB34e0C1e81c5A8D16e3a02',
    explorerUrl: 'https://etherscan.io/token/0x0C32Fa1FA1513C4C2cB34e0C1e81c5A8D16e3a02',
    officialUrl: 'https://centrifuge.io',
    defiLlamaSlug: 'centrifuge',
    verified: false,
    verifiedAt: null,
    verifiedBy: null,
  },
  {
    id: 'backed-buidl',
    name: 'Backed BUIDL',
    symbol: 'bBUIDL',
    protocol: 'Backed Finance',
    category: 'TREASURY',
    chain: 'ethereum',
    contractAddress: '0x7712c34205737192402172409a8F7ccef8aA2AEc',
    explorerUrl: 'https://etherscan.io/token/0x7712c34205737192402172409a8F7ccef8aA2AEc',
    officialUrl: 'https://backed.fi',
    defiLlamaSlug: 'backed-finance',
    verified: false,
    verifiedAt: null,
    verifiedBy: null,
  },
  {
    id: 'openedon-ousg',
    name: 'OpenEden OUSG',
    symbol: 'OUSG',
    protocol: 'OpenEden',
    category: 'TREASURY',
    chain: 'ethereum',
    contractAddress: '0x4eB405CD7e6AF70E54E4853a81D17A4bF3a0BA78',
    explorerUrl: 'https://etherscan.io/token/0x4eB405CD7e6AF70E54E4853a81D17A4bF3a0BA78',
    officialUrl: 'https://openeden.com',
    defiLlamaSlug: 'openeden',
    verified: false,
    verifiedAt: null,
    verifiedBy: null,
  },
  {
    id: 'realt-token',
    name: 'RealT Token',
    symbol: 'REALT',
    protocol: 'RealT',
    category: 'REAL_ESTATE',
    chain: 'ethereum',
    contractAddress: '0x9C2023636A4f7a00E85a4C60b27F28bD5Ef24b0d',
    explorerUrl: 'https://etherscan.io/token/0x9C2023636A4f7a00E85a4C60b27F28bD5Ef24b0d',
    officialUrl: 'https://realt.co',
    defiLlamaSlug: 'realt',
    verified: false,
    verifiedAt: null,
    verifiedBy: null,
  },
  {
    id: 'goldfinch-gfi',
    name: 'Goldfinch GFI',
    symbol: 'GFI',
    protocol: 'Goldfinch',
    category: 'CREDIT',
    chain: 'ethereum',
    contractAddress: '0xdab396cCF3d84Cf2D07C4454e10C8A6F5b008D2b',
    explorerUrl: 'https://etherscan.io/token/0xdab396cCF3d84Cf2D07C4454e10C8A6F5b008D2b',
    officialUrl: 'https://goldfinch.finance',
    defiLlamaSlug: 'goldfinch',
    verified: false,
    verifiedAt: null,
    verifiedBy: null,
  },
  {
    id: 'franklin-benji',
    name: 'Franklin OnChain U.S. Government Money Fund',
    symbol: 'BENJI',
    protocol: 'Franklin Templeton',
    category: 'TREASURY',
    chain: 'base',
    contractAddress: '0x60CfC2b186a4CF647486e42c42B11cC6D571d1E4',
    explorerUrl: 'https://basescan.org/token/0x60CfC2b186a4CF647486e42c42B11cC6D571d1E4',
    officialUrl: 'https://digitalassets.franklintempleton.com/benji',
    defiLlamaSlug: 'franklin-templeton',
    verified: true,
    verifiedAt: '2026-05-07',
    verifiedBy: 'basescan-confirmed',
  },
  {
    id: 'superstate-ustb',
    name: 'Superstate Short Duration US Government Securities Fund',
    symbol: 'USTB',
    protocol: 'Superstate',
    category: 'TREASURY',
    chain: 'ethereum',
    contractAddress: '0x43415eB6ff9DB7E26A15b704e7A3eDCe97d31C4e',
    explorerUrl: 'https://etherscan.io/token/0x43415eB6ff9DB7E26A15b704e7A3eDCe97d31C4e',
    officialUrl: 'https://superstate.co',
    defiLlamaSlug: 'superstate',
    verified: false,
    verifiedAt: null,
    verifiedBy: null,
  },
  {
    id: 'mountain-usdm',
    name: 'Mountain Protocol USD',
    symbol: 'USDM',
    protocol: 'Mountain Protocol',
    category: 'TREASURY',
    chain: 'ethereum',
    contractAddress: '0x59D9356E565Ab3A36dD77763Fc0d87fEaf85508C',
    explorerUrl: 'https://etherscan.io/token/0x59D9356E565Ab3A36dD77763Fc0d87fEaf85508C',
    officialUrl: 'https://mountainprotocol.com',
    defiLlamaSlug: 'mountain-protocol',
    verified: false,
    verifiedAt: null,
    verifiedBy: null,
  },
  {
    id: 'hashnote-usyc',
    name: 'Hashnote US Yield Coin',
    symbol: 'USYC',
    protocol: 'Hashnote',
    category: 'TREASURY',
    chain: 'ethereum',
    contractAddress: '0x136471a34f6ef19fE571EFFC1CA711fdb8E49f2b',
    explorerUrl: 'https://etherscan.io/token/0x136471a34f6ef19fE571EFFC1CA711fdb8E49f2b',
    officialUrl: 'https://hashnote.com',
    defiLlamaSlug: 'hashnote',
    verified: false,
    verifiedAt: null,
    verifiedBy: null,
  },
  {
    id: 'flux-fusdc',
    name: 'Flux USDC',
    symbol: 'fUSDC',
    protocol: 'Flux Finance',
    category: 'CREDIT',
    chain: 'ethereum',
    contractAddress: '0x465a5a630482f3abD6d3b84B39B29b07214d19e5',
    explorerUrl: 'https://etherscan.io/token/0x465a5a630482f3abD6d3b84B39B29b07214d19e5',
    officialUrl: 'https://fluxfinance.com',
    defiLlamaSlug: 'flux-finance',
    verified: false,
    verifiedAt: null,
    verifiedBy: null,
  },
];

function normAddr(a: string): string {
  return a.trim().toLowerCase();
}

export async function verifyAssets(): Promise<void> {
  let contractMismatch = 0;
  let notInDb = 0;

  for (const truth of VERIFIED_ASSETS) {
    const row = await db.asset.findUnique({
      where: { id: truth.id },
      include: { blockchain: true },
    });

    if (!row) {
      notInDb += 1;
      logger.warn(
        { id: truth.id, symbol: truth.symbol },
        'Asset in VERIFIED_ASSETS not found in database',
      );
      continue;
    }

    const chainRow = row.blockchain.find(
      (b) => b.chain.toLowerCase() === truth.chain.toLowerCase(),
    );
    const dbContract = chainRow?.contractAddress ?? row.blockchain[0]?.contractAddress;

    if (!dbContract || normAddr(dbContract) !== normAddr(truth.contractAddress)) {
      contractMismatch += 1;
      logger.warn(
        {
          id: truth.id,
          symbol: truth.symbol,
          truthContract: truth.contractAddress,
          dbContract: dbContract ?? null,
          explorerUrl: truth.explorerUrl,
        },
        'Contract address mismatch: database vs verified source of truth',
      );
    }
  }

  const total = VERIFIED_ASSETS.length;
  const verified = VERIFIED_ASSETS.filter((a) => a.verified).length;
  const needsVerification = VERIFIED_ASSETS.filter((a) => !a.verified).length;

  console.log('\nSummary');
  console.log(`  Total assets: ${total}`);
  console.log(`  Verified: ${verified}`);
  console.log(`  Needs verification: ${needsVerification}`);
  console.log(`  Contract mismatch: ${contractMismatch}`);
  if (notInDb > 0) {
    console.log(`  Not found in database: ${notInDb}`);
  }

  const unverified = VERIFIED_ASSETS.filter((a) => !a.verified);
  if (unverified.length > 0) {
    console.log('\nPERLU VERIFIKASI MANUAL:');
    for (const a of unverified) {
      console.log(`${a.symbol} → ${a.explorerUrl}`);
    }
    console.log(
      '\nKunjungi link di atas dan bandingkan dengan data di database.',
    );
  }
}

async function main(): Promise<void> {
  try {
    await verifyAssets();
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  logger.error(e, 'verify-assets failed');
  process.exit(1);
});
