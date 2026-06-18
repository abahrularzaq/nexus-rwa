import { createHash } from "node:crypto";
import { PrismaClient, KeyTier } from "@prisma/client";
import {
  EXPANDED_CATALOG_SEEDS,
  type AssetSeed,
  type SeedEntry,
  isFullAssetSeed,
} from "./seed-helpers.js";

const prisma = new PrismaClient();

/** Local bootstrap/dev fallback assets. Canonical asset content is imported from data/assets/{slug}. */
const RICH_ASSETS: AssetSeed[] = [
  {
    slug: "ondo-ousg",
    identity: {
      name: "Ondo Short-Term US Government Treasuries",
      symbol: "OUSG",
      fullName: "Ondo Short-Term US Government Treasuries",
      category: "Treasury",
      subcategory: "Tokenized US Treasury Fund",
      description:
        "Tokenized fund providing on-chain exposure to short-term U.S. Treasury securities and institutional money market instruments",
      websiteUrl: "https://ondo.finance/ousg",
      docsUrl: "https://docs.ondo.finance/ondo-global-markets/trust-and-transparency",
      twitterUrl: "https://x.com/OndoFinance",
      launchDate: new Date("2023-01-01"),
      tags: ["institutional", "kyc-required", "audited", "permissioned", "cross-chain"],
    },
    market: {
      tvl: 3_690_000_000,
      tvl7dChange: -1.31,
      holderCount: 1357,
      sources: ["defillama"],
      confidence: "MEDIUM",
    },
    risk: {
      overallScore: 69,
      overallLevel: "MEDIUM",
      smartContractRisk: 55,
      counterpartyRisk: 72,
      liquidityRisk: 80,
      regulatoryRisk: 75,
      marketRisk: 70,
      concentrationRisk: 50,
      riskFactors: [
        "Reserve concentration risk: BlackRock BUIDL represents 82.57% of disclosed reserve portfolio",
        "No on-chain proof-of-reserves oracle",
        "No independent reserve audit identified",
        "Regulatory exemption structure under Reg D",
        "Operational dependency chain across Ankura, fund managers, and Ondo compliance infrastructure",
      ],
      mitigants: [
        "Underlying reserve assets are short-duration U.S. Treasury and government MMF instruments",
        "Reserve portfolio diversified across five regulated institutional funds",
        "Ankura Trust Company, LLC serves as independent custodian",
        "KYC/AML and sanctions screening enforced at onboarding",
        "Multi-chain deployment and instant redemption infrastructure",
      ],
      assessmentMethod: "ai-assisted",
      lastAssessed: new Date("2026-05-31"),
    },
    reserve: {
      backingType: "US Treasury",
      backingDescription:
        "Short-term U.S. Treasury securities and related cash-equivalent money market instruments held through regulated institutional funds",
      collateralizationRatio: null,
      custodian: "Ankura Trust Company, LLC",
      custodianUrl: "https://www.ankura.com",
      hasProofOfReserves: false,
      auditor: null,
      lastAuditDate: null,
      reserveBreakdown: {
        "BlackRock USD Institutional Digital Liquidity Fund (BUIDL)": 82.57,
        "WisdomTree Government Money Market Digital Fund (WTGXX)": 8.13,
        "Franklin OnChain U.S. Government Money Fund (BENJI)": 4.88,
        "Fundbridge Capital Institutional Funds ICAV (FBOXX)": 2.39,
        "Superstate Short Duration U.S. Government Securities Fund (USTB)": 2.03,
      },
      redemptionAsset: "USD",
    },
    yield: {
      currentYield: 5.2,
      yieldType: "variable",
      yieldFrequency: null,
      yieldBenchmark: "Short-term U.S. Treasury yield",
      yieldCurrency: "USD",
    },
    institutional: {
      issuerName: "Ondo I LP",
      issuerType: "protocol_native",
      issuerCountry: "US",
      fundManager: "Ondo Capital Management LLC",
      legalStructure: "Delaware Limited Partnership",
      minimumInvestment: 100_000,
      managementFee: null,
      performanceFee: null,
      targetInvestors: "accredited",
      prospectuUrl: "https://ondo.finance/ousg",
      metadata: {
        defiLlamaProtocol: "ondo-finance",
        defiLlamaPool: "ousg",
        coingeckoId: "ousg",
        rwaDotXyzId: "ondo-finance",
      },
    },
    blockchain: [
      {
        chain: "ethereum",
        chainId: 1,
        contractAddress: "0x1bfe8cb57a0f5ecca7e7666798d9fb3f3a9befae",
        tokenStandard: "ERC-20",
        isTransferable: true,
        hasWhitelist: true,
        hasTransferRestrictions: true,
        isVerified: true,
        explorerUrl: "https://etherscan.io/token/0x1bfe8cb57a0f5ecca7e7666798d9fb3f3a9befae",
      },
    ],
    compliance: {
      regulatoryStatus: "exempt",
      primaryRegulator: "SEC",
      regulatoryFramework: "Reg D",
      kycRequired: true,
      accreditedOnly: true,
      blockedJurisdictions: ["CN", "KP", "IR", "SY", "CU", "RU"],
      allowedJurisdictions: [],
      sanctionsScreening: true,
      amlPolicy: "Ondo Finance performs KYC/AML screening and sanctions checks for all investors.",
    },
    liquidity: {
      redemptionType: "T+1",
      redemptionPeriodDays: 1,
      lockupPeriodDays: null,
      minRedemptionAmount: 100_000,
      liquidityScore: 78,
      dexPairs: [],
      liquidityNotes:
        "OUSG redemptions are processed through issuer-controlled institutional onboarding and treasury settlement infrastructure.",
    },
    aiNarrative: {
      summary:
        "OUSG is a tokenized short-term U.S. Treasury product from Ondo Finance, positioned for accredited and institutional investors with multi-chain deployment and T+1 redemption.",
      opportunities: [
        "Short-duration sovereign-backed yield exposure",
        "Multi-chain institutional access",
        "Instant redemption infrastructure via stablecoin rails",
      ],
      risks: [
        "BUIDL reserve concentration above 80%",
        "No on-chain proof-of-reserves",
        "Reg D access restrictions",
      ],
      outlook: "neutral",
      outlookReason: "Conservative Treasury backing offset by disclosure and concentration risks",
      confidence: "medium",
      keyMetrics: { riskScore: 69, liquidityScore: 78 },
      compareTo: ["franklin-benji", "superstate-ustb"],
      generatedAt: new Date("2026-05-31"),
      modelVersion: "file-import-v1",
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
/** Former minimal catalog assets — now full 12-layer via expandMinimalSeedToFull. */
const EXPANDED_FOR_SEED = EXPANDED_CATALOG_SEEDS.filter((a) => !RICH_SLUGS.has(a.slug));
const ASSETS: SeedEntry[] = [...EXPANDED_FOR_SEED, ...RICH_ASSETS];

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

async function seedAsset(asset: SeedEntry) {
  const kind = isFullAssetSeed(asset) ? "full" : "minimal";
  const existing = await prisma.asset.findUnique({
    where: { slug: asset.slug },
    select: { id: true },
  });

  if (existing) {
    console.log(
      `[seed] Skipping existing asset (${kind}): ${asset.slug} — asset file import data is preserved`,
    );
    return false;
  }

  console.log(`[seed] Creating bootstrap asset (${kind}): ${asset.slug}`);
  await prisma.asset.create({
    data: buildAssetCreate(asset),
  });
  return true;
}

async function verifySeed() {
  const count = await prisma.asset.count({ where: { isActive: true } });
  const withLayers = await prisma.asset.findMany({
    where: { isActive: true },
    select: {
      slug: true,
      identity: { select: { id: true } },
      market: { select: { id: true } },
      risk: { select: { id: true } },
      reserve: { select: { id: true } },
      yield: { select: { id: true } },
      institutional: { select: { id: true } },
      blockchain: { select: { id: true }, take: 1 },
      compliance: { select: { id: true } },
      liquidity: { select: { id: true } },
      aiNarrative: { select: { id: true } },
      _count: { select: { events: true, history: true } },
    },
    orderBy: { slug: "asc" },
  });

  const missingCore = withLayers.filter(
    (a) =>
      !a.identity ||
      !a.market ||
      !a.risk ||
      !a.reserve ||
      !a.yield ||
      !a.institutional ||
      a.blockchain.length === 0 ||
      !a.compliance ||
      !a.liquidity ||
      !a.aiNarrative,
  );
  const missingHistory = withLayers.filter((a) => a._count.history < 1);
  const missingEvents = withLayers.filter((a) => a._count.events < 1);

  console.log(`\n[seed] Verification`);
  console.log(`  Active assets: ${count}`);
  console.log(
    `  Full 12-layer core: ${withLayers.length - missingCore.length}/${withLayers.length}`,
  );
  console.log(
    `  With history + events: ${withLayers.filter((a) => a._count.history >= 1 && a._count.events >= 1).length}/${withLayers.length}`,
  );

  if (missingCore.length > 0) {
    console.warn(
      `  Warning: assets missing core layers: ${missingCore.map((a) => a.slug).join(", ")}`,
    );
  }
  if (missingHistory.length > 0) {
    console.warn(
      `  Warning: assets missing history: ${missingHistory.map((a) => a.slug).join(", ")}`,
    );
  }
  if (missingEvents.length > 0) {
    console.warn(
      `  Warning: assets missing events: ${missingEvents.map((a) => a.slug).join(", ")}`,
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
    let assetsCreated = 0;
    for (const asset of ASSETS) {
      if (await seedAsset(asset)) {
        assetsCreated += 1;
      }
    }

    await seedApiKeys();
    await verifySeed();

    console.log("\n[seed] Summary");
    console.log(`  Bootstrap assets created: ${assetsCreated}`);
    console.log(`  Bootstrap assets skipped: ${ASSETS.length - assetsCreated}`);
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
