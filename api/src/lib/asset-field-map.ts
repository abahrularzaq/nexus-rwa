/**
 * Programmatic field map: ideal parameter → Prisma path + fill source.
 * See api/docs/ASSET_FIELD_MAP.md for human-readable documentation.
 */

export type FieldSource = 'manual' | 'sync' | 'ai' | 'gap';

export type IdealFieldDef = {
  ideal: string;
  prismaPath: string | null;
  source: FieldSource;
  layer: string;
  notes?: string;
};

export const IDEAL_FIELD_MAP: IdealFieldDef[] = [
  // Identity
  { ideal: 'asset_name', prismaPath: 'identity.name', source: 'manual', layer: 'identity' },
  { ideal: 'ticker', prismaPath: 'identity.symbol', source: 'manual', layer: 'identity' },
  { ideal: 'issuer', prismaPath: 'institutional.issuerName', source: 'manual', layer: 'identity' },
  { ideal: 'category', prismaPath: 'identity.category', source: 'manual', layer: 'identity' },
  { ideal: 'chain', prismaPath: 'blockchain[].chain', source: 'manual', layer: 'identity' },
  { ideal: 'launch_date', prismaPath: 'identity.launchDate', source: 'manual', layer: 'identity' },
  { ideal: 'jurisdiction', prismaPath: 'institutional.issuerCountry', source: 'manual', layer: 'identity' },
  { ideal: 'website', prismaPath: 'identity.websiteUrl', source: 'manual', layer: 'identity' },
  { ideal: 'custodian', prismaPath: 'reserve.custodian', source: 'manual', layer: 'identity' },
  { ideal: 'auditor', prismaPath: 'reserve.auditor', source: 'manual', layer: 'identity' },
  // Market
  { ideal: 'price', prismaPath: 'market.price', source: 'sync', layer: 'market' },
  { ideal: 'market_cap', prismaPath: 'market.marketCap', source: 'sync', layer: 'market' },
  { ideal: 'TVL', prismaPath: 'market.tvl', source: 'sync', layer: 'market' },
  { ideal: 'volume', prismaPath: 'market.volume24h', source: 'sync', layer: 'market' },
  { ideal: 'holders', prismaPath: 'market.holderCount', source: 'sync', layer: 'market' },
  {
    ideal: 'liquidity',
    prismaPath: 'liquidity.liquidityScore',
    source: 'manual',
    layer: 'market',
    notes: 'Also onchainLiquidity, dexPairs',
  },
  {
    ideal: 'redemption_flow',
    prismaPath: 'liquidity.redemptionType',
    source: 'manual',
    layer: 'market',
  },
  { ideal: 'mint_flow', prismaPath: null, source: 'gap', layer: 'market' },
  { ideal: 'yield', prismaPath: 'yield.currentYield', source: 'sync', layer: 'market' },
  // Risk
  { ideal: 'counterparty_risk', prismaPath: 'risk.counterpartyRisk', source: 'sync', layer: 'risk' },
  {
    ideal: 'custody_risk',
    prismaPath: null,
    source: 'gap',
    layer: 'risk',
    notes: 'Proxy: counterpartyRisk',
  },
  { ideal: 'liquidity_risk', prismaPath: 'risk.liquidityRisk', source: 'sync', layer: 'risk' },
  { ideal: 'depeg_risk', prismaPath: null, source: 'gap', layer: 'risk' },
  {
    ideal: 'oracle_risk',
    prismaPath: null,
    source: 'gap',
    layer: 'risk',
    notes: 'Proxy: smartContractRisk',
  },
  { ideal: 'regulatory_risk', prismaPath: 'risk.regulatoryRisk', source: 'sync', layer: 'risk' },
  { ideal: 'concentration_risk', prismaPath: 'risk.concentrationRisk', source: 'sync', layer: 'risk' },
  // Reserve
  { ideal: 'reserve_breakdown', prismaPath: 'reserve.reserveBreakdown', source: 'manual', layer: 'reserve' },
  { ideal: 'proof_of_reserve', prismaPath: 'reserve.hasProofOfReserves', source: 'manual', layer: 'reserve' },
  { ideal: 'reserve_frequency', prismaPath: null, source: 'gap', layer: 'reserve' },
  { ideal: 'attestation_provider', prismaPath: null, source: 'gap', layer: 'reserve' },
  { ideal: 'reserve_quality', prismaPath: null, source: 'gap', layer: 'reserve' },
  {
    ideal: 'backing_ratio',
    prismaPath: 'reserve.collateralizationRatio',
    source: 'manual',
    layer: 'reserve',
  },
  // Yield intelligence
  { ideal: 'yield_source', prismaPath: null, source: 'gap', layer: 'yield' },
  { ideal: 'yield_sustainability', prismaPath: null, source: 'gap', layer: 'yield' },
  {
    ideal: 'historical_yield',
    prismaPath: 'history[].yield',
    source: 'sync',
    layer: 'yield',
  },
  { ideal: 'yield_volatility', prismaPath: 'yield.yieldStdDev30d', source: 'sync', layer: 'yield' },
  { ideal: 'real_yield', prismaPath: null, source: 'gap', layer: 'yield' },
  {
    ideal: 'yield_comparison',
    prismaPath: 'yield.yieldVsBenchmark',
    source: 'sync',
    layer: 'yield',
  },
  // Institutional
  { ideal: 'issuer_reputation', prismaPath: null, source: 'gap', layer: 'institutional' },
  { ideal: 'aum', prismaPath: 'market.aumUsd', source: 'sync', layer: 'institutional' },
  { ideal: 'institutional_backers', prismaPath: null, source: 'gap', layer: 'institutional' },
  {
    ideal: 'partnerships',
    prismaPath: null,
    source: 'gap',
    layer: 'institutional',
    notes: 'Use AssetEvent eventType partnership',
  },
  {
    ideal: 'compliance_status',
    prismaPath: 'compliance.regulatoryStatus',
    source: 'manual',
    layer: 'institutional',
  },
  // Blockchain
  {
    ideal: 'smart_contracts',
    prismaPath: 'blockchain[].contractAddress',
    source: 'manual',
    layer: 'blockchain',
  },
  { ideal: 'chains', prismaPath: 'blockchain[].chain', source: 'manual', layer: 'blockchain' },
  { ideal: 'bridge_risk', prismaPath: null, source: 'gap', layer: 'blockchain' },
  { ideal: 'wallet_distribution', prismaPath: null, source: 'gap', layer: 'blockchain' },
  { ideal: 'whale_concentration', prismaPath: null, source: 'gap', layer: 'blockchain' },
  // Historical
  { ideal: 'historical_tvl', prismaPath: 'history[].tvl', source: 'sync', layer: 'history' },
  { ideal: 'historical_yield', prismaPath: 'history[].yield', source: 'sync', layer: 'history' },
  { ideal: 'historical_price', prismaPath: 'history[].price', source: 'sync', layer: 'history' },
  {
    ideal: 'historical_holders',
    prismaPath: 'history[].holderCount',
    source: 'sync',
    layer: 'history',
  },
  {
    ideal: 'historical_risk_score',
    prismaPath: 'history[].riskScore',
    source: 'sync',
    layer: 'history',
  },
  // AI
  { ideal: 'ai_summary', prismaPath: 'aiNarrative.summary', source: 'ai', layer: 'aiNarrative' },
  {
    ideal: 'ai_opportunities',
    prismaPath: 'aiNarrative.opportunities',
    source: 'ai',
    layer: 'aiNarrative',
  },
  { ideal: 'ai_risks', prismaPath: 'aiNarrative.risks', source: 'ai', layer: 'aiNarrative' },
  { ideal: 'ai_outlook', prismaPath: 'aiNarrative.outlook', source: 'ai', layer: 'aiNarrative' },
  // Events
  { ideal: 'events', prismaPath: 'events[]', source: 'manual', layer: 'events' },
];

export const GAP_FIELDS = IDEAL_FIELD_MAP.filter((f) => f.source === 'gap');
