# Credix Credit Pool — Source Discovery

Baseline date: 2026-06-12  
Slug: `credix-credit-pool`  
Classification: `tokenized_credit` / `pool_token` / `pool_or_tranche_exposure` / `credit_pool`

## Primary sources reviewed

1. Official website  
   - https://credix.finance/  
   - Current public positioning: B2B credit / CrediPay.

2. Official CrediPay docs  
   - https://docs.credipay.credix.finance/  
   - Key pages:
     - https://docs.credipay.credix.finance/docs/getting-started-introduction
     - https://docs.credipay.credix.finance/docs/getting-started-glossary.md
     - https://docs.credipay.credix.finance/docs/m%C3%B3dulos-de-integra%C3%A7%C3%A3o
     - https://docs.credipay.credix.finance/docs/getting-started-integration-options

3. DeFiLlama protocol page  
   - https://defillama.com/protocol/credix  
   - Useful for: RWA Lending category, Solana chain reference, active loans, tracked yield, historical protocol metadata.
   - Limitation: TVL appears economically weak for this profile; active loans are more relevant than plain TVL.

4. Official GitHub organization  
   - https://github.com/credix-finance  
   - Useful for: official social/profile links and historical Solana/application repositories.
   - Limitation: public repositories do not replace verified current contract/program addresses.

## Key findings

- Credix should be classified as a **credit pool / private credit / receivables** exposure, not as a treasury-style reserve-backed token.
- Current official docs focus on **CrediPay**, a B2B BNPL / credit product for Brazilian businesses.
- CrediPay docs describe sellers, buyers, orders, invoices, repayments, credit limits, and upfront seller settlement.
- DeFiLlama continues to track Credix under RWA Lending and shows Solana plus active-loan data.
- No verified public investor token contract, Solana program address, legal opinion, pool report, borrower book, custody arrangement, redemption schedule, or proof-of-reserves source was identified in this pass.

## Production caution

This should be published as a **research-grade credit-pool baseline** only until the following are verified:

- current pool legal vehicle
- investor claim and tranche structure
- borrower/originator disclosure
- loan book / receivables composition
- maturity and default/loss history
- redemption or withdrawal terms
- current Solana program / pool address
- smart contract audit report
- compliance and eligible investor terms
