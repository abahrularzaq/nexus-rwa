# Nexus RWA x402 QA Checklist

Date: 2026-06-07  
Scope: manual QA checklist for the stable x402 Pro/Enterprise access flow.

## Purpose

Use this checklist before and after every deploy that touches:

- x402 checkout,
- Pro/Enterprise paywall,
- wallet session handling,
- gated asset endpoints,
- asset detail pages,
- pricing CTA,
- API docs,
- frontend wallet/session state.

The goal is to make sure the current stable state does not regress.

## Test wallets

Use at least two wallets:

```text
Wallet A: paid wallet / active Pro session
Wallet B: unpaid wallet / Free tier
```

Example paid wallet used during stabilization:

```text
0x55353bD0E4d6784d0FA7df340769D2E0375cdf7F
```

## Environment checks

- [ ] Vercel frontend deploy completed.
- [ ] Railway/API deploy completed.
- [ ] Frontend `NEXT_PUBLIC_API_URL` points to the correct API.
- [ ] API `FRONTEND_URL` allows current frontend origin.
- [ ] API `/health` returns `status: ok`.
- [ ] Database connection is healthy.
- [ ] Redis is not required for session access.
- [ ] x402 facilitator env vars are present.
- [ ] USDC/token config is correct for the selected network.

## Public flow QA

### Landing page

- [ ] `/` loads without error.
- [ ] Pricing section is visible.
- [ ] Free CTA opens `/dashboard/assets`.
- [ ] Pro CTA opens `/dashboard/assets/franklin-benji`.
- [ ] Enterprise CTA opens `/dashboard/api-docs`.
- [ ] Landing page does not require wallet connection.

### Dashboard shell

- [ ] `/dashboard` loads.
- [ ] Sidebar is visible on desktop.
- [ ] Sidebar works on mobile.
- [ ] `Monitoring` link is present if admin/internal page should remain accessible.
- [ ] `API Docs` link works.
- [ ] Wallet button appears in the top bar.

## Free wallet QA

Use Wallet B or disconnect wallet.

- [ ] Asset catalog loads.
- [ ] Public asset detail loads.
- [ ] Public Overview tab loads.
- [ ] Free market summary loads.
- [ ] Free current yield displays if available.
- [ ] Pro-only sections show paywall/locked state.
- [ ] `/v1/assets/:slug/full` returns 402 without active session.
- [ ] `/v1/assets/:slug/risk` returns 402 without active session.
- [ ] `/v1/assets/:slug/history` returns 402 without active session.
- [ ] `/v1/assets/:slug/insight` returns 402 without active session.

## Checkout QA

Use a wallet without active session.

- [ ] Connect wallet.
- [ ] Open `/dashboard/assets/franklin-benji`.
- [ ] Try to open or unlock a gated layer.
- [ ] Paywall modal appears.
- [ ] Paywall displays correct tier and price.
- [ ] x402 payment/signature prompt appears.
- [ ] Payment submission succeeds.
- [ ] Facilitator verification succeeds.
- [ ] API creates or refreshes session in Postgres.
- [ ] Frontend retries gated request after successful payment.
- [ ] Gated layer opens without manual page refresh.

## Active Pro session QA

Use Wallet A with active Pro session.

### Session endpoint

Run:

```bash
curl "https://api.nexusrwa.xyz/v1/session?wallet=0x55353bD0E4d6784d0FA7df340769D2E0375cdf7F" \
  -H "X-Wallet-Address: 0x55353bD0E4d6784d0FA7df340769D2E0375cdf7F"
```

Expected:

```text
tier: pro
active: true
expiresAt: future timestamp
```

Checklist:

- [ ] `/v1/session` returns `success: true`.
- [ ] `tier` is `pro` or higher.
- [ ] `active` is `true`.
- [ ] `expiresAt` is in the future.
- [ ] `expiresInSeconds` is positive if returned.

### Frontend session display

- [ ] Top bar shows `PRO ACTIVE`.
- [ ] Expiry label is visible on desktop.
- [ ] Mobile shows compact `PRO` badge.
- [ ] Dropdown shows wallet address.
- [ ] Dropdown shows `PRO ACTIVE`.
- [ ] Dropdown shows `Expires in ...`.
- [ ] Refresh session action works.

## Gated endpoint QA

Use active Pro wallet.

Replace slug if needed; default flagship slug:

```text
franklin-benji
```

### Full asset

```bash
curl https://api.nexusrwa.xyz/v1/assets/franklin-benji/full \
  -H "X-Wallet-Address: 0x55353bD0E4d6784d0FA7df340769D2E0375cdf7F"
```

- [ ] Returns HTTP 200.
- [ ] Returns `success: true`.
- [ ] Includes reserve/institutional/compliance/liquidity/sources when available.

### Risk

```bash
curl https://api.nexusrwa.xyz/v1/assets/franklin-benji/risk \
  -H "X-Wallet-Address: 0x55353bD0E4d6784d0FA7df340769D2E0375cdf7F"
```

- [ ] Returns HTTP 200.
- [ ] Response shape is `{ risk, grade }`.
- [ ] Frontend Risk & Grade tab renders without error.

### History

```bash
curl "https://api.nexusrwa.xyz/v1/assets/franklin-benji/history?period=30d" \
  -H "X-Wallet-Address: 0x55353bD0E4d6784d0FA7df340769D2E0375cdf7F"
```

- [ ] Returns HTTP 200.
- [ ] Response `data` is an array.
- [ ] Frontend Market & Yield tab renders without error.
- [ ] If no history exists, chart shows a safe empty state.

### Insight

```bash
curl https://api.nexusrwa.xyz/v1/assets/franklin-benji/insight \
  -H "X-Wallet-Address: 0x55353bD0E4d6784d0FA7df340769D2E0375cdf7F"
```

- [ ] Returns HTTP 200.
- [ ] Uses live AI output if provider works.
- [ ] Uses local fallback if provider fails.
- [ ] Does not return 500.

### Sources

```bash
curl https://api.nexusrwa.xyz/v1/assets/franklin-benji/sources \
  -H "X-Wallet-Address: 0x55353bD0E4d6784d0FA7df340769D2E0375cdf7F"
```

- [ ] Returns HTTP 200 if endpoint is enabled.
- [ ] Returns field-level source records.
- [ ] Sources tab remains usable even if source endpoint is not directly called.

## Asset detail QA

Open:

```text
/dashboard/assets/franklin-benji
```

Check tabs:

- [ ] Overview renders.
- [ ] Issuer & Legal renders.
- [ ] Reserve renders.
- [ ] Market & Yield renders.
- [ ] Liquidity renders.
- [ ] Blockchain renders.
- [ ] Risk & Grade renders.
- [ ] Sources renders.
- [ ] Events renders or shows planned/empty state.

## Refresh and persistence QA

- [ ] Refresh browser while Pro active.
- [ ] Pro badge remains active.
- [ ] Gated layers remain unlocked.
- [ ] Navigate to another asset.
- [ ] Gated layers remain accessible for same wallet.
- [ ] Disconnect wallet.
- [ ] Wallet-specific active access no longer appears in UI.
- [ ] Reconnect paid wallet.
- [ ] Pro session is restored.

## Negative QA

- [ ] Use unpaid wallet and call gated endpoint with `X-Wallet-Address`.
- [ ] API returns 402.
- [ ] UI shows paywall, not crash.
- [ ] Use malformed wallet address.
- [ ] API returns a safe error or locked response.
- [ ] Use expired session.
- [ ] API returns 402.
- [ ] UI does not show `PRO ACTIVE`.

## API Docs QA

Open:

```text
/dashboard/api-docs
```

- [ ] `/v1/session` is documented.
- [ ] Pro endpoint curl examples include `X-Wallet-Address`.
- [ ] Enterprise endpoint curl examples include `X-Wallet-Address`.
- [ ] `/history` response example shows `data` as an array.
- [ ] x402 wallet session explanation is clear.

## Pricing CTA QA

Open landing page pricing section.

- [ ] `Start Free` goes to `/dashboard/assets`.
- [ ] `Unlock Pro` goes to `/dashboard/assets/franklin-benji`.
- [ ] `Start API Access` goes to `/dashboard/api-docs`.

## Known limitations to watch

- `franklin-benji` is the strongest flagship asset, but still has warnings around legal opinion and proof-of-reserves.
- `blackrock-buidl` is useful for brand demo but remains analytics-grade in the current dataset.
- `tether-gold-xaut` should not be used as a public flagship until blockers are resolved.
- `/history` currently returns `data` as an array; frontend supports this shape.
- AI insight should never block the UI because local fallback exists.

## Pass criteria

The release is considered stable if:

- [ ] Landing page loads.
- [ ] Pricing CTAs work.
- [ ] Active Pro wallet shows `PRO ACTIVE`.
- [ ] `/session` confirms active Pro.
- [ ] `/full`, `/risk`, `/history`, and `/insight` return 200 with active wallet.
- [ ] All asset detail tabs render.
- [ ] Free wallet receives safe paywall/402 behavior.
- [ ] Refresh does not lose active session.
