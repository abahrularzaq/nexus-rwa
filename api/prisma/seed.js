import { PrismaClient, AssetCategory, Chain, RiskLevel } from "@prisma/client";
const prisma = new PrismaClient();
const RWA_ASSETS = [
    {
        id: "ondo-usdy",
        name: "Ondo USDY",
        symbol: "USDY",
        protocol: "Ondo Finance",
        category: AssetCategory.TREASURY,
        chain: Chain.base,
        contractAddress: "0x96F6ef951840721AdBF46Ac996b59E0235CB985C",
        description: "US dollar yield-bearing stablecoin backed by US Treasuries",
    },
    {
        id: "maple-usdc",
        name: "Maple USDC",
        symbol: "mUSDC",
        protocol: "Maple Finance",
        category: AssetCategory.CREDIT,
        chain: Chain.ethereum,
        contractAddress: "0x36d8c79B4c18D3b39d9aA27C7Fde5f04CeBc9D7",
        description: "Institutional lending pool for blue-chip crypto companies",
    },
    {
        id: "centrifuge-drop",
        name: "Centrifuge DROP",
        symbol: "DROP",
        protocol: "Centrifuge",
        category: AssetCategory.CREDIT,
        chain: Chain.ethereum,
        contractAddress: "0x0C32Fa1FA1513C4C2cB34e0C1e81c5A8D16e3a02",
        description: "Senior tranche token for real-world asset financing",
    },
    {
        id: "backed-buidl",
        name: "Backed BUIDL",
        symbol: "bBUIDL",
        protocol: "Backed Finance",
        category: AssetCategory.TREASURY,
        chain: Chain.ethereum,
        contractAddress: "0x7712c34205737192402172409a8F7ccef8aA2AEc",
        description: "Tokenized BlackRock USD Institutional Digital Liquidity Fund",
    },
    {
        id: "openedon-ousg",
        name: "OpenEden OUSG",
        symbol: "OUSG",
        protocol: "OpenEden",
        category: AssetCategory.TREASURY,
        chain: Chain.ethereum,
        contractAddress: "0x4eB405CD7e6AF70E54E4853a81D17A4bF3a0BA78",
        description: "Tokenized short-term US Treasury Bills",
    },
    {
        id: "ondo-ousg",
        name: "Ondo OUSG",
        symbol: "OUSG2",
        protocol: "Ondo Finance",
        category: AssetCategory.TREASURY,
        chain: Chain.ethereum,
        contractAddress: "0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92",
        description: "Ondo Short-Term US Government Bond Fund tokenized",
    },
    {
        id: "realt-token",
        name: "RealT Token",
        symbol: "REALT",
        protocol: "RealT",
        category: AssetCategory.REAL_ESTATE,
        chain: Chain.ethereum,
        contractAddress: "0x9C2023636A4f7a00E85a4C60b27F28bD5Ef24b0d",
        description: "Fractional ownership of US rental real estate properties",
    },
    {
        id: "goldfinch-gfi",
        name: "Goldfinch GFI",
        symbol: "GFI",
        protocol: "Goldfinch",
        category: AssetCategory.CREDIT,
        chain: Chain.ethereum,
        contractAddress: "0xdab396cCF3d84Cf2D07C4454e10C8A6F5b008D2b",
        description: "Decentralized credit protocol for emerging market borrowers",
    },
];
function rng01(seed, salt) {
    let h = 2166136261;
    const s = `${seed}:${salt}`;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967296;
}
function rangeFromSeed(seed, salt, min, max) {
    return min + rng01(seed, salt) * (max - min);
}
function clamp(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
}
function startOfUtcDay(d) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}
function categoryRanges(category) {
    switch (category) {
        case AssetCategory.TREASURY:
            return { tvlMin: 200e6, tvlMax: 900e6, yieldMin: 4.5, yieldMax: 5.8, holdersMin: 800, holdersMax: 5000 };
        case AssetCategory.CREDIT:
            return { tvlMin: 45e6, tvlMax: 350e6, yieldMin: 8.0, yieldMax: 13.0, holdersMin: 200, holdersMax: 1500 };
        case AssetCategory.REAL_ESTATE:
            return { tvlMin: 20e6, tvlMax: 80e6, yieldMin: 10.0, yieldMax: 12.5, holdersMin: 100, holdersMax: 800 };
        default:
            return { tvlMin: 50e6, tvlMax: 200e6, yieldMin: 5, yieldMax: 10, holdersMin: 300, holdersMax: 2000 };
    }
}
function riskConfig(category) {
    switch (category) {
        case AssetCategory.TREASURY:
            return { overall: RiskLevel.LOW, subMin: 0.1, subMax: 0.3 };
        case AssetCategory.CREDIT:
            return { overall: RiskLevel.MEDIUM, subMin: 0.4, subMax: 0.6 };
        case AssetCategory.REAL_ESTATE:
            return { overall: RiskLevel.HIGH, subMin: 0.6, subMax: 0.8 };
        default:
            return { overall: RiskLevel.MEDIUM, subMin: 0.35, subMax: 0.55 };
    }
}
function holderTop10Range(category) {
    switch (category) {
        case AssetCategory.TREASURY:
            return { min: 15, max: 25 };
        case AssetCategory.CREDIT:
            return { min: 35, max: 55 };
        case AssetCategory.REAL_ESTATE:
            return { min: 55, max: 75 };
        default:
            return { min: 30, max: 50 };
    }
}
function buildSnapshots(asset, days) {
    const { tvlMin, tvlMax, yieldMin, yieldMax, holdersMin, holdersMax } = categoryRanges(asset.category);
    const baseTvl = rangeFromSeed(asset.id, 1, tvlMin, tvlMax);
    const baseYield = rangeFromSeed(asset.id, 2, yieldMin, yieldMax);
    const baseHolders = Math.round(rangeFromSeed(asset.id, 3, holdersMin, holdersMax));
    const today = startOfUtcDay(new Date());
    const rows = [];
    let tvl = baseTvl;
    let yld = baseYield;
    let holders = baseHolders;
    for (let i = 0; i < days; i++) {
        const dayNoise = rng01(asset.id, 1000 + i);
        const wobble = (dayNoise - 0.5) * 0.04;
        tvl = clamp(tvl * (1 + wobble), tvlMin * 0.85, tvlMax * 1.15);
        yld = clamp(yld * (1 + wobble * 0.8), yieldMin * 0.9, yieldMax * 1.1);
        const hNoise = (rng01(asset.id, 2000 + i) - 0.5) * 0.04;
        holders = Math.round(clamp(holders * (1 + hNoise), holdersMin, holdersMax));
        const ts = new Date(today);
        ts.setUTCDate(ts.getUTCDate() - (days - 1 - i));
        const priceJitter = 1 + (rng01(asset.id, 3000 + i) - 0.5) * 0.006;
        rows.push({
            assetId: asset.id,
            tvl,
            yieldRate: Math.round(yld * 1000) / 1000,
            holderCount: holders,
            price: Math.round(priceJitter * 10000) / 10000,
            timestamp: ts,
        });
    }
    return rows;
}
async function seedAsset(asset) {
    console.log(`[seed] Processing asset: ${asset.id} (${asset.symbol})`);
    await prisma.asset.upsert({
        where: { id: asset.id },
        create: {
            id: asset.id,
            name: asset.name,
            symbol: asset.symbol,
            protocol: asset.protocol,
            category: asset.category,
            chain: asset.chain,
            contractAddress: asset.contractAddress,
            description: asset.description,
            isActive: true,
        },
        update: {
            name: asset.name,
            symbol: asset.symbol,
            protocol: asset.protocol,
            category: asset.category,
            chain: asset.chain,
            contractAddress: asset.contractAddress,
            description: asset.description,
        },
    });
    await prisma.assetSnapshot.deleteMany({ where: { assetId: asset.id } });
    const snapshots = buildSnapshots(asset, 90);
    await prisma.assetSnapshot.createMany({ data: snapshots });
    await prisma.riskScore.deleteMany({ where: { assetId: asset.id } });
    const rc = riskConfig(asset.category);
    await prisma.riskScore.createMany({
        data: [
            {
                assetId: asset.id,
                overallScore: rc.overall,
                liquidityScore: Math.round(rangeFromSeed(asset.id, 401, rc.subMin, rc.subMax) * 1000) / 1000,
                concentrationScore: Math.round(rangeFromSeed(asset.id, 402, rc.subMin, rc.subMax) * 1000) / 1000,
                protocolAgeScore: Math.round(rangeFromSeed(asset.id, 403, rc.subMin, rc.subMax) * 1000) / 1000,
                volatilityScore: Math.round(rangeFromSeed(asset.id, 404, rc.subMin, rc.subMax) * 1000) / 1000,
            },
        ],
    });
    await prisma.holderSnapshot.deleteMany({ where: { assetId: asset.id } });
    const lastHolders = snapshots[snapshots.length - 1].holderCount;
    const whaleLo = 5;
    const whaleHi = 50;
    let whaleCount = Math.round(rangeFromSeed(asset.id, 501, whaleLo, whaleHi));
    whaleCount = Math.min(whaleCount, Math.max(0, lastHolders - 1));
    const retailCount = Math.max(0, lastHolders - whaleCount);
    const topR = holderTop10Range(asset.category);
    const top10Concentration = Math.round(rangeFromSeed(asset.id, 502, topR.min, topR.max) * 100) / 100;
    await prisma.holderSnapshot.create({
        data: {
            assetId: asset.id,
            totalHolders: lastHolders,
            top10Concentration: top10Concentration,
            whaleCount,
            retailCount,
            timestamp: new Date(),
        },
    });
    return {
        snapshots: snapshots.length,
        riskScores: 1,
        holderSnapshots: 1,
    };
}
async function main() {
    let totalSnapshots = 0;
    let totalRisk = 0;
    let totalHolderSnaps = 0;
    const assetsTouched = RWA_ASSETS.length;
    try {
        for (const asset of RWA_ASSETS) {
            try {
                const counts = await seedAsset(asset);
                totalSnapshots += counts.snapshots;
                totalRisk += counts.riskScores;
                totalHolderSnaps += counts.holderSnapshots;
            }
            catch (inner) {
                const detail = inner instanceof Error ? inner.message : String(inner);
                throw new Error(`Seed failed for asset id="${asset.id}": ${detail}`, { cause: inner });
            }
        }
        console.log("\n[seed] Summary");
        console.log(`  Assets upserted: ${assetsTouched}`);
        console.log(`  AssetSnapshot rows created: ${totalSnapshots}`);
        console.log(`  RiskScore rows created: ${totalRisk}`);
        console.log(`  HolderSnapshot rows created: ${totalHolderSnaps}`);
        console.log(`  Total new records (snapshots + risk + holders): ${totalSnapshots + totalRisk + totalHolderSnaps}`);
    }
    catch (e) {
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
