import type { Prisma } from "@prisma/client";

export type IdentityInput = Omit<Prisma.AssetIdentityCreateWithoutAssetInput, never>;
export type MarketInput = Omit<Prisma.AssetMarketCreateWithoutAssetInput, never>;
export type RiskInput = Omit<Prisma.AssetRiskCreateWithoutAssetInput, never>;
export type ReserveInput = Omit<Prisma.AssetReserveCreateWithoutAssetInput, never>;
export type YieldInput = Omit<Prisma.AssetYieldCreateWithoutAssetInput, never>;
export type InstitutionalInput = Omit<Prisma.AssetInstitutionalCreateWithoutAssetInput, never>;
export type BlockchainInput = Omit<Prisma.AssetBlockchainCreateWithoutAssetInput, never>;
export type ComplianceInput = Omit<Prisma.AssetComplianceCreateWithoutAssetInput, never>;
export type LiquidityInput = Omit<Prisma.AssetLiquidityCreateWithoutAssetInput, never>;
export type AiNarrativeInput = Omit<Prisma.AssetAiNarrativeCreateWithoutAssetInput, never>;
export type EventInput = Omit<Prisma.AssetEventCreateWithoutAssetInput, never>;
export type HistoryInput = Omit<Prisma.AssetHistoryCreateWithoutAssetInput, never>;

export type AssetCategoryLabel = "Treasury" | "Credit" | "RealEstate";

export type CatalogAssetInput = {
  slug: string;
  name: string;
  symbol: string;
  protocol: string;
  category: AssetCategoryLabel;
  subcategory: string;
  description: string;
  websiteUrl: string;
  chain: string;
  contractAddress: string;
  explorerUrl: string;
  tags?: string[];
  launchDate?: Date;
  /** Seed market / risk / yield approximations (refined by DeFiLlama sync). */
  tvl: number;
  tvl7dChange?: number;
  currentYield: number;
  overallScore: number;
  overallLevel: "LOW" | "MEDIUM" | "HIGH";
  holderCount?: number;
  compareTo?: string[];
  contractVerified?: boolean;
};

/** Full 12-layer seed (reference assets). */
export type AssetSeed = {
  slug: string;
  identity: IdentityInput;
  market: MarketInput;
  risk: RiskInput;
  reserve: ReserveInput;
  yield: YieldInput;
  institutional: InstitutionalInput;
  blockchain: BlockchainInput[];
  compliance: ComplianceInput;
  liquidity: LiquidityInput;
  aiNarrative: AiNarrativeInput;
  events: EventInput[];
  history: HistoryInput[];
};

/** Minimal local bootstrap/dev fallback seed — not a production asset source of truth. */
export type MinimalAssetSeed = {
  slug: string;
  identity: IdentityInput;
  market: MarketInput;
  risk: RiskInput;
  compliance: ComplianceInput;
  liquidity: LiquidityInput;
};

export type SeedEntry = AssetSeed | MinimalAssetSeed;

export function isFullAssetSeed(entry: SeedEntry): entry is AssetSeed {
  return "reserve" in entry;
}

const CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  base: 8453,
  polygon: 137,
};

function riskSubScores(overall: number, category: AssetCategoryLabel) {
  const spread =
    category === "Treasury" ? 8 : category === "Credit" ? 14 : 12;
  return {
    smartContractRisk: Math.min(100, overall - spread + 5),
    counterpartyRisk: Math.min(100, overall - spread),
    liquidityRisk: Math.min(100, overall - spread - 3),
    regulatoryRisk: category === "Treasury" ? Math.min(100, overall + 5) : overall - spread - 5,
    marketRisk: Math.min(100, overall - spread - 2),
    concentrationRisk: category === "Credit" ? overall - spread - 15 : overall - spread - 8,
  };
}

function reserveForCategory(category: AssetCategoryLabel): ReserveInput {
  switch (category) {
    case "Treasury":
      return {
        backingType: "US Treasury & cash equivalents",
        backingDescription: "Short-duration US government securities and money-market instruments",
        collateralizationRatio: 1.0,
        hasProofOfReserves: true,
        redemptionAsset: "USD",
        reserveBreakdown: { "Treasury bills": 70, Cash: 30 },
      };
    case "Credit":
      return {
        backingType: "Secured loans & receivables",
        backingDescription: "On-chain credit exposure backed by collateral or structured tranches",
        collateralizationRatio: 1.05,
        hasProofOfReserves: false,
        redemptionAsset: "USDC",
        reserveBreakdown: { "Active loans": 80, "Liquidity buffer": 20 },
      };
    case "RealEstate":
      return {
        backingType: "Rental real estate",
        backingDescription: "Fractionalized US residential rental property cash flows",
        collateralizationRatio: 1.0,
        hasProofOfReserves: false,
        redemptionAsset: "USD",
        reserveBreakdown: { "Property equity": 100 },
      };
  }
}

function complianceForCategory(category: AssetCategoryLabel): ComplianceInput {
  const treasuryLike = category === "Treasury" || category === "RealEstate";
  return {
    regulatoryStatus: treasuryLike ? "registered" : "unregulated",
    primaryRegulator: treasuryLike ? "SEC" : null,
    regulatoryFramework: treasuryLike
      ? "Securities / fund regulations (jurisdiction-specific)"
      : "DeFi protocol — verify offering per pool",
    kycRequired: true,
    accreditedOnly: category !== "RealEstate",
    blockedJurisdictions: ["CN", "KP", "IR"],
    sanctionsScreening: true,
    amlPolicy: "Institutional onboarding and OFAC screening",
    lastComplianceCheck: new Date("2025-05-01"),
  };
}

function liquidityForCategory(category: AssetCategoryLabel): LiquidityInput {
  if (category === "Treasury") {
    return {
      redemptionType: "T+1",
      redemptionPeriodDays: 1,
      lockupPeriodDays: 0,
      liquidityScore: 70,
      liquidityNotes: "Primary redemption via issuer platform; secondary liquidity varies",
    };
  }
  if (category === "RealEstate") {
    return {
      redemptionType: "periodic",
      redemptionPeriodDays: 30,
      lockupPeriodDays: 0,
      liquidityScore: 45,
      liquidityNotes: "Property-level liquidity; secondary market on permissioned DEXs",
    };
  }
  return {
    redemptionType: "instant",
    redemptionPeriodDays: 0,
    lockupPeriodDays: 0,
    liquidityScore: 60,
    liquidityNotes: "Pool withdrawals subject to available liquidity",
  };
}

function historyPoints(
  slug: string,
  tvl: number,
  yieldPct: number,
  holderCount: number,
  riskScore: number,
): HistoryInput[] {
  const offsets = [0, 7, 14];
  return offsets.map((daysAgo) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - daysAgo);
    const jitter = (slug.length + daysAgo) % 5;
    return {
      timestamp: d,
      tvl: Math.round(tvl * (1 - daysAgo * 0.002)),
      yield: Math.round((yieldPct + (jitter - 2) * 0.05) * 100) / 100,
      holderCount: Math.max(50, holderCount - daysAgo * 3),
      riskScore,
      source: "seed",
    };
  });
}

export function buildCatalogAsset(input: CatalogAssetInput): AssetSeed {
  const {
    slug,
    name,
    symbol,
    protocol,
    category,
    subcategory,
    description,
    websiteUrl,
    chain,
    contractAddress,
    explorerUrl,
    tags = [],
    launchDate,
    tvl,
    tvl7dChange = 0,
    currentYield,
    overallScore,
    overallLevel,
    holderCount = 500,
    compareTo = [],
    contractVerified = false,
  } = input;

  const subs = riskSubScores(overallScore, category);
  const chainKey = chain.toLowerCase();

  return {
    slug,
    identity: {
      name,
      symbol,
      fullName: name,
      category,
      subcategory,
      description,
      websiteUrl,
      launchDate,
      tags: ["rwa", "seed-catalog", ...tags],
    },
    market: {
      tvl,
      tvl7dChange,
      holderCount,
      aumUsd: tvl,
      lastUpdated: new Date(),
      sources: ["defillama", "seed-catalog"],
      confidence: "MEDIUM",
    },
    risk: {
      overallScore,
      overallLevel,
      ...subs,
      riskFactors: [
        category === "Credit"
          ? "Credit and smart contract risk"
          : category === "RealEstate"
            ? "Illiquidity and property concentration"
            : "Transfer restrictions may limit DeFi composability",
      ],
      mitigants: [
        category === "Treasury"
          ? "Short-duration government-backed assets"
          : "Collateralized structures and protocol audits",
      ],
      assessmentMethod: "hybrid",
      lastAssessed: new Date("2025-05-01"),
    },
    reserve: reserveForCategory(category),
    yield: {
      currentYield,
      yieldType: "variable",
      yieldFrequency: category === "Credit" ? "continuous" : "daily",
      yieldBenchmark: category === "Treasury" ? "Fed Funds Rate" : "USDC base yield",
      yieldCurrency: "USD",
    },
    institutional: {
      issuerName: protocol,
      issuerType: category === "Treasury" ? "asset_manager" : "protocol_native",
      issuerCountry: "US",
      legalStructure: category === "Treasury" ? "Fund / SPV" : "Protocol foundation",
      targetInvestors: category === "RealEstate" ? "retail" : "institutional",
    },
    blockchain: [
      {
        chain: chainKey,
        chainId: CHAIN_IDS[chainKey],
        contractAddress,
        tokenStandard: "ERC-20",
        hasWhitelist: category !== "Credit" || slug.includes("buidl"),
        hasTransferRestrictions: category === "Treasury",
        isVerified: contractVerified,
        explorerUrl,
      },
    ],
    compliance: complianceForCategory(category),
    liquidity: liquidityForCategory(category),
    aiNarrative: {
      summary: `${name} (${symbol}) is a ${category.toLowerCase()} RWA tracked in the Nexus catalog; metrics are seeded and should be refreshed via sync.`,
      opportunities: [
        category === "Treasury" ? "Rate environment tailwinds" : "Yield premium vs Treasuries",
      ],
      risks: [
        category === "Credit"
          ? "Default and liquidity risk"
          : category === "RealEstate"
            ? "Property and regulatory risk"
            : "Permissioning and concentration",
      ],
      outlook: "neutral",
      outlookReason: "Await live DeFiLlama sync for updated TVL and yield",
      confidence: "medium",
      keyMetrics: { tvl, yield: currentYield, riskScore: overallScore },
      compareTo,
      generatedAt: new Date("2025-05-01"),
      modelVersion: "seed-catalog-v1",
    },
    events: [
      {
        title: "Catalog seed entry created",
        description: `Initial 12-layer seed for ${slug} from VERIFIED_ASSETS catalog`,
        eventType: "data",
        severity: "info",
        occurredAt: new Date("2025-05-01"),
        isVerified: false,
      },
    ],
    history: historyPoints(slug, tvl, currentYield, holderCount, overallScore),
  };
}

const EMPTY_MARKET: MarketInput = {
  tvl: null,
  tvl7dChange: null,
  holderCount: null,
  aumUsd: null,
  lastUpdated: null,
  sources: ["defillama"],
  confidence: "MEDIUM",
};

const EMPTY_RISK: RiskInput = {
  overallScore: null,
  overallLevel: "MEDIUM",
  smartContractRisk: null,
  counterpartyRisk: null,
  liquidityRisk: null,
  regulatoryRisk: null,
  marketRisk: null,
  concentrationRisk: null,
  assessmentMethod: "algorithmic",
  lastAssessed: null,
};

/** Maps seed slug → CATALOG_ASSETS / SUPPLEMENTAL_CATALOG slug when names differ. */
export const CATALOG_SLUG_ALIASES: Record<string, string> = {
  superstate: "superstate-ustb",
  "backed-finance": "backed-buidl",
  openeden: "openedon-ousg",
};

/** On-chain + market baselines for minimal slugs not in legacy CATALOG_ASSETS. */
export const SUPPLEMENTAL_CATALOG: CatalogAssetInput[] = [
  {
    slug: "centrifuge-cfg",
    name: "Centrifuge CFG",
    symbol: "CFG",
    protocol: "Centrifuge",
    category: "Credit",
    subcategory: "Protocol governance",
    description:
      "Governance token for Centrifuge, a decentralized protocol for financing real-world assets on-chain",
    websiteUrl: "https://centrifuge.io",
    chain: "ethereum",
    contractAddress: "0xA1c931D64dBA96fa7393F896faC34f6d18515e4C",
    explorerUrl: "https://etherscan.io/token/0xA1c931D64dBA96fa7393F896faC34f6d18515e4C",
    tags: ["governance", "rwa", "defi"],
    tvl: 95_000_000,
    tvl7dChange: -0.4,
    currentYield: 8.5,
    overallScore: 55,
    overallLevel: "MEDIUM",
    holderCount: 8200,
    compareTo: ["centrifuge-drop", "goldfinch-gfi"],
  },
  {
    slug: "clearpool",
    name: "Clearpool",
    symbol: "CPOOL",
    protocol: "Clearpool",
    category: "Credit",
    subcategory: "Institutional lending",
    description:
      "Decentralized capital markets protocol for institutional unsecured lending on-chain",
    websiteUrl: "https://clearpool.finance",
    chain: "ethereum",
    contractAddress: "0x0C7B6d9bADAC49D7F1315f9E631c3b2e4D6c4E8a",
    explorerUrl: "https://etherscan.io/token/0x0C7B6d9bADAC49D7F1315f9E631c3b2e4D6c4E8a",
    tags: ["lending", "institutional"],
    tvl: 42_000_000,
    currentYield: 7.2,
    overallScore: 56,
    overallLevel: "MEDIUM",
    holderCount: 3100,
    compareTo: ["maple-usdc", "truefi"],
  },
  {
    slug: "truefi",
    name: "TrueFi",
    symbol: "TRU",
    protocol: "TrueFi",
    category: "Credit",
    subcategory: "Uncollateralized lending",
    description:
      "Uncollateralized lending protocol connecting lenders and borrowers for on-chain credit",
    websiteUrl: "https://truefi.io",
    chain: "ethereum",
    contractAddress: "0x4C5305469cbE09BCAA3dBAB71E60eB37F0f0D692",
    explorerUrl: "https://etherscan.io/token/0x4C5305469cbE09BCAA3dBAB71E60eB37F0f0D692",
    tags: ["lending", "uncollateralized"],
    tvl: 38_000_000,
    currentYield: 9.1,
    overallScore: 50,
    overallLevel: "MEDIUM",
    holderCount: 18500,
    compareTo: ["goldfinch-gfi", "clearpool"],
  },
  {
    slug: "credix",
    name: "Credix",
    symbol: "CREDIX",
    protocol: "Credix",
    category: "Credit",
    subcategory: "Private credit",
    description:
      "Private credit marketplace connecting institutional lenders with borrowers in emerging markets",
    websiteUrl: "https://credix.finance",
    chain: "solana",
    contractAddress: "CREDIXmarketPLACE11111111111111111111111111111",
    explorerUrl: "https://credix.finance",
    tags: ["private-credit", "institutional"],
    tvl: 28_000_000,
    currentYield: 11.5,
    overallScore: 48,
    overallLevel: "MEDIUM",
    holderCount: 120,
    compareTo: ["goldfinch-gfi"],
  },
  {
    slug: "ribbon-finance",
    name: "Ribbon Finance",
    symbol: "RBN",
    protocol: "Ribbon Finance",
    category: "Credit",
    subcategory: "Structured products",
    description:
      "DeFi protocol offering options-based structured products and vault strategies for yield",
    websiteUrl: "https://ribbon.finance",
    chain: "ethereum",
    contractAddress: "0x62Bba8af7035575610845Ef7D27bEF3CECEDb9d4",
    explorerUrl: "https://etherscan.io/token/0x62Bba8af7035575610845Ef7D27bEF3CECEDb9d4",
    tags: ["options", "structured-products"],
    tvl: 55_000_000,
    currentYield: 8.0,
    overallScore: 54,
    overallLevel: "MEDIUM",
    holderCount: 14200,
    compareTo: ["maple-usdc"],
  },
];

/** Ten minimal catalog assets (sync fills TVL, yield, risk scores). */
export const MINIMAL_ASSET_SEEDS: MinimalAssetSeed[] = [
  {
    slug: "centrifuge-cfg",
    identity: {
      name: "Centrifuge CFG",
      symbol: "CFG",
      category: "Credit",
      subcategory: "Protocol governance",
      description:
        "Governance token for Centrifuge, a decentralized protocol for financing real-world assets on-chain",
      websiteUrl: "https://centrifuge.io",
      tags: ["governance", "rwa", "defi"],
    },
    market: EMPTY_MARKET,
    risk: EMPTY_RISK,
    compliance: {
      kycRequired: false,
      accreditedOnly: false,
      regulatoryStatus: "unregulated",
    },
    liquidity: {
      redemptionType: "instant",
      liquidityScore: 55,
    },
  },
  {
    slug: "goldfinch-gfi",
    identity: {
      name: "Goldfinch",
      symbol: "GFI",
      category: "Credit",
      subcategory: "Emerging markets credit",
      description:
        "Decentralized credit protocol extending loans to real-world borrowers without crypto collateral",
      websiteUrl: "https://goldfinch.finance",
      tags: ["credit", "emerging-markets"],
    },
    market: EMPTY_MARKET,
    risk: EMPTY_RISK,
    compliance: {
      kycRequired: true,
      accreditedOnly: false,
      regulatoryStatus: "unregulated",
    },
    liquidity: {
      redemptionType: "instant",
      liquidityScore: 50,
    },
  },
  {
    slug: "clearpool",
    identity: {
      name: "Clearpool",
      symbol: "CPOOL",
      category: "Credit",
      subcategory: "Institutional lending",
      description:
        "Decentralized capital markets protocol for institutional unsecured lending on-chain",
      websiteUrl: "https://clearpool.finance",
      tags: ["lending", "institutional"],
    },
    market: EMPTY_MARKET,
    risk: EMPTY_RISK,
    compliance: {
      kycRequired: true,
      accreditedOnly: true,
      regulatoryStatus: "unregulated",
    },
    liquidity: {
      redemptionType: "instant",
      liquidityScore: 58,
    },
  },
  {
    slug: "truefi",
    identity: {
      name: "TrueFi",
      symbol: "TRU",
      category: "Credit",
      subcategory: "Uncollateralized lending",
      description:
        "Uncollateralized lending protocol connecting lenders and borrowers for on-chain credit",
      websiteUrl: "https://truefi.io",
      tags: ["lending", "uncollateralized"],
    },
    market: EMPTY_MARKET,
    risk: EMPTY_RISK,
    compliance: {
      kycRequired: false,
      accreditedOnly: false,
      regulatoryStatus: "unregulated",
    },
    liquidity: {
      redemptionType: "instant",
      liquidityScore: 52,
    },
  },
  {
    slug: "credix",
    identity: {
      name: "Credix",
      symbol: "CREDIX",
      category: "Credit",
      subcategory: "Private credit",
      description:
        "Private credit marketplace connecting institutional lenders with borrowers in emerging markets",
      websiteUrl: "https://credix.finance",
      tags: ["private-credit", "institutional"],
    },
    market: EMPTY_MARKET,
    risk: EMPTY_RISK,
    compliance: {
      kycRequired: true,
      accreditedOnly: true,
      regulatoryStatus: "unregulated",
    },
    liquidity: {
      redemptionType: "T+3",
      liquidityScore: 48,
    },
  },
  {
    slug: "ribbon-finance",
    identity: {
      name: "Ribbon Finance",
      symbol: "RBN",
      category: "Credit",
      subcategory: "Structured products",
      description:
        "DeFi protocol offering options-based structured products and vault strategies for yield",
      websiteUrl: "https://ribbon.finance",
      tags: ["options", "structured-products"],
    },
    market: EMPTY_MARKET,
    risk: EMPTY_RISK,
    compliance: {
      kycRequired: false,
      accreditedOnly: false,
      regulatoryStatus: "unregulated",
    },
    liquidity: {
      redemptionType: "instant",
      liquidityScore: 60,
    },
  },
  {
    slug: "superstate",
    identity: {
      name: "Superstate",
      symbol: "USTB",
      category: "Treasury",
      subcategory: "Government securities fund",
      description:
        "SEC-registered funds issuing on-chain tokens for US government securities exposure",
      websiteUrl: "https://superstate.co",
      tags: ["sec-registered", "institutional"],
    },
    market: EMPTY_MARKET,
    risk: EMPTY_RISK,
    compliance: {
      kycRequired: true,
      accreditedOnly: true,
      regulatoryStatus: "registered",
    },
    liquidity: {
      redemptionType: "T+1",
      liquidityScore: 72,
    },
  },
  {
    slug: "backed-finance",
    identity: {
      name: "Backed Finance",
      symbol: "bC3M",
      category: "Treasury",
      subcategory: "Tokenized fund shares",
      description:
        "Issuer of tokenized, regulated securities including BlackRock USD Institutional Digital Liquidity Fund",
      websiteUrl: "https://backed.fi",
      tags: ["blackrock", "institutional", "regulated"],
    },
    market: EMPTY_MARKET,
    risk: EMPTY_RISK,
    compliance: {
      kycRequired: true,
      accreditedOnly: true,
      regulatoryStatus: "registered",
    },
    liquidity: {
      redemptionType: "T+1",
      liquidityScore: 70,
    },
  },
  {
    slug: "openeden",
    identity: {
      name: "OpenEden",
      symbol: "OUSG",
      category: "Treasury",
      subcategory: "Short-term Treasury",
      description:
        "Tokenized access to short-term US Treasury bills with institutional onboarding",
      websiteUrl: "https://openeden.com",
      tags: ["tbills", "institutional"],
    },
    market: EMPTY_MARKET,
    risk: EMPTY_RISK,
    compliance: {
      kycRequired: true,
      accreditedOnly: true,
      regulatoryStatus: "exempt",
    },
    liquidity: {
      redemptionType: "T+1",
      liquidityScore: 68,
    },
  },
  {
    slug: "ondo-usdy",
    identity: {
      name: "Ondo USDY",
      symbol: "USDY",
      category: "Treasury",
      subcategory: "Yield-bearing stablecoin",
      description:
        "Yield-bearing token backed by short-term US Treasuries and bank deposits",
      websiteUrl: "https://ondo.finance/usdy",
      tags: ["stablecoin", "kyc-required"],
    },
    market: EMPTY_MARKET,
    risk: EMPTY_RISK,
    compliance: {
      kycRequired: true,
      accreditedOnly: false,
      regulatoryStatus: "registered",
    },
    liquidity: {
      redemptionType: "T+1",
      liquidityScore: 75,
    },
  },
];

/** Local bootstrap/dev fallback slugs; production asset content comes from api/src/data/asset/{slug}. */
export const TARGET_ASSET_SLUGS = [
  "ondo-ousg",
  "franklin-benji",
  "maple-usdc",
  ...MINIMAL_ASSET_SEEDS.map((a) => a.slug),
] as const;

/** @deprecated Legacy full catalog builder — kept for reference migrations only. */
export const CATALOG_ASSETS: CatalogAssetInput[] = [
  {
    slug: "ondo-usdy",
    name: "Ondo USDY",
    symbol: "USDY",
    protocol: "Ondo Finance",
    category: "Treasury",
    subcategory: "Yield-bearing stablecoin",
    description: "US dollar yield-bearing token backed by short-term US Treasuries and bank deposits",
    websiteUrl: "https://ondo.finance/usdy",
    chain: "base",
    contractAddress: "0x96F6ef951840721AdBF46Ac996b59E0235CB985C",
    explorerUrl: "https://basescan.org/token/0x96F6ef951840721AdBF46Ac996b59E0235CB985C",
    tags: ["stablecoin", "kyc-required"],
    launchDate: new Date("2023-08-01"),
    tvl: 620_000_000,
    tvl7dChange: 0.8,
    currentYield: 5.1,
    overallScore: 80,
    overallLevel: "LOW",
    holderCount: 4200,
    compareTo: ["ondo-ousg", "mountain-usdm"],
    contractVerified: true,
  },
  {
    slug: "centrifuge-drop",
    name: "Centrifuge DROP",
    symbol: "DROP",
    protocol: "Centrifuge",
    category: "Credit",
    subcategory: "Senior tranche",
    description: "Senior tranche token for real-world asset pools financed on Centrifuge",
    websiteUrl: "https://centrifuge.io",
    chain: "ethereum",
    contractAddress: "0x0C32Fa1FA1513C4C2cB34e0C1e81c5A8D16e3a02",
    explorerUrl: "https://etherscan.io/token/0x0C32Fa1FA1513C4C2cB34e0C1e81c5A8D16e3a02",
    tags: ["structured-credit", "defi"],
    tvl: 118_000_000,
    tvl7dChange: -0.5,
    currentYield: 9.4,
    overallScore: 58,
    overallLevel: "MEDIUM",
    holderCount: 890,
    compareTo: ["maple-usdc", "goldfinch-gfi"],
  },
  {
    slug: "backed-buidl",
    name: "Backed BUIDL",
    symbol: "bBUIDL",
    protocol: "Backed Finance",
    category: "Treasury",
    subcategory: "Tokenized money market fund",
    description: "Tokenized share class of BlackRock USD Institutional Digital Liquidity Fund",
    websiteUrl: "https://backed.fi",
    chain: "ethereum",
    contractAddress: "0x7712c34205737192402172409a8F7ccef8aA2AEc",
    explorerUrl: "https://etherscan.io/token/0x7712c34205737192402172409a8F7ccef8aA2AEc",
    tags: ["blackrock", "institutional"],
    tvl: 520_000_000,
    tvl7dChange: 1.2,
    currentYield: 5.0,
    overallScore: 86,
    overallLevel: "LOW",
    holderCount: 2100,
    compareTo: ["franklin-benji", "superstate-ustb"],
  },
  {
    slug: "openedon-ousg",
    name: "OpenEden OUSG",
    symbol: "OUSG",
    protocol: "OpenEden",
    category: "Treasury",
    subcategory: "Short-term Treasury",
    description: "Tokenized short-term US Treasury bills via OpenEden",
    websiteUrl: "https://openeden.com",
    chain: "ethereum",
    contractAddress: "0x4eB405CD7e6AF70E54E4853a81D17A4bF3a0BA78",
    explorerUrl: "https://etherscan.io/token/0x4eB405CD7e6AF70E54E4853a81D17A4bF3a0BA78",
    tags: ["tbills"],
    tvl: 148_000_000,
    currentYield: 5.25,
    overallScore: 78,
    overallLevel: "LOW",
    holderCount: 640,
    compareTo: ["ondo-ousg"],
  },
  {
    slug: "realt-token",
    name: "RealT Token",
    symbol: "REALT",
    protocol: "RealT",
    category: "RealEstate",
    subcategory: "Residential rental",
    description: "Fractional ownership in US rental real estate properties",
    websiteUrl: "https://realt.co",
    chain: "ethereum",
    contractAddress: "0x9C2023636A4f7a00E85a4C60b27F28bD5Ef24b0d",
    explorerUrl: "https://etherscan.io/token/0x9C2023636A4f7a00E85a4C60b27F28bD5Ef24b0d",
    tags: ["fractional", "rental-income"],
    tvl: 48_000_000,
    tvl7dChange: 0.3,
    currentYield: 11.2,
    overallScore: 54,
    overallLevel: "MEDIUM",
    holderCount: 3200,
    compareTo: [],
  },
  {
    slug: "goldfinch-gfi",
    name: "Goldfinch GFI",
    symbol: "GFI",
    protocol: "Goldfinch",
    category: "Credit",
    subcategory: "Protocol governance",
    description: "Governance token for Goldfinch decentralized credit to real-world borrowers",
    websiteUrl: "https://goldfinch.finance",
    chain: "ethereum",
    contractAddress: "0xdab396cCF3d84Cf2D07C4454e10C8A6F5b008D2b",
    explorerUrl: "https://etherscan.io/token/0xdab396cCF3d84Cf2D07C4454e10C8A6F5b008D2b",
    tags: ["governance", "emerging-markets-credit"],
    tvl: 76_000_000,
    tvl7dChange: -2.1,
    currentYield: 10.2,
    overallScore: 52,
    overallLevel: "MEDIUM",
    holderCount: 12500,
    compareTo: ["centrifuge-drop"],
  },
  {
    slug: "superstate-ustb",
    name: "Superstate Short Duration US Government Securities Fund",
    symbol: "USTB",
    protocol: "Superstate",
    category: "Treasury",
    subcategory: "Government securities fund",
    description: "On-chain registered fund token for short-duration US government securities",
    websiteUrl: "https://superstate.co",
    chain: "ethereum",
    contractAddress: "0x43415eB6ff9DB7E26A15b704e7A3eDCe97d31C4e",
    explorerUrl: "https://etherscan.io/token/0x43415eB6ff9DB7E26A15b704e7A3eDCe97d31C4e",
    tags: ["sec-registered"],
    tvl: 245_000_000,
    tvl7dChange: 2.4,
    currentYield: 4.92,
    overallScore: 85,
    overallLevel: "LOW",
    holderCount: 980,
    compareTo: ["franklin-benji", "backed-buidl"],
  },
  {
    slug: "mountain-usdm",
    name: "Mountain Protocol USD",
    symbol: "USDM",
    protocol: "Mountain Protocol",
    category: "Treasury",
    subcategory: "Yield-bearing stablecoin",
    description: "Regulated yield-bearing stablecoin backed by US Treasuries",
    websiteUrl: "https://mountainprotocol.com",
    chain: "ethereum",
    contractAddress: "0x59D9356E565Ab3A36dD77763Fc0d87fEaf85508C",
    explorerUrl: "https://etherscan.io/token/0x59D9356E565Ab3A36dD77763Fc0d87fEaf85508C",
    tags: ["stablecoin"],
    tvl: 175_000_000,
    currentYield: 5.35,
    overallScore: 77,
    overallLevel: "LOW",
    holderCount: 1500,
    compareTo: ["ondo-usdy", "hashnote-usyc"],
  },
  {
    slug: "hashnote-usyc",
    name: "Hashnote US Yield Coin",
    symbol: "USYC",
    protocol: "Hashnote",
    category: "Treasury",
    subcategory: "Yield coin",
    description: "Institutional yield coin backed by short-term US Treasury exposure",
    websiteUrl: "https://hashnote.com",
    chain: "ethereum",
    contractAddress: "0x136471a34f6ef19fE571EFFC1CA711fdb8E49f2b",
    explorerUrl: "https://etherscan.io/token/0x136471a34f6ef19fE571EFFC1CA711fdb8E49f2b",
    tags: ["institutional"],
    tvl: 92_000_000,
    currentYield: 5.05,
    overallScore: 76,
    overallLevel: "LOW",
    holderCount: 420,
    compareTo: ["mountain-usdm"],
  },
  {
    slug: "flux-fusdc",
    name: "Flux USDC",
    symbol: "fUSDC",
    protocol: "Flux Finance",
    category: "Credit",
    subcategory: "RWA-collateralized lending",
    description: "USDC supply token for Flux Finance markets accepting tokenized Treasury collateral",
    websiteUrl: "https://fluxfinance.com",
    chain: "ethereum",
    contractAddress: "0x465a5a630482f3abD6d3b84B39B29b07214d19e5",
    explorerUrl: "https://etherscan.io/token/0x465a5a630482f3abD6d3b84B39B29b07214d19e5",
    tags: ["lending", "rwa-collateral"],
    tvl: 195_000_000,
    tvl7dChange: 1.5,
    currentYield: 6.8,
    overallScore: 68,
    overallLevel: "MEDIUM",
    holderCount: 1100,
    compareTo: ["ondo-ousg", "maple-usdc"],
  },
];

function allCatalogInputs(): CatalogAssetInput[] {
  return [...CATALOG_ASSETS, ...SUPPLEMENTAL_CATALOG];
}

function resolveCatalogInput(slug: string): CatalogAssetInput | undefined {
  const catalogSlug = CATALOG_SLUG_ALIASES[slug] ?? slug;
  return allCatalogInputs().find((c) => c.slug === catalogSlug);
}

/**
 * Promotes a minimal seed (identity + compliance + liquidity) to a full 12-layer AssetSeed
 * using catalog on-chain data and category templates.
 */
export function expandMinimalSeedToFull(minimal: MinimalAssetSeed): AssetSeed {
  const catalog = resolveCatalogInput(minimal.slug);
  if (!catalog) {
    throw new Error(
      `expandMinimalSeedToFull: no catalog entry for slug "${minimal.slug}" (add to CATALOG_ASSETS or SUPPLEMENTAL_CATALOG)`,
    );
  }

  const category = (minimal.identity.category ?? catalog.category) as AssetCategoryLabel;
  const base = buildCatalogAsset({
    ...catalog,
    slug: minimal.slug,
    name: minimal.identity.name ?? catalog.name,
    symbol: minimal.identity.symbol ?? catalog.symbol,
    category,
    subcategory: minimal.identity.subcategory ?? catalog.subcategory,
    description: minimal.identity.description ?? catalog.description,
    websiteUrl: minimal.identity.websiteUrl ?? catalog.websiteUrl,
    tags: minimal.identity.tags ?? catalog.tags,
    launchDate: minimal.identity.launchDate ?? catalog.launchDate,
  });

  return {
    ...base,
    identity: {
      ...base.identity,
      ...minimal.identity,
      category,
    },
    compliance: {
      ...base.compliance,
      ...minimal.compliance,
    },
    liquidity: {
      ...base.liquidity,
      ...minimal.liquidity,
    },
    market: {
      ...base.market,
      tvl: null,
      tvl7dChange: null,
      holderCount: null,
      aumUsd: null,
      lastUpdated: null,
      sources: ["defillama"],
      confidence: "MEDIUM",
    },
    risk: {
      ...base.risk,
      overallScore: null,
      overallLevel: minimal.risk.overallLevel ?? "MEDIUM",
      smartContractRisk: null,
      counterpartyRisk: null,
      liquidityRisk: null,
      regulatoryRisk: null,
      marketRisk: null,
      concentrationRisk: null,
      assessmentMethod: "algorithmic",
      lastAssessed: null,
    },
  };
}

/** Local bootstrap/dev fallback seeds derived from MINIMAL_ASSET_SEEDS. */
export const EXPANDED_CATALOG_SEEDS: AssetSeed[] =
  MINIMAL_ASSET_SEEDS.map(expandMinimalSeedToFull);

export const CATALOG_ASSET_SEEDS: AssetSeed[] = CATALOG_ASSETS.map(buildCatalogAsset);
