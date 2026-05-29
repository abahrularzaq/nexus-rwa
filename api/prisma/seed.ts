import { createHash } from "node:crypto";
import { PrismaClient, KeyTier } from "@prisma/client";
import {
  MINIMAL_ASSET_SEEDS,
  TARGET_ASSET_SLUGS,
  type AssetSeed,
  type SeedEntry,
  isFullAssetSeed,
} from "./seed-helpers.js";

const prisma = new PrismaClient();

/** Three reference assets with rich static narratives; remaining catalog via seed-helpers. */
const RICH_ASSETS: AssetSeed[] = [
  {
    slug: "ondo-ousg",
    identity: {
      name: "Ondo OUSG",
      symbol: "OUSG",
      fullName: "Ondo US Dollar Yield",
      category: "Treasury",
      subcategory: "Short-term Treasury",
      description: "Tokenized fund providing exposure to short-term US Treasuries",
      websiteUrl: "https://ondo.finance",
      twitterUrl: "https://twitter.com/OndoFinance",
      launchDate: new Date("2023-01-27"),
      tags: ["institutional", "kyc-required", "audited"],
    },
    market: {
      tvl: 3_690_000_000,
      tvl7dChange: -1.31,
      holderCount: 1357,
      sources: ["defillama"],
      confidence: "HIGH",
    },
    risk: {
      overallScore: 82,
      overallLevel: "LOW",
      smartContractRisk: 75,
      counterpartyRisk: 85,
      liquidityRisk: 70,
      regulatoryRisk: 90,
      marketRisk: 85,
      concentrationRisk: 65,
      riskFactors: ["KYC-gated limits retail access", "Concentrated in single strategy"],
      mitigants: ["SEC-registered fund", "BNY Mellon custodian", "Monthly audits"],
      assessmentMethod: "hybrid",
      lastAssessed: new Date("2025-01-15"),
    },
    reserve: {
      backingType: "US Treasury Bills",
      backingDescription: "Portfolio of 0-3 month US Treasury bills and repos",
      collateralizationRatio: 1.0,
      custodian: "BNY Mellon",
      hasProofOfReserves: true,
      auditor: "Deloitte",
      lastAuditDate: new Date("2024-12-01"),
      reserveBreakdown: { "90-day T-bills": 70, "Overnight repo": 30 },
      redemptionAsset: "USD",
    },
    yield: {
      currentYield: 5.2,
      yieldType: "variable",
      yieldFrequency: "daily",
      yieldBenchmark: "Fed Funds Rate",
      yieldCurrency: "USD",
    },
    institutional: {
      issuerName: "Ondo Finance",
      issuerType: "protocol_native",
      issuerCountry: "US",
      legalStructure: "Delaware LLC",
      minimumInvestment: 5000,
      managementFee: 0.15,
      targetInvestors: "accredited",
    },
    blockchain: [
      {
        chain: "ethereum",
        chainId: 1,
        contractAddress: "0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92",
        tokenStandard: "ERC-20",
        hasWhitelist: true,
        hasTransferRestrictions: true,
        isVerified: true,
        explorerUrl: "https://etherscan.io/token/0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92",
      },
    ],
    compliance: {
      regulatoryStatus: "registered",
      primaryRegulator: "SEC",
      regulatoryFramework: "Reg D / Reg S",
      kycRequired: true,
      accreditedOnly: true,
      blockedJurisdictions: ["US-retail", "CN", "KP"],
      sanctionsScreening: true,
      amlPolicy: "Full OFAC screening",
    },
    liquidity: {
      redemptionType: "T+1",
      redemptionPeriodDays: 1,
      lockupPeriodDays: 0,
      minRedemptionAmount: 5000,
      liquidityScore: 75,
      liquidityNotes: "Instant redemption via Flux Finance secondary market",
    },
    aiNarrative: {
      summary:
        "OUSG is a leading tokenized short-term US Treasury product with strong regulatory backing and institutional custody.",
      opportunities: ["Fed rate tailwinds", "Growing RWA institutional adoption", "Flux Finance secondary liquidity"],
      risks: ["Retail access restricted", "Single-strategy concentration"],
      outlook: "neutral",
      outlookReason: "Stable yield product with limited upside beyond rate environment",
      confidence: "high",
      keyMetrics: { tvl: 3_690_000_000, yield: 5.2, riskScore: 82 },
      compareTo: ["franklin-benji"],
      generatedAt: new Date("2025-05-01"),
      modelVersion: "seed-static-v1",
    },
    events: [
      {
        title: "Monthly NAV audit completed",
        description: "Deloitte completed routine monthly audit of underlying Treasury holdings",
        eventType: "audit",
        severity: "info",
        occurredAt: new Date("2024-12-01"),
        isVerified: true,
      },
      {
        title: "Flux Finance integration live",
        description: "OUSG enabled as collateral on Flux Finance lending markets",
        eventType: "partnership",
        severity: "info",
        occurredAt: new Date("2023-06-15"),
        sourceUrl: "https://ondo.finance",
        isVerified: true,
      },
    ],
    history: [
      { timestamp: new Date("2025-05-20"), tvl: 3_720_000_000, yield: 5.25, holderCount: 1365, riskScore: 82, source: "seed" },
      { timestamp: new Date("2025-05-13"), tvl: 3_690_000_000, yield: 5.2, holderCount: 1357, riskScore: 82, source: "seed" },
      { timestamp: new Date("2025-05-06"), tvl: 3_740_000_000, yield: 5.18, holderCount: 1348, riskScore: 81, source: "seed" },
    ],
  },
  {
    slug: "franklin-benji",
    identity: {
      name: "Franklin OnChain U.S. Government Money Fund",
      symbol: "BENJI",
      fullName: "Franklin OnChain U.S. Government Money Fund (FOBXX)",
      category: "Treasury",
      subcategory: "Government Money Market",
      description:
        "World's first SEC-registered US government money market fund tokenized on blockchain, with shares represented as BENJI tokens",
      websiteUrl: "https://digitalassets.franklintempleton.com/benji",
      twitterUrl: "https://twitter.com/FTI_US",
      launchDate: new Date("2021-04-21"),
      tags: ["institutional", "sec-registered", "40-act-fund", "kyc-required"],
    },
    market: {
      tvl: 401_000_000,
      tvl7dChange: 0.42,
      tvl30dChange: 2.1,
      price: 1.0,
      holderCount: 2840,
      aumUsd: 401_000_000,
      lastUpdated: new Date("2025-05-20"),
      sources: ["defillama", "franklin_templeton"],
      confidence: "HIGH",
    },
    risk: {
      overallScore: 88,
      overallLevel: "LOW",
      smartContractRisk: 80,
      counterpartyRisk: 92,
      liquidityRisk: 78,
      regulatoryRisk: 95,
      marketRisk: 88,
      concentrationRisk: 70,
      riskFactors: ["Permissioned transfer restrictions", "Fund share not freely tradable on DEXs"],
      mitigants: ["SEC Investment Company Act registered", "BNY Mellon custodian", "Established asset manager since 1947"],
      assessmentMethod: "hybrid",
      lastAssessed: new Date("2025-01-20"),
    },
    reserve: {
      backingType: "US Government Securities",
      backingDescription: "Portfolio of US government securities, repurchase agreements, and cash equivalents per '40 Act MMF rules",
      collateralizationRatio: 1.0,
      custodian: "BNY Mellon",
      custodianUrl: "https://www.bnymellon.com",
      hasProofOfReserves: true,
      auditor: "PricewaterhouseCoopers",
      lastAuditDate: new Date("2024-11-30"),
      reserveBreakdown: { "US Treasury securities": 45, "Agency securities": 30, "Repurchase agreements": 20, Cash: 5 },
      redemptionAsset: "USD",
    },
    yield: {
      currentYield: 4.85,
      yieldType: "variable",
      yieldFrequency: "daily",
      yieldBenchmark: "SOFR",
      yieldVsBenchmark: -15,
      yieldAvg7d: 4.82,
      yieldAvg30d: 4.79,
      yieldCurrency: "USD",
    },
    institutional: {
      issuerName: "Franklin Templeton",
      issuerType: "asset_manager",
      issuerCountry: "US",
      fundManager: "Franklin Templeton Fixed Income",
      legalStructure: "Delaware Statutory Trust (Registered Investment Company)",
      minimumInvestment: 20,
      managementFee: 0.15,
      targetInvestors: "institutional",
    },
    blockchain: [
      {
        chain: "polygon",
        chainId: 137,
        contractAddress: "0x408a634b8a8f0de729b48574a3a7ec3fe820b00a",
        tokenStandard: "ERC-20",
        hasWhitelist: true,
        hasTransferRestrictions: true,
        isVerified: true,
        explorerUrl: "https://polygonscan.com/token/0x408a634b8a8f0de729b48574a3a7ec3fe820b00a",
      },
      {
        chain: "stellar",
        contractAddress: "GBHNGLLIE3KWGKCHIKMHJ5HVZHYIK7WTBE4QF5PLAKL4CJGSEU7HZIW5",
        tokenStandard: "Stellar Asset",
        hasWhitelist: true,
        hasTransferRestrictions: true,
        isVerified: true,
        explorerUrl: "https://stellar.expert/explorer/public/asset/BENJI-GBHNGLLIE3KWGKCHIKMHJ5HVZHYIK7WTBE4QF5PLAKL4CJGSEU7HZIW5",
      },
    ],
    compliance: {
      regulatoryStatus: "registered",
      primaryRegulator: "SEC",
      regulatoryFramework: "Investment Company Act of 1940",
      kycRequired: true,
      accreditedOnly: false,
      blockedJurisdictions: ["CN", "KP", "IR"],
      sanctionsScreening: true,
      amlPolicy: "Full OFAC and sanctions screening via Benji Investments platform",
      lastComplianceCheck: new Date("2025-05-01"),
    },
    liquidity: {
      redemptionType: "T+1",
      redemptionPeriodDays: 1,
      lockupPeriodDays: 0,
      minRedemptionAmount: 20,
      liquidityScore: 72,
      liquidityNotes: "Redemptions processed via Benji Investments app; Stellar primary chain with Polygon secondary",
    },
    aiNarrative: {
      summary:
        "BENJI is the pioneering tokenized SEC-registered money market fund from Franklin Templeton, setting the standard for TradFi-on-chain integration.",
      opportunities: ["Multi-chain expansion", "Institutional RWA benchmark", "Regulatory clarity as '40 Act fund"],
      risks: ["Permissioned transfers limit DeFi composability", "Reliance on off-chain fund administration"],
      outlook: "bullish",
      outlookReason: "Strong institutional adoption and regulatory precedent for tokenized MMFs",
      confidence: "high",
      keyMetrics: { tvl: 401_000_000, yield: 4.85, riskScore: 88 },
      compareTo: ["ondo-ousg"],
      generatedAt: new Date("2025-05-01"),
      modelVersion: "seed-static-v1",
    },
    events: [
      {
        title: "BENJI token launched on Stellar",
        description: "Franklin Templeton launched the world's first US-registered MMF on blockchain via Stellar",
        eventType: "launch",
        severity: "info",
        occurredAt: new Date("2021-04-21"),
        sourceUrl: "https://digitalassets.franklintempleton.com/benji",
        isVerified: true,
      },
      {
        title: "Polygon deployment live",
        description: "BENJI fund token deployed on Polygon network for EVM ecosystem access",
        eventType: "launch",
        severity: "info",
        occurredAt: new Date("2023-09-12"),
        isVerified: true,
      },
    ],
    history: [
      { timestamp: new Date("2025-05-20"), tvl: 401_000_000, yield: 4.85, holderCount: 2840, riskScore: 88, source: "seed" },
      { timestamp: new Date("2025-05-13"), tvl: 399_000_000, yield: 4.82, holderCount: 2825, riskScore: 88, source: "seed" },
      { timestamp: new Date("2025-05-06"), tvl: 395_000_000, yield: 4.79, holderCount: 2810, riskScore: 87, source: "seed" },
    ],
  },
  {
    slug: "maple-usdc",
    identity: {
      name: "Maple USDC Pool",
      symbol: "mUSDC",
      fullName: "Maple Finance Institutional USDC Lending Pool",
      category: "Credit",
      subcategory: "Senior Secured Corporate",
      description:
        "Institutional overcollateralized lending pool providing USDC yield from secured loans to vetted crypto-native corporates",
      websiteUrl: "https://maple.finance",
      twitterUrl: "https://twitter.com/maplefinance",
      docsUrl: "https://docs.maple.finance",
      launchDate: new Date("2021-12-01"),
      tags: ["institutional", "overcollateralized", "defi-credit", "audited"],
    },
    market: {
      tvl: 324_100_000,
      tvl7dChange: -1.8,
      tvl30dChange: 4.2,
      holderCount: 796,
      aumUsd: 324_100_000,
      lastUpdated: new Date("2025-05-20"),
      sources: ["defillama", "maple_finance"],
      confidence: "HIGH",
    },
    risk: {
      overallScore: 62,
      overallLevel: "MEDIUM",
      smartContractRisk: 70,
      counterpartyRisk: 55,
      liquidityRisk: 60,
      regulatoryRisk: 50,
      marketRisk: 58,
      concentrationRisk: 45,
      riskFactors: [
        "Borrower default risk despite overcollateralization",
        "Concentration in crypto-native borrowers",
        "Smart contract dependency",
      ],
      mitigants: [
        "Overcollateralized loans (108%+ coverage)",
        "Qualified custody for collateral",
        "Legal recourse via off-chain agreements",
        "Credit delegate underwriting",
      ],
      assessmentMethod: "hybrid",
      lastAssessed: new Date("2025-01-10"),
    },
    reserve: {
      backingType: "Overcollateralized Corporate Loans",
      backingDescription:
        "USDC lent to institutional borrowers secured by liquid digital asset collateral held in qualified custody",
      collateralizationRatio: 1.088,
      custodian: "Coinbase Custody",
      hasProofOfReserves: true,
      lastAuditDate: new Date("2024-10-15"),
      auditor: "Trail of Bits (smart contract)",
      reserveBreakdown: { "Outstanding loans": 85, "Pool cash buffer": 15 },
      redemptionAsset: "USDC",
    },
    yield: {
      currentYield: 8.91,
      yieldType: "variable",
      yieldFrequency: "continuous",
      yieldBenchmark: "USDC base yield",
      yieldVsBenchmark: 650,
      yieldAvg7d: 8.85,
      yieldAvg30d: 8.72,
      yieldMin52w: 7.5,
      yieldMax52w: 16.83,
      yieldCurrency: "USD",
    },
    institutional: {
      issuerName: "Maple Finance",
      issuerType: "protocol_native",
      issuerCountry: "KY",
      fundManager: "Maple Labs",
      legalStructure: "Cayman Islands Foundation",
      minimumInvestment: 100_000,
      managementFee: 0,
      performanceFee: 20,
      targetInvestors: "institutional",
    },
    blockchain: [
      {
        chain: "ethereum",
        chainId: 1,
        contractAddress: "0x36d8c79B4c18D3b39d9aA27C7Fde5f04CeBc9D7",
        tokenStandard: "ERC-20",
        hasWhitelist: true,
        hasTransferRestrictions: false,
        isVerified: true,
        explorerUrl: "https://etherscan.io/token/0x36d8c79B4c18D3b39d9aA27C7Fde5f04CeBc9D7",
      },
    ],
    compliance: {
      regulatoryStatus: "unregulated",
      primaryRegulator: null,
      regulatoryFramework: "DeFi protocol — no securities registration",
      kycRequired: true,
      accreditedOnly: true,
      blockedJurisdictions: ["US", "CN", "KP"],
      sanctionsScreening: true,
      amlPolicy: "Institutional KYC/AML via Maple onboarding",
    },
    liquidity: {
      redemptionType: "instant",
      redemptionPeriodDays: 0,
      lockupPeriodDays: 0,
      minRedemptionAmount: 100_000,
      liquidityScore: 65,
      onchainLiquidity: 45_000_000,
      liquidityNotes: "Withdrawals subject to pool liquidity; 30-day max time to liquidity for full pool",
    },
    aiNarrative: {
      summary:
        "Maple USDC pool offers institutional-grade overcollateralized lending yields, bridging TradFi credit practices with on-chain capital markets.",
      opportunities: ["High yield vs Treasury products", "Growing institutional lender base", "Syrup.fi retail expansion"],
      risks: ["Borrower concentration", "Smart contract risk", "Limited regulatory clarity"],
      outlook: "neutral",
      outlookReason: "Strong yields offset by higher credit risk profile vs Treasury RWAs",
      confidence: "medium",
      keyMetrics: { tvl: 324_100_000, yield: 8.91, riskScore: 62 },
      compareTo: ["ondo-ousg"],
      generatedAt: new Date("2025-05-01"),
      modelVersion: "seed-static-v1",
    },
    events: [
      {
        title: "Maple Insto scaled to $310M TVL",
        description: "Institutional secured lending pool reached $310M in total value locked",
        eventType: "yield_change",
        severity: "info",
        occurredAt: new Date("2024-12-31"),
        sourceUrl: "https://maple.finance/news/maple-yield-performance-2024",
        isVerified: true,
      },
      {
        title: "Smart contract audit by Trail of Bits",
        description: "Core Maple v2 contracts audited with no critical findings",
        eventType: "audit",
        severity: "info",
        occurredAt: new Date("2024-10-15"),
        isVerified: true,
      },
    ],
    history: [
      { timestamp: new Date("2025-05-20"), tvl: 324_100_000, yield: 8.91, holderCount: 796, riskScore: 62, source: "seed" },
      { timestamp: new Date("2025-05-13"), tvl: 330_000_000, yield: 8.95, holderCount: 788, riskScore: 62, source: "seed" },
      { timestamp: new Date("2025-05-06"), tvl: 318_000_000, yield: 8.85, holderCount: 780, riskScore: 61, source: "seed" },
    ],
  },
];

const RICH_SLUGS = new Set(RICH_ASSETS.map((a) => a.slug));
const MINIMAL_FOR_SEED = MINIMAL_ASSET_SEEDS.filter((a) => !RICH_SLUGS.has(a.slug));
const ASSETS: SeedEntry[] = [...MINIMAL_FOR_SEED, ...RICH_ASSETS];

const API_KEYS = [
  { name: "Test Free Key", tier: KeyTier.FREE, plainKey: "nexus_test_free_001" },
  { name: "Test Pro Key", tier: KeyTier.PREMIUM, plainKey: "nexus_test_pro_001" },
] as const;

function hashApiKey(plainKey: string): string {
  return createHash("sha256").update(plainKey).digest("hex");
}

function apiKeyPrefix(plainKey: string): string {
  return plainKey.slice(0, 12);
}

function buildAssetCreate(entry: SeedEntry) {
  const base = {
    slug: entry.slug,
    dataVersion: 1,
    isActive: true,
    identity: { create: entry.identity },
    market: { create: entry.market },
    risk: { create: entry.risk },
    compliance: { create: entry.compliance },
    liquidity: { create: entry.liquidity },
  };

  if (!isFullAssetSeed(entry)) {
    return base;
  }

  return {
    ...base,
    reserve: { create: entry.reserve },
    yield: { create: entry.yield },
    institutional: { create: entry.institutional },
    blockchain: { create: entry.blockchain },
    aiNarrative: { create: entry.aiNarrative },
    events: { create: entry.events },
    history: { create: entry.history },
  };
}

function buildAssetUpdate(entry: SeedEntry) {
  const base = {
    dataVersion: 1,
    isActive: true,
    identity: { upsert: { create: entry.identity, update: entry.identity } },
    market: { upsert: { create: entry.market, update: entry.market } },
    risk: { upsert: { create: entry.risk, update: entry.risk } },
    compliance: { upsert: { create: entry.compliance, update: entry.compliance } },
    liquidity: { upsert: { create: entry.liquidity, update: entry.liquidity } },
  };

  if (!isFullAssetSeed(entry)) {
    return base;
  }

  return {
    ...base,
    reserve: { upsert: { create: entry.reserve, update: entry.reserve } },
    yield: { upsert: { create: entry.yield, update: entry.yield } },
    institutional: { upsert: { create: entry.institutional, update: entry.institutional } },
    aiNarrative: { upsert: { create: entry.aiNarrative, update: entry.aiNarrative } },
    blockchain: {
      deleteMany: {},
      create: entry.blockchain,
    },
    events: {
      deleteMany: {},
      create: entry.events,
    },
    history: {
      deleteMany: {},
      create: entry.history,
    },
  };
}

async function seedAsset(asset: SeedEntry) {
  const kind = isFullAssetSeed(asset) ? "full" : "minimal";
  console.log(`[seed] Upserting asset (${kind}): ${asset.slug}`);

  await prisma.asset.upsert({
    where: { slug: asset.slug },
    create: buildAssetCreate(asset),
    update: buildAssetUpdate(asset),
  });
}

async function deactivateLegacyAssets() {
  const result = await prisma.asset.updateMany({
    where: { slug: { notIn: [...TARGET_ASSET_SLUGS] } },
    data: { isActive: false },
  });
  if (result.count > 0) {
    console.log(`[seed] Deactivated ${result.count} legacy asset(s)`);
  }
}

async function verifySeed() {
  const count = await prisma.asset.count({ where: { isActive: true } });
  const withLayers = await prisma.asset.findMany({
    where: { isActive: true },
    select: {
      slug: true,
      identity: { select: { name: true } },
      compliance: { select: { id: true } },
      market: { select: { id: true } },
      risk: { select: { id: true } },
      liquidity: { select: { id: true } },
    },
    orderBy: { slug: "asc" },
  });

  const missing = withLayers.filter((a) => !a.identity || !a.compliance);
  console.log(`\n[seed] Verification`);
  console.log(`  Active assets: ${count}`);
  console.log(`  With identity + compliance: ${withLayers.length - missing.length}/${withLayers.length}`);

  if (count !== 13) {
    throw new Error(`Expected 13 active assets, got ${count}`);
  }
  if (missing.length > 0) {
    throw new Error(
      `Assets missing identity or compliance: ${missing.map((a) => a.slug).join(", ")}`,
    );
  }

  for (const a of withLayers) {
    const ok =
      a.identity && a.compliance && a.market && a.risk && a.liquidity ? "✓" : "✗";
    console.log(`  ${ok} ${a.slug}`);
  }
}

async function seedApiKeys() {
  for (const key of API_KEYS) {
    const keyHash = hashApiKey(key.plainKey);
    const prefix = apiKeyPrefix(key.plainKey);

    await prisma.apiKey.upsert({
      where: { keyHash },
      create: {
        keyHash,
        prefix,
        name: key.name,
        tier: key.tier,
        isActive: true,
      },
      update: {
        prefix,
        name: key.name,
        tier: key.tier,
        isActive: true,
      },
    });

    console.log(`[seed] ApiKey "${key.name}" (${key.tier}) → ${key.plainKey}`);
  }
}

async function main() {
  try {
    for (const asset of ASSETS) {
      await seedAsset(asset);
    }

    await deactivateLegacyAssets();
    await seedApiKeys();
    await verifySeed();

    console.log("\n[seed] Summary");
    console.log(`  Assets upserted: ${ASSETS.length}`);
    console.log(`  ApiKeys upserted: ${API_KEYS.length}`);
    console.log(`  Slugs: ${ASSETS.map((a) => a.slug).join(", ")}`);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[seed] FAILED:", message);
    throw e;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
