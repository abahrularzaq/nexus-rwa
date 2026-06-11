export type GlossaryCategory =
  | "rwa-basics"
  | "asset-backing"
  | "legal-compliance"
  | "reserve-proof"
  | "market-liquidity"
  | "yield"
  | "risk-grading";

export type GlossaryTerm = {
  slug: string;
  term: string;
  category: GlossaryCategory;
  shortDefinition: string;
  fullDefinition: string;
  relatedTerms?: string[];
  example?: string;
  nexusContext: string;
  riskNote?: string;
};

export const GLOSSARY_CATEGORY_LABELS: Record<GlossaryCategory, string> = {
  "rwa-basics": "RWA Basics",
  "asset-backing": "Asset & Backing",
  "legal-compliance": "Legal & Compliance",
  "reserve-proof": "Reserve & Proof",
  "market-liquidity": "Market & Liquidity",
  yield: "Yield",
  "risk-grading": "Risk & Grading",
};

export const GLOSSARY_CATEGORY_DESCRIPTIONS: Record<GlossaryCategory, string> = {
  "rwa-basics": "Core concepts for understanding tokenized real-world assets.",
  "asset-backing": "Terms that explain what an RWA token represents or is backed by.",
  "legal-compliance": "Legal structure, investor eligibility, and compliance terms used in institutional RWA products.",
  "reserve-proof": "Reserve, custody, audit, attestation, and proof-related terminology.",
  "market-liquidity": "Metrics used to read asset scale, token activity, and exit quality.",
  yield: "Income, distribution, benchmark, and return terminology for yield-bearing RWA products.",
  "risk-grading": "Nexus RWA scoring, warning, blocker, and review-state terminology.",
};

export const GLOSSARY_CATEGORY_ORDER: GlossaryCategory[] = [
  "rwa-basics",
  "asset-backing",
  "legal-compliance",
  "reserve-proof",
  "market-liquidity",
  "yield",
  "risk-grading",
];

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    slug: "real-world-asset",
    term: "Real World Asset",
    category: "rwa-basics",
    shortDefinition: "An off-chain asset, right, or cash flow represented or referenced on-chain.",
    fullDefinition:
      "A Real World Asset is an asset, claim, or cash flow from the traditional economy that is represented, financed, tracked, or accessed through blockchain infrastructure.",
    relatedTerms: ["tokenization", "underlying-asset", "asset-backed-token"],
    example: "Tokenized treasury funds, private credit pools, real estate claims, and gold-backed tokens.",
    nexusContext:
      "Nexus RWA treats RWA as a broad category and separates direct asset-backed products from infrastructure or governance tokens.",
    riskNote: "Not every token with an RWA narrative gives holders a direct legal claim on the underlying asset.",
  },
  {
    slug: "tokenization",
    term: "Tokenization",
    category: "rwa-basics",
    shortDefinition: "The process of representing an asset, claim, or product as a blockchain token.",
    fullDefinition:
      "Tokenization converts economic exposure, ownership records, claims, or access rights into token-based units that can be tracked or transferred on-chain, subject to legal and compliance rules.",
    relatedTerms: ["real-world-asset", "issuer", "transfer-restriction"],
    example: "A fund share can be issued as a token that records ownership on a blockchain ledger.",
    nexusContext:
      "Nexus RWA looks beyond the token wrapper and checks the issuer, legal structure, backing, transfer rules, and evidence trail.",
    riskNote: "A tokenized product is only as strong as the legal, operational, and custody structure behind it.",
  },
  {
    slug: "issuer",
    term: "Issuer",
    category: "rwa-basics",
    shortDefinition: "The entity responsible for creating, offering, or managing the RWA product.",
    fullDefinition:
      "The issuer is the company, fund, protocol, trust, or legal entity that issues the tokenized product and is responsible for disclosures, operations, or investor obligations.",
    relatedTerms: ["regulated-entity", "prospectus", "fund-structure"],
    example: "A regulated asset manager issuing a tokenized money market fund share.",
    nexusContext: "Issuer quality is part of Nexus RWA evidence review because it affects legal clarity and institutional trust.",
    riskNote: "A strong brand does not automatically prove the token has clean legal rights or complete reserve evidence.",
  },
  {
    slug: "redemption",
    term: "Redemption",
    category: "rwa-basics",
    shortDefinition: "The process of converting a token or fund interest back into cash or the underlying asset.",
    fullDefinition:
      "Redemption is the mechanism that allows eligible holders to exit a tokenized product according to issuer rules, settlement timelines, minimums, fees, and compliance requirements.",
    relatedTerms: ["redemption-period", "lock-up-period", "redemption-asset"],
    example: "An investor redeems a tokenized treasury product for USD after a T+1 settlement period.",
    nexusContext: "Nexus RWA uses redemption terms as a core liquidity signal.",
    riskNote: "On-chain transferability does not always mean the token can be freely redeemed by every holder.",
  },
  {
    slug: "underlying-asset",
    term: "Underlying Asset",
    category: "rwa-basics",
    shortDefinition: "The real-world asset or financial exposure behind a tokenized product.",
    fullDefinition:
      "The underlying asset is the asset, portfolio, collateral, receivable, commodity, or financial instrument that gives economic substance to a tokenized RWA product.",
    relatedTerms: ["collateral", "reserve", "asset-backed-token"],
    example: "Short-term U.S. Treasuries behind a tokenized treasury fund.",
    nexusContext: "Nexus RWA classifies assets based on what the token economically references, not only the marketing category.",
    riskNote: "The underlying asset should be verified through official documents, not assumed from a product name.",
  },
  {
    slug: "asset-backed-token",
    term: "Asset-backed Token",
    category: "asset-backing",
    shortDefinition: "A token designed to represent a claim, exposure, or backing from specific assets.",
    fullDefinition:
      "An asset-backed token is a token whose value proposition depends on identifiable assets, such as treasury securities, gold, credit receivables, or fund holdings.",
    relatedTerms: ["underlying-asset", "reserve", "collateral"],
    example: "A gold-backed token where each token references a specific amount of physical gold.",
    nexusContext: "Nexus RWA checks whether the asset claim is direct, indirect, legal, economic, or only narrative-based.",
    riskNote: "Backing claims need source evidence; a token description alone is not enough.",
  },
  {
    slug: "collateral",
    term: "Collateral",
    category: "asset-backing",
    shortDefinition: "Assets pledged or held to support an obligation, token, or credit exposure.",
    fullDefinition:
      "Collateral is an asset used to secure or support a financial obligation. In RWA, collateral may include securities, receivables, commodities, cash, or other off-chain assets.",
    relatedTerms: ["reserve", "collateralization-ratio", "underlying-asset"],
    example: "Receivables pledged to support a private credit pool.",
    nexusContext: "Nexus RWA separates collateral evidence from general marketing claims about asset quality.",
    riskNote: "Collateral quality, custody, enforceability, and valuation matter as much as the collateral amount.",
  },
  {
    slug: "treasury",
    term: "Treasury",
    category: "asset-backing",
    shortDefinition: "Government debt instruments, often short-duration U.S. Treasury bills in RWA products.",
    fullDefinition:
      "Treasury assets are government debt securities. In tokenized RWA products, the term often refers to portfolios of short-term U.S. Treasury bills or money market instruments.",
    relatedTerms: ["money-market-fund", "yield", "aum"],
    example: "A tokenized fund holding short-term U.S. Treasury securities.",
    nexusContext: "Nexus RWA treats tokenized treasury products as a major RWA category but still checks structure, liquidity, and investor restrictions.",
    riskNote: "Low-risk underlying assets do not remove product, legal, liquidity, or operational risk.",
  },
  {
    slug: "private-credit",
    term: "Private Credit",
    category: "asset-backing",
    shortDefinition: "Non-bank lending exposure to borrowers, companies, or credit portfolios.",
    fullDefinition:
      "Private credit refers to loans or credit exposures arranged outside public bond markets, often involving direct lending, receivables financing, or structured credit pools.",
    relatedTerms: ["receivables", "collateral", "yield"],
    example: "A tokenized pool that finances invoices or corporate loans.",
    nexusContext: "Nexus RWA scores private credit assets with extra attention to borrower quality, collateral, defaults, and transparency.",
    riskNote: "Higher yield usually comes with higher credit, liquidity, and disclosure risk.",
  },
  {
    slug: "money-market-fund",
    term: "Money Market Fund",
    category: "asset-backing",
    shortDefinition: "A fund investing in short-term, high-quality cash-like instruments.",
    fullDefinition:
      "A money market fund is an investment fund that typically holds short-duration, high-quality instruments such as Treasury bills, repo, or cash equivalents.",
    relatedTerms: ["treasury", "yield", "aum"],
    example: "A tokenized share class of a government money market fund.",
    nexusContext: "Nexus RWA tracks whether the token represents a fund share, wrapper, note, or another legal structure.",
    riskNote: "A money market fund can still have fees, redemption limits, and eligibility restrictions.",
  },
  {
    slug: "spv",
    term: "SPV",
    category: "legal-compliance",
    shortDefinition: "A Special Purpose Vehicle used to isolate assets, liabilities, or transactions.",
    fullDefinition:
      "An SPV is a legal entity created for a specific transaction or asset structure. In RWA, SPVs may hold assets, issue notes, or separate project risk from an operating company.",
    relatedTerms: ["fund-structure", "issuer", "legal-opinion"],
    example: "An SPV holds receivables backing a tokenized credit product.",
    nexusContext: "Nexus RWA reviews SPV usage to understand claim paths, bankruptcy remoteness, and investor rights.",
    riskNote: "The existence of an SPV does not automatically prove investor protection or asset ownership.",
  },
  {
    slug: "kyc",
    term: "KYC",
    category: "legal-compliance",
    shortDefinition: "Know Your Customer checks used to verify investor identity and eligibility.",
    fullDefinition:
      "KYC is a compliance process used to verify a customer or investor before they can access, hold, transfer, or redeem a regulated product.",
    relatedTerms: ["aml", "whitelist", "accredited-investor"],
    example: "A tokenized fund only allows approved KYC wallets to hold the token.",
    nexusContext: "Nexus RWA tracks KYC requirements because they directly affect access, transferability, and liquidity.",
    riskNote: "KYC can improve compliance while reducing open-market composability.",
  },
  {
    slug: "aml",
    term: "AML",
    category: "legal-compliance",
    shortDefinition: "Anti-Money Laundering controls used to reduce illicit finance risk.",
    fullDefinition:
      "AML refers to policies, procedures, and monitoring designed to detect and prevent money laundering, sanctions violations, and other illicit financial activity.",
    relatedTerms: ["kyc", "sanctions-screening", "whitelist"],
    example: "An issuer screens investors and wallets before allowing subscription or transfer.",
    nexusContext: "Nexus RWA records AML-related controls when they are publicly disclosed by the issuer or product documents.",
    riskNote: "AML disclosure should not be treated as proof that all legal or reserve risks are solved.",
  },
  {
    slug: "whitelist",
    term: "Whitelist",
    category: "legal-compliance",
    shortDefinition: "A list of approved wallets or investors allowed to hold or transfer a token.",
    fullDefinition:
      "A whitelist is an approval list used by issuers or smart contracts to restrict token access to eligible wallets, investors, or jurisdictions.",
    relatedTerms: ["kyc", "transfer-restriction", "accredited-investor"],
    example: "Only whitelisted wallets can receive a regulated tokenized fund share.",
    nexusContext: "Nexus RWA treats whitelists as both a compliance feature and a liquidity constraint.",
    riskNote: "A whitelisted token may have limited secondary-market access even when it is technically transferable.",
  },
  {
    slug: "prospectus",
    term: "Prospectus",
    category: "legal-compliance",
    shortDefinition: "A formal disclosure document describing an investment product and its risks.",
    fullDefinition:
      "A prospectus is a legal disclosure document that describes an investment product, issuer, fees, risks, structure, and investor terms.",
    relatedTerms: ["issuer", "fund-structure", "legal-opinion"],
    example: "A registered fund prospectus explaining investment objective, fees, and redemption terms.",
    nexusContext: "Nexus RWA prioritizes official legal and disclosure documents when reviewing institutional-grade assets.",
    riskNote: "A prospectus can be strong evidence, but the exact token relationship to the product must still be checked.",
  },
  {
    slug: "transfer-restriction",
    term: "Transfer Restriction",
    category: "legal-compliance",
    shortDefinition: "Rules that limit who can receive, hold, or transfer a token.",
    fullDefinition:
      "Transfer restrictions are legal, technical, or compliance rules that limit token transfers based on investor eligibility, jurisdiction, whitelist status, lock-ups, or issuer controls.",
    relatedTerms: ["whitelist", "kyc", "liquidity"],
    example: "A token cannot be transferred to a wallet that has not completed KYC.",
    nexusContext: "Nexus RWA tracks transfer restrictions because they affect both compliance and market liquidity.",
    riskNote: "A transferable token standard does not guarantee unrestricted transfer rights.",
  },
  {
    slug: "reserve",
    term: "Reserve",
    category: "reserve-proof",
    shortDefinition: "Assets held to support, redeem, or back a tokenized product.",
    fullDefinition:
      "A reserve is the pool of assets held by an issuer, custodian, fund, or structure to support the value, redemption, or backing claims of a tokenized product.",
    relatedTerms: ["proof-of-reserves", "custodian", "collateral"],
    example: "Gold bars held in custody to back a gold token.",
    nexusContext: "Nexus RWA records reserve details only when they can be supported by official or high-reliability sources.",
    riskNote: "Reserve claims should not be accepted without checking custody, reports, dates, and redemption mechanics.",
  },
  {
    slug: "custodian",
    term: "Custodian",
    category: "reserve-proof",
    shortDefinition: "The entity responsible for safeguarding assets or records.",
    fullDefinition:
      "A custodian safeguards assets, securities, cash, commodities, or records on behalf of a fund, issuer, trust, or investors.",
    relatedTerms: ["reserve", "audit", "attestation"],
    example: "A qualified custodian holding Treasury securities for a tokenized fund.",
    nexusContext: "Nexus RWA tracks custodians because custody quality affects asset protection and institutional credibility.",
    riskNote: "Naming a custodian is not the same as proving current reserve value or legal ownership.",
  },
  {
    slug: "proof-of-reserves",
    term: "Proof of Reserves",
    category: "reserve-proof",
    shortDefinition: "Evidence or mechanism showing that backing assets exist.",
    fullDefinition:
      "Proof of Reserves is a process, report, oracle, or verification mechanism intended to show that the assets backing a token or product are actually available.",
    relatedTerms: ["reserve", "attestation", "audit"],
    example: "A published reserve report confirming the amount of gold backing a token.",
    nexusContext: "Nexus RWA only marks proof-of-reserves as confirmed when a source explicitly supports it.",
    riskNote: "A smart contract audit is not proof-of-reserves because it reviews code, not off-chain assets.",
  },
  {
    slug: "attestation",
    term: "Attestation",
    category: "reserve-proof",
    shortDefinition: "A third-party statement about asset balances, controls, or conditions at a point in time.",
    fullDefinition:
      "An attestation is a third-party statement that confirms specific information, such as reserve balances or holdings, usually for a defined date or reporting period.",
    relatedTerms: ["audit", "proof-of-reserves", "reserve"],
    example: "A monthly attestation showing token supply and reserve asset value.",
    nexusContext: "Nexus RWA treats attestations as useful evidence but checks date, scope, auditor, and limitations.",
    riskNote: "An attestation is often narrower than a full audit and may not prove continuous backing.",
  },
  {
    slug: "audit",
    term: "Audit",
    category: "reserve-proof",
    shortDefinition: "An independent review of financial statements, controls, code, or reserves.",
    fullDefinition:
      "An audit is an independent review. In RWA, the term can refer to financial audits, reserve audits, smart contract audits, or control audits, each with different scope.",
    relatedTerms: ["attestation", "proof-of-reserves", "smart-contract-risk"],
    example: "A fund financial statement audit or a smart contract security audit.",
    nexusContext: "Nexus RWA distinguishes reserve or financial audits from smart contract audits.",
    riskNote: "Do not treat a smart contract audit as proof that off-chain reserves exist.",
  },
  {
    slug: "tvl",
    term: "TVL",
    category: "market-liquidity",
    shortDefinition: "Total Value Locked, usually measuring assets deposited or tracked in a protocol.",
    fullDefinition:
      "TVL measures the total value of assets locked, deposited, or tracked in a protocol or product. In RWA, TVL may differ from AUM, market cap, or reserve value.",
    relatedTerms: ["aum", "market-cap", "liquidity"],
    example: "A protocol dashboard reports $100 million TVL across tokenized credit pools.",
    nexusContext: "Nexus RWA uses TVL as a scale signal, but does not treat it as a complete measure of asset quality.",
    riskNote: "TVL methodology varies by source and can be double-counted or inconsistent across products.",
  },
  {
    slug: "aum",
    term: "AUM",
    category: "market-liquidity",
    shortDefinition: "Assets Under Management, the total assets managed by a fund or product.",
    fullDefinition:
      "AUM is the total value of assets managed by a fund, issuer, or product. In RWA, AUM is often used to understand the institutional scale behind a tokenized product.",
    relatedTerms: ["tvl", "market-cap", "money-market-fund"],
    example: "A tokenized fund reports $500 million in assets under management.",
    nexusContext: "Nexus RWA uses AUM to read product scale, but separates it from token liquidity and market cap.",
    riskNote: "AUM does not automatically mean every token holder has instant liquidity or direct redemption access.",
  },
  {
    slug: "market-cap",
    term: "Market Cap",
    category: "market-liquidity",
    shortDefinition: "Token price multiplied by circulating supply.",
    fullDefinition:
      "Market cap estimates the total market value of circulating tokens by multiplying token price by circulating supply. It may not match reserve value or AUM.",
    relatedTerms: ["circulating-supply", "price", "aum"],
    example: "A token priced at $1 with 100 million circulating tokens has a market cap of $100 million.",
    nexusContext: "Nexus RWA compares market cap with AUM, TVL, supply, and reserve evidence where available.",
    riskNote: "Market cap can be misleading when supply data, pricing, or liquidity is thin.",
  },
  {
    slug: "liquidity",
    term: "Liquidity",
    category: "market-liquidity",
    shortDefinition: "How easily an asset can be bought, sold, transferred, or redeemed without major friction.",
    fullDefinition:
      "Liquidity describes the ability to enter or exit an asset through secondary markets, issuer redemption, on-chain pools, or other settlement channels.",
    relatedTerms: ["redemption", "dex-pair", "bid-ask-spread"],
    example: "A token may have strong AUM but weak liquidity if redemptions are restricted and DEX pools are small.",
    nexusContext: "Nexus RWA scores liquidity using redemption period, lock-up, market depth, and on-chain availability.",
    riskNote: "High-quality backing does not guarantee easy exit.",
  },
  {
    slug: "redemption-period",
    term: "Redemption Period",
    category: "market-liquidity",
    shortDefinition: "The expected time needed to redeem a token or fund interest.",
    fullDefinition:
      "Redemption period is the time between a valid redemption request and expected settlement, often described as instant, T+1, T+3, weekly, monthly, or longer.",
    relatedTerms: ["redemption", "lock-up-period", "liquidity"],
    example: "A T+1 redemption period means settlement is expected one business day after the request.",
    nexusContext: "Nexus RWA uses redemption period as a major input for liquidity scoring.",
    riskNote: "Published redemption timelines may depend on eligibility, banking days, market conditions, or issuer discretion.",
  },
  {
    slug: "apy",
    term: "APY",
    category: "yield",
    shortDefinition: "Annual Percentage Yield, including compounding assumptions.",
    fullDefinition:
      "APY expresses annualized return including the effect of compounding. In RWA, APY may be derived from fund distributions, interest income, or protocol-level yield reporting.",
    relatedTerms: ["apr", "yield", "distribution"],
    example: "A product reports a 5% APY based on current short-term rates and distribution mechanics.",
    nexusContext: "Nexus RWA records yield type and source so users can compare yields more carefully.",
    riskNote: "APY can change and should not be treated as guaranteed return unless the source explicitly says so.",
  },
  {
    slug: "apr",
    term: "APR",
    category: "yield",
    shortDefinition: "Annual Percentage Rate, usually excluding compounding.",
    fullDefinition:
      "APR expresses annualized rate without compounding. It is useful for comparing simple interest rates, but it is not always the same as investor net yield.",
    relatedTerms: ["apy", "yield", "net-yield"],
    example: "A credit pool may advertise APR based on borrower interest rates.",
    nexusContext: "Nexus RWA separates APR, APY, current yield, and benchmark yield when evidence allows.",
    riskNote: "APR may not include fees, defaults, liquidity constraints, or changing market rates.",
  },
  {
    slug: "yield",
    term: "Yield",
    category: "yield",
    shortDefinition: "Income or return generated by an asset or product over time.",
    fullDefinition:
      "Yield is the income or return produced by an asset, fund, loan, or strategy. In RWA, it may come from Treasury interest, credit payments, coupons, or distributions.",
    relatedTerms: ["apy", "apr", "distribution"],
    example: "A tokenized treasury product passes through income from short-term Treasury holdings.",
    nexusContext: "Nexus RWA checks yield source, frequency, benchmark, and update date where available.",
    riskNote: "Higher yield should be read together with credit risk, legal structure, fees, and liquidity.",
  },
  {
    slug: "distribution",
    term: "Distribution",
    category: "yield",
    shortDefinition: "A payment, accrual, or allocation of income to holders or investors.",
    fullDefinition:
      "A distribution is how income is passed to investors, either through payments, token value accrual, rebasing, fund NAV changes, or other product mechanics.",
    relatedTerms: ["yield", "coupon", "net-yield"],
    example: "A fund distributes income monthly or reflects income in the token price.",
    nexusContext: "Nexus RWA records yield frequency and mechanism when the source is clear.",
    riskNote: "Distribution mechanics differ widely and can affect tax, liquidity, and comparability.",
  },
  {
    slug: "benchmark-yield",
    term: "Benchmark Yield",
    category: "yield",
    shortDefinition: "A reference yield used to compare product return.",
    fullDefinition:
      "Benchmark yield is a reference rate or market yield used to compare whether a product's return is attractive, fair, or consistent with its underlying asset class.",
    relatedTerms: ["yield", "treasury", "apy"],
    example: "Comparing a tokenized treasury yield to short-term U.S. Treasury bill yields.",
    nexusContext: "Nexus RWA can use benchmarks to contextualize whether yield is aligned with the asset category.",
    riskNote: "A yield above benchmark may signal extra risk, fees, leverage, or different assumptions.",
  },
  {
    slug: "risk-score",
    term: "Risk Score",
    category: "risk-grading",
    shortDefinition: "A Nexus RWA score summarizing asset risk evidence and warning signals.",
    fullDefinition:
      "Risk Score is a Nexus RWA grading component that summarizes observed risks across legal clarity, reserve evidence, liquidity, market adoption, smart contract exposure, and source quality.",
    relatedTerms: ["legal-score", "reserve-score", "liquidity-score"],
    example: "An asset may have strong market adoption but lower risk score due to missing reserve evidence.",
    nexusContext: "Nexus RWA uses risk scoring to make asset comparison more structured and evidence-based.",
    riskNote: "A score is an analytical signal, not investment advice or a guarantee of safety.",
  },
  {
    slug: "institutional-grade",
    term: "Institutional Grade",
    category: "risk-grading",
    shortDefinition: "A high Nexus RWA grade for assets with strong evidence, structure, and data completeness.",
    fullDefinition:
      "Institutional Grade is a Nexus RWA classification for assets that meet a high threshold of source quality, legal clarity, reserve or structure evidence, liquidity context, and data completeness.",
    relatedTerms: ["analytic-grade", "research-grade", "source-score"],
    example: "A regulated tokenized fund with official documentation, strong source trail, and clear structure may qualify.",
    nexusContext: "This label helps users quickly identify assets with stronger institutional evidence profiles.",
    riskNote: "Institutional Grade does not mean risk-free; it means the available evidence meets a stronger review standard.",
  },
  {
    slug: "analytic-grade",
    term: "Analytic Grade",
    category: "risk-grading",
    shortDefinition: "A Nexus RWA grade for assets with usable evidence but remaining gaps or warnings.",
    fullDefinition:
      "Analytic Grade is used for assets that are sufficiently structured for analysis but do not yet meet the highest institutional-grade evidence threshold.",
    relatedTerms: ["institutional-grade", "research-grade", "warning"],
    example: "An asset with good market data and documentation but incomplete legal or reserve evidence.",
    nexusContext: "Nexus RWA uses this grade to keep promising assets visible while making gaps transparent.",
    riskNote: "Analytic Grade should invite deeper review before relying on the asset for institutional decisions.",
  },
  {
    slug: "research-grade",
    term: "Research Grade",
    category: "risk-grading",
    shortDefinition: "A Nexus RWA grade for assets that require more evidence before stronger classification.",
    fullDefinition:
      "Research Grade indicates that an asset is tracked for research but has insufficient evidence, incomplete data, or unresolved questions for higher grading.",
    relatedTerms: ["analytic-grade", "blocker", "warning"],
    example: "A new RWA protocol token with limited disclosures and incomplete asset-level documentation.",
    nexusContext: "Nexus RWA keeps Research Grade assets separate from stronger institutional datasets.",
    riskNote: "Research Grade assets should be treated as early or incomplete from a data-confidence perspective.",
  },
  {
    slug: "blocker",
    term: "Blocker",
    category: "risk-grading",
    shortDefinition: "A serious issue that prevents stronger grading or production confidence.",
    fullDefinition:
      "A blocker is a material missing item, contradiction, or unresolved issue that prevents an asset from reaching a stronger Nexus RWA grade.",
    relatedTerms: ["warning", "source-score", "risk-score"],
    example: "No verifiable contract address for a token that claims to be live on-chain.",
    nexusContext: "Nexus RWA uses blockers to make critical evidence gaps visible instead of hiding them inside a single score.",
    riskNote: "A blocker should be resolved with source-backed evidence, not assumptions.",
  },
  {
    slug: "warning",
    term: "Warning",
    category: "risk-grading",
    shortDefinition: "A notable issue or caveat that users should consider when reviewing an asset.",
    fullDefinition:
      "A warning is a visible caveat that flags incomplete evidence, stale data, unusual structure, liquidity constraints, or other review concerns.",
    relatedTerms: ["blocker", "risk-score", "source-score"],
    example: "No confirmed proof-of-reserves, despite otherwise strong documentation.",
    nexusContext: "Nexus RWA uses warnings to preserve nuance when an asset is useful but not perfect.",
    riskNote: "Warnings should not be ignored just because an asset has a high overall score.",
  },
];
