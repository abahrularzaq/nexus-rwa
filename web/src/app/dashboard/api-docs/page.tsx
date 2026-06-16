"use client";

import { useCallback, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Code2, Sparkles } from "lucide-react";

const API_BASE_STORAGE_KEY = "nexus_api_base_url";
const WALLET_STORAGE_KEY = "nexus_wallet_address";
const API_KEY_STORAGE_KEY = "nexus_api_key";
const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:3001";
const DEFAULT_DASHBOARD_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "https://app.nexusrwa.xyz";
const DEFAULT_WALLET = "<WALLET_ADDRESS>";
const DEFAULT_API_KEY = "<API_KEY>";

function readLocalStorageValue(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key)?.trim() || fallback;
}

type Access = "free" | "pro" | "enterprise";

type ParamRow = {
  name: string;
  in: string;
  type: string;
  required: string;
  example: string;
};

type EndpointDoc = {
  id: string;
  method: "GET" | "POST";
  path: string;
  access: Access;
  description: string;
  curl: string;
  response: string;
  params?: ParamRow[];
  x402?: string;
};

const accessMeta: Record<Access, { badge: string; className: string }> = {
  free: {
    badge: "FREE",
    className:
      "shrink-0 rounded-full bg-[rgba(0,255,136,0.12)] px-2.5 py-0.5 text-xs font-bold text-[#00FF88] ring-1 ring-[rgba(0,255,136,0.35)]",
  },
  pro: {
    badge: "PRO · $3 / 24h",
    className:
      "shrink-0 rounded-full bg-[rgba(0,212,255,0.1)] px-2.5 py-0.5 text-xs font-bold text-[#00D4FF] ring-1 ring-[rgba(0,212,255,0.3)]",
  },
  enterprise: {
    badge: "ENTERPRISE · $29 / 7d",
    className:
      "shrink-0 rounded-full bg-[rgba(255,184,0,0.12)] px-2.5 py-0.5 text-xs font-bold text-[#FFB800] ring-1 ring-[rgba(255,184,0,0.35)]",
  },
};

const idParam: ParamRow = {
  name: "id",
  in: "path",
  type: "string",
  required: "required",
  example: "blackrock-buidl",
};

function buildEndpoints(
  base: string,
  wallet: string,
  apiKey: string,
): EndpointDoc[] {
  const walletHeader = `-H "X-Wallet-Address: ${wallet}"`;
  const apiKeyHeader = `-H "X-API-Key: ${apiKey}"`;
  const jsonHeader = `-H "Content-Type: application/json"`;

  return [
    {
      id: "api-keys",
      method: "POST",
      path: "/api/api-keys",
      access: "pro",
      description:
        "Create a dashboard API key. The raw key is returned only once; the backend stores only a SHA-256 hash and visible prefix.",
      curl: `curl -X POST ${DEFAULT_DASHBOARD_BASE_URL}/api/api-keys \\
  ${jsonHeader} \\
  -d '{"name":"Production integration","tier":"pro"}'`,
      params: [
        {
          name: "name",
          in: "body",
          type: "string",
          required: "optional",
          example: "Production integration",
        },
        {
          name: "tier",
          in: "body",
          type: "free | pro | enterprise",
          required: "optional",
          example: "pro",
        },
      ],
      x402: "Use the API Keys dashboard to generate, list, and revoke keys. Store the returned apiKey immediately because it is never shown again.",
      response: `{
  "success": true,
  "data": {
    "id": "key-id",
    "name": "Production integration",
    "prefix": "nxrwa_abcd12",
    "tier": "pro",
    "createdAt": "2026-06-16T00:00:00.000Z",
    "expiresAt": "2026-07-16T00:00:00.000Z",
    "revokedAt": null,
    "active": true,
    "apiKey": "nxrwa_full_secret_value",
    "warning": "Store this key now. Nexus RWA only shows the full API key once."
  }
}`,
    },
    {
      id: "api-keys-list",
      method: "GET",
      path: "/api/api-keys",
      access: "pro",
      description:
        "List dashboard API keys without exposing raw secret values. Responses include prefix, tier, active status, and expiry.",
      curl: `curl ${DEFAULT_DASHBOARD_BASE_URL}/api/api-keys`,
      x402: "Use the API Keys dashboard or this route to audit key status and expiry.",
      response: `{
  "success": true,
  "data": [
    {
      "id": "key-id",
      "name": "Production integration",
      "prefix": "nxrwa_abcd12",
      "tier": "pro",
      "createdAt": "2026-06-16T00:00:00.000Z",
      "expiresAt": "2026-07-16T00:00:00.000Z",
      "revokedAt": null,
      "active": true
    }
  ]
}`,
    },
    {
      id: "api-keys-revoke",
      method: "POST",
      path: "/api/api-keys/:id/revoke",
      access: "pro",
      description:
        "Revoke a dashboard API key immediately. Revoked keys remain listed for audit history but are no longer active.",
      curl: `curl -X POST ${DEFAULT_DASHBOARD_BASE_URL}/api/api-keys/key-id/revoke`,
      params: [
        {
          name: "id",
          in: "path",
          type: "string",
          required: "required",
          example: "key-id",
        },
      ],
      x402: "Use when a secret is rotated, exposed, or no longer needed.",
      response: `{
  "success": true,
  "data": {
    "id": "key-id",
    "name": "Production integration",
    "prefix": "nxrwa_abcd12",
    "tier": "pro",
    "createdAt": "2026-06-16T00:00:00.000Z",
    "expiresAt": "2026-07-16T00:00:00.000Z",
    "revokedAt": "2026-06-16T00:00:00.000Z",
    "active": false
  }
}`,
    },
    {
      id: "market-overview",
      method: "GET",
      path: "/v1/market/overview",
      access: "free",
      description:
        "Public market-wide RWA statistics and aggregate dashboard metrics.",
      curl: `curl ${base}/market/overview`,
      x402: "No payment required.",
      response: `{
  "success": true,
  "data": {
    "totalTvl": 2847300000,
    "totalAssets": 13,
    "avgYieldRate": 6.73,
    "updatedAt": "2026-06-04T00:00:00.000Z"
  }
}`,
    },
    {
      id: "market-brief",
      method: "GET",
      path: "/v1/market/brief",
      access: "free",
      description:
        "Public AI-generated market brief with headline, summary, changes, and watch list.",
      curl: `curl ${base}/market/brief`,
      x402: "No payment required.",
      response: `{
  "success": true,
  "data": {
    "headline": "RWA yields compress as treasury tokens lead inflows",
    "summary": "Aggregate TVL rose while average yield ticked down.",
    "whatChanged": ["Credit basket yield -18 bps 7d"],
    "watchList": ["Fed path and short-duration RWAs"],
    "riskTone": "stable"
  }
}`,
    },
    {
      id: "assets-list",
      method: "GET",
      path: "/v1/assets",
      access: "free",
      description: "Public paginated catalog of tokenized real-world assets.",
      curl: `curl "${base}/assets?page=1&limit=20"`,
      params: [
        {
          name: "page",
          in: "query",
          type: "number",
          required: "optional",
          example: "1",
        },
        {
          name: "limit",
          in: "query",
          type: "number",
          required: "optional",
          example: "20",
        },
        {
          name: "category",
          in: "query",
          type: "string",
          required: "optional",
          example: "TREASURY",
        },
        {
          name: "search",
          in: "query",
          type: "string",
          required: "optional",
          example: "buidl",
        },
      ],
      x402: "No payment required for public discovery.",
      response: `{
  "success": true,
  "data": {
    "data": [
      {
        "slug": "blackrock-buidl",
        "identity": { "name": "BlackRock BUIDL", "symbol": "BUIDL" },
        "market": { "tvl": 0, "holderCount": 0 }
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 13 }
  }
}`,
    },
    {
      id: "asset-detail",
      method: "GET",
      path: "/v1/assets/:id",
      access: "free",
      description:
        "Public asset profile with identity, market summary, current yield, public risk level, grade label, and events.",
      curl: `curl ${base}/assets/blackrock-buidl`,
      params: [idParam],
      x402: "No payment required for the public asset detail layer.",
      response: `{
  "success": true,
  "data": {
    "slug": "blackrock-buidl",
    "identity": { "name": "BlackRock BUIDL", "symbol": "BUIDL" },
    "market": { "tvl": 0 },
    "grade": { "grade": "institutional", "score": 90 }
  }
}`,
    },
    {
      id: "asset-events",
      method: "GET",
      path: "/v1/assets/:id/events",
      access: "free",
      description:
        "Public asset event timeline such as launches, audits, incidents, and major updates.",
      curl: `curl ${base}/assets/blackrock-buidl/events`,
      params: [idParam],
      x402: "No payment required.",
      response: `{
  "success": true,
  "data": []
}`,
    },
    {
      id: "search",
      method: "GET",
      path: "/v1/search",
      access: "free",
      description: "Public full-text and faceted search across catalog fields.",
      curl: `curl "${base}/search?q=buidl&limit=10"`,
      params: [
        {
          name: "q",
          in: "query",
          type: "string",
          required: "required",
          example: "buidl",
        },
        {
          name: "limit",
          in: "query",
          type: "number",
          required: "optional",
          example: "10",
        },
      ],
      x402: "No payment required.",
      response: `{
  "success": true,
  "data": {
    "hits": [
      { "slug": "blackrock-buidl", "name": "BlackRock BUIDL", "symbol": "BUIDL" }
    ]
  }
}`,
    },
    {
      id: "session",
      method: "GET",
      path: "/v1/session",
      access: "free",
      description:
        "Check whether a wallet has an active x402 Pro or Enterprise session.",
      curl: `curl "${base}/session?wallet=${wallet}" \\
  ${walletHeader}`,
      params: [
        {
          name: "wallet",
          in: "query",
          type: "string",
          required: "optional",
          example: wallet,
        },
      ],
      x402: "No payment required. Use this to verify a wallet session before calling gated endpoints.",
      response: `{
  "success": true,
  "data": {
    "wallet": "${wallet}",
    "tier": "pro",
    "active": true,
    "expiresAt": "2026-06-08T14:55:32.517Z",
    "expiresInSeconds": 86400
  }
}`,
    },
    {
      id: "asset-full",
      method: "GET",
      path: "/v1/assets/:id/full",
      access: "pro",
      description:
        "Full Pro asset profile with reserve, compliance, liquidity, risk, sources, history, and AI narrative.",
      curl: `curl ${base}/assets/blackrock-buidl/full \\
  ${walletHeader} \\
  ${apiKeyHeader}`,
      params: [idParam],
      x402: "Requires Pro 24h pass. If wallet has active Pro session, send X-Wallet-Address. If not unlocked, API returns HTTP 402 with x402 payment metadata.",
      response: `{
  "success": true,
  "data": {
    "slug": "blackrock-buidl",
    "reserve": { "backingType": "US Treasury", "custodian": "BNY Mellon" },
    "compliance": { "kycRequired": true },
    "liquidity": { "redemptionType": "issuer" },
    "sources": []
  }
}`,
    },
    {
      id: "asset-history",
      method: "GET",
      path: "/v1/assets/:id/history",
      access: "pro",
      description:
        "Pro time-series yield, TVL, holder, and risk history for one asset. Current backend returns the history array directly in data.",
      curl: `curl "${base}/assets/blackrock-buidl/history?period=30d" \\
  ${walletHeader} \\
  ${apiKeyHeader}`,
      params: [
        idParam,
        {
          name: "period",
          in: "query",
          type: "string",
          required: "optional",
          example: "7d | 30d | 90d",
        },
      ],
      x402: "Requires Pro 24h pass. Send X-Wallet-Address for an active wallet session.",
      response: `{
  "success": true,
  "data": [
    {
      "timestamp": "2026-06-04T00:00:00.000Z",
      "yield": 4.87,
      "tvl": 2847300000,
      "holderCount": 1284,
      "source": "scheduler"
    }
  ]
}`,
    },
    {
      id: "asset-risk",
      method: "GET",
      path: "/v1/assets/:id/risk",
      access: "pro",
      description:
        "Pro risk scoring, factor breakdown, mitigants, and grade context.",
      curl: `curl ${base}/assets/blackrock-buidl/risk \\
  ${walletHeader} \\
  ${apiKeyHeader}`,
      params: [idParam],
      x402: "Requires Pro 24h pass. Send X-Wallet-Address for an active wallet session.",
      response: `{
  "success": true,
  "data": {
    "risk": { "overallScore": 90, "overallLevel": "LOW", "riskFactors": [] },
    "grade": { "grade": "institutional", "score": 90 }
  }
}`,
    },
    {
      id: "asset-sources",
      method: "GET",
      path: "/v1/assets/:id/sources",
      access: "pro",
      description: "Pro field-level source trail and reliability metadata.",
      curl: `curl ${base}/assets/blackrock-buidl/sources \\
  ${walletHeader} \\
  ${apiKeyHeader}`,
      params: [idParam],
      x402: "Requires Pro 24h pass. Send X-Wallet-Address for an active wallet session.",
      response: `{
  "success": true,
  "data": [
    { "field": "reserve.custodian", "url": "https://...", "tier": "Tier 1" }
  ]
}`,
    },
    {
      id: "asset-insight",
      method: "GET",
      path: "/v1/assets/:id/insight",
      access: "pro",
      description:
        "Pro AI-generated RWA insight with outlook, opportunities, risks, and watch list. If provider AI is unavailable, local fallback can return a valid 200 response.",
      curl: `curl ${base}/assets/blackrock-buidl/insight \\
  ${walletHeader} \\
  ${apiKeyHeader}`,
      params: [idParam],
      x402: "Requires Pro 24h pass. Send X-Wallet-Address for an active wallet session.",
      response: `{
  "success": true,
  "data": {
    "assetId": "blackrock-buidl",
    "summary": "Asset insight summary...",
    "outlook": "neutral",
    "confidence": "medium",
    "opportunities": [],
    "risks": [],
    "watchList": []
  }
}`,
    },

    {
      id: "agent-manifest",
      method: "GET",
      path: "/v1/agent/manifest",
      access: "free",
      description:
        "Public manifest that helps AI agents discover Nexus RWA dataset, analytics, and Ask Nexus workflows.",
      curl: `curl ${base}/agent/manifest`,
      response: `{
  "success": true,
  "data": {
    "name": "Nexus RWA Agent Manifest",
    "endpoints": [
      { "method": "GET", "path": "/v1/export", "access": "enterprise" },
      { "method": "GET", "path": "/v1/analytics/bulk", "access": "enterprise" },
      { "method": "POST", "path": "/v1/ask", "access": "enterprise" }
    ],
    "workflow": [
      "Fetch the dataset",
      "Compare risk, yield, and source quality",
      "Ask a natural-language question"
    ]
  }
}`,
    },
    {
      id: "analytics-bulk",
      method: "GET",
      path: "/v1/analytics/bulk",
      access: "enterprise",
      description: "Enterprise bulk analytics snapshot across all assets.",
      curl: `curl ${base}/analytics/bulk \\
  ${walletHeader} \\
  ${apiKeyHeader}`,
      x402: "Requires Enterprise 7d pass. Send X-Wallet-Address for an active Enterprise wallet session.",
      response: `{
  "success": true,
  "data": {
    "assets": [],
    "generatedAt": "2026-06-04T00:00:00.000Z"
  }
}`,
    },
    {
      id: "export",
      method: "GET",
      path: "/v1/export",
      access: "enterprise",
      description:
        "Enterprise full dataset export for machine-readable workflows.",
      curl: `curl ${base}/export \\
  ${walletHeader} \\
  ${apiKeyHeader}`,
      x402: "Requires Enterprise 7d pass. Send X-Wallet-Address for an active Enterprise wallet session.",
      response: `{
  "success": true,
  "data": {
    "downloadUrl": "https://...",
    "expiresAt": "2026-06-05T00:00:00.000Z"
  }
}`,
    },
    {
      id: "ask",
      method: "POST",
      path: "/v1/ask",
      access: "enterprise",
      description:
        "Enterprise natural-language Q&A over the Nexus RWA dataset.",
      curl: `curl -X POST ${base}/ask \\
  ${jsonHeader} \\
  ${walletHeader} \\
  ${apiKeyHeader} \\
  -d '{"question":"Compare BUIDL and BENJI reserve transparency"}'`,
      params: [
        {
          name: "question",
          in: "body",
          type: "string",
          required: "required",
          example: "Compare BUIDL and BENJI reserve transparency",
        },
      ],
      x402: "Requires Enterprise 7d pass. Send X-Wallet-Address for an active Enterprise wallet session.",
      response: `{
  "success": true,
  "data": {
    "answer": "...",
    "sources": []
  }
}`,
    },
  ];
}

function EndpointCard({
  ep,
  expanded,
  onToggle,
}: {
  ep: EndpointDoc;
  expanded: boolean;
  onToggle: () => void;
}) {
  const meta = accessMeta[ep.access];

  return (
    <article
      id={`ep-${ep.id}`}
      className="scroll-mt-28 overflow-hidden rounded-xl border border-[rgba(30,42,58,0.85)] bg-[rgba(15,22,41,0.55)]"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 border-b border-[rgba(30,42,58,0.75)] px-4 py-3 text-left transition-colors hover:bg-[rgba(255,255,255,0.03)]"
      >
        <div className="flex min-w-0 items-center gap-2">
          {expanded ? (
            <ChevronDown className="size-5 shrink-0 text-[#00D4FF]" />
          ) : (
            <ChevronRight className="size-5 shrink-0 text-[#8892A4]" />
          )}
          <span className="truncate font-mono text-sm font-semibold text-white md:text-base">
            {ep.method} {ep.path}
          </span>
        </div>
        <span className={meta.className}>{meta.badge}</span>
      </button>

      {expanded ? (
        <div className="space-y-4 px-4 py-4">
          <p className="text-sm text-[#8892A4]">{ep.description}</p>

          {ep.params?.length ? (
            <div className="overflow-x-auto rounded-lg border border-[rgba(30,42,58,0.8)]">
              <table className="w-full min-w-[520px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[rgba(30,42,58,0.8)] bg-[rgba(10,14,26,0.5)] text-[#8892A4]">
                    <th className="px-3 py-2 font-semibold">Name</th>
                    <th className="px-3 py-2 font-semibold">In</th>
                    <th className="px-3 py-2 font-semibold">Type</th>
                    <th className="px-3 py-2 font-semibold">Required</th>
                    <th className="px-3 py-2 font-semibold">Example</th>
                  </tr>
                </thead>
                <tbody>
                  {ep.params.map((row) => (
                    <tr
                      key={`${ep.id}-${row.name}`}
                      className="border-b border-[rgba(30,42,58,0.5)] last:border-0"
                    >
                      <td className="px-3 py-2 font-mono text-[#00D4FF]">
                        {row.name}
                      </td>
                      <td className="px-3 py-2 text-[#8892A4]">{row.in}</td>
                      <td className="px-3 py-2 text-white">{row.type}</td>
                      <td className="px-3 py-2 text-[#8892A4]">
                        {row.required}
                      </td>
                      <td className="px-3 py-2 font-mono text-[#8892A4]">
                        {row.example}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {ep.x402 ? (
            <div
              className="rounded-lg border border-[rgba(0,212,255,0.25)] px-3 py-2.5 text-sm text-[#8892A4]"
              style={{ background: "rgba(0,212,255,0.06)" }}
            >
              {ep.x402}
            </div>
          ) : null}

          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#4A5568]">
              Request
            </p>
            <pre className="overflow-x-auto rounded-lg border border-[rgba(30,42,58,0.8)] bg-[#0A0E1A] p-3">
              <code className="font-mono text-[11px] leading-relaxed text-[#00FF88]">
                {ep.curl}
              </code>
            </pre>
          </div>

          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#4A5568]">
              Response
            </p>
            <pre className="max-h-[360px] overflow-auto rounded-lg border border-[rgba(30,42,58,0.8)] bg-[#0A0E1A] p-4">
              <code className="block whitespace-pre font-mono text-[11px] leading-relaxed text-[#C5CDD8]">
                {ep.response}
              </code>
            </pre>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default function ApiDocsPage() {
  const [apiBaseUrl, setApiBaseUrl] = useState(() =>
    readLocalStorageValue(API_BASE_STORAGE_KEY, DEFAULT_API_BASE_URL).replace(
      /\/$/,
      "",
    ),
  );
  const [wallet] = useState(() =>
    readLocalStorageValue(WALLET_STORAGE_KEY, DEFAULT_WALLET),
  );
  const [apiKey] = useState(() =>
    readLocalStorageValue(API_KEY_STORAGE_KEY, DEFAULT_API_KEY),
  );

  const baseV1 = useMemo(
    () => `${apiBaseUrl.replace(/\/$/, "")}/v1`,
    [apiBaseUrl],
  );
  const endpoints = useMemo(
    () => buildEndpoints(baseV1, wallet, apiKey),
    [apiKey, baseV1, wallet],
  );

  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      buildEndpoints(
        `${DEFAULT_API_BASE_URL}/v1`,
        DEFAULT_WALLET,
        DEFAULT_API_KEY,
      ).map((e) => [e.id, e.id === "asset-full"]),
    ),
  );

  const toggle = useCallback((id: string) => {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const scrollTo = (id: string) => {
    document
      .getElementById(`ep-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
      <aside className="lg:sticky lg:top-24 lg:w-56 lg:shrink-0">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#4A5568]">
          Endpoints
        </p>
        <nav className="flex flex-row gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {endpoints.map((ep) => (
            <button
              key={ep.id}
              type="button"
              onClick={() => {
                scrollTo(ep.id);
                setOpen((prev) => ({ ...prev, [ep.id]: true }));
              }}
              className="whitespace-nowrap rounded-lg border border-transparent px-3 py-2 text-left text-xs text-[#8892A4] transition-colors hover:border-[rgba(30,42,58,0.8)] hover:bg-[rgba(15,22,41,0.6)] hover:text-white lg:text-sm"
            >
              {ep.path}
            </button>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 space-y-10">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-[32px]">
            API Reference
          </h1>
          <p className="mt-2 text-sm text-[#8892A4]">
            Public discovery endpoints are free. Pro and Enterprise endpoints
            use x402 wallet-session access through{" "}
            <span className="font-mono text-[#00D4FF]">X-Wallet-Address</span>.
          </p>
          <div className="mt-4 inline-flex items-center rounded-lg border border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.08)] px-3 py-1.5 font-mono text-xs font-medium text-[#00D4FF]">
            {baseV1}
          </div>
        </header>

        <section className="rounded-xl border border-[rgba(30,42,58,0.85)] bg-[rgba(15,22,41,0.45)] p-4">
          <h2 className="text-sm font-bold text-white">Local API base URL</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#8892A4]">
            This value is synced to browser localStorage as{" "}
            <span className="font-mono text-[#00D4FF]">nexus_api_base_url</span>{" "}
            and updates every curl example below. Use{" "}
            <span className="font-mono text-[#00D4FF]">
              http://localhost:3001
            </span>{" "}
            for local development or your production API origin.
          </p>
          <input
            value={apiBaseUrl}
            onChange={(event) => {
              const next = event.target.value.trim().replace(/\/$/, "");
              setApiBaseUrl(next);
              window.localStorage.setItem(API_BASE_STORAGE_KEY, next);
            }}
            className="mt-3 w-full rounded-lg border border-[rgba(30,42,58,0.9)] bg-[#0A0E1A] px-3 py-2 font-mono text-sm text-[#C5CDD8] outline-none transition focus:border-[#00D4FF]"
            placeholder="http://localhost:3001"
          />
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-[rgba(0,255,136,0.22)] bg-[rgba(0,255,136,0.06)] p-4">
            <p className="text-sm font-bold text-[#00FF88]">Free</p>
            <p className="mt-1 text-xs text-[#8892A4]">
              Catalog, public asset detail, market overview, events, search, and
              session check.
            </p>
          </div>
          <div className="rounded-xl border border-[rgba(0,212,255,0.22)] bg-[rgba(0,212,255,0.06)] p-4">
            <p className="text-sm font-bold text-[#00D4FF]">Pro · $3 / 24h</p>
            <p className="mt-1 text-xs text-[#8892A4]">
              Full asset layers, history, sources, risk breakdown, and AI
              insight.
            </p>
          </div>
          <div className="rounded-xl border border-[rgba(255,184,0,0.22)] bg-[rgba(255,184,0,0.06)] p-4">
            <p className="text-sm font-bold text-[#FFB800]">
              Enterprise · $29 / 7d
            </p>
            <p className="mt-1 text-xs text-[#8892A4]">
              Bulk analytics, export, and Ask Nexus API workflows.
            </p>
          </div>
        </section>

        <section
          id="agent-workflows"
          className="rounded-xl border border-[rgba(255,184,0,0.24)] bg-[rgba(255,184,0,0.06)] p-4"
        >
          <h2 className="text-sm font-bold text-white">AI agent workflows</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#8892A4]">
            Agents can fetch the full dataset, compare risk/yield/source quality,
            and ask natural-language questions over shortlisted assets. See the
            source guide at{" "}
            <a
              href="/docs/agent-integration"
              className="font-mono text-[#00D4FF] underline decoration-[rgba(0,212,255,0.45)] underline-offset-4 hover:text-white"
            >
              docs/agent-integration.md
            </a>{" "}
            and discover endpoint metadata with{" "}
            <button
              type="button"
              onClick={() => {
                scrollTo("agent-manifest");
                setOpen((prev) => ({ ...prev, ["agent-manifest"]: true }));
              }}
              className="font-mono text-[#00D4FF] underline decoration-[rgba(0,212,255,0.45)] underline-offset-4 hover:text-white"
            >
              GET /v1/agent/manifest
            </button>
            .
          </p>
        </section>

        <section className="rounded-xl border border-[rgba(0,212,255,0.24)] bg-[rgba(0,212,255,0.06)] p-4">
          <h2 className="text-sm font-bold text-white">
            Wallet session access
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#8892A4]">
            After a successful x402 checkout, Nexus RWA stores a time-limited
            session for the paying wallet in Postgres. Gated API requests should
            include{" "}
            <span className="font-mono text-[#00D4FF]">X-Wallet-Address</span>.
            If the wallet has an active Pro or Enterprise session, the endpoint
            returns 200. Otherwise, it returns HTTP 402 with x402 payment
            metadata.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="sr-only">Endpoints</h2>
          {endpoints.map((ep) => (
            <EndpointCard
              key={ep.id}
              ep={ep}
              expanded={!!open[ep.id]}
              onToggle={() => toggle(ep.id)}
            />
          ))}
        </section>

        <hr className="border-[rgba(30,42,58,0.8)]" />

        <section>
          <h2 className="text-xl font-bold text-white">
            How x402 wallet sessions work
          </h2>
          <ol className="mt-6 space-y-6">
            <li className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.4)] p-4">
              <p className="text-sm font-semibold text-[#00D4FF]">Step 1</p>
              <p className="mt-1 text-sm text-[#8892A4]">
                Request a Pro or Enterprise endpoint. If the wallet does not
                have an active session, the API returns HTTP 402 Payment
                Required.
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg border border-[rgba(30,42,58,0.8)] bg-[#0A0E1A] p-3">
                <code className="font-mono text-[11px] text-[#8892A4]">
                  {`const res = await fetch("${baseV1}/assets/blackrock-buidl/full");
console.log(res.status); // 402 if locked`}
                </code>
              </pre>
            </li>
            <li className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.4)] p-4">
              <p className="text-sm font-semibold text-[#00D4FF]">Step 2</p>
              <p className="mt-1 text-sm text-[#8892A4]">
                Complete x402 USDC checkout. The API verifies the payment and
                persists the wallet session in Postgres.
              </p>
            </li>
            <li className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.4)] p-4">
              <p className="text-sm font-semibold text-[#00D4FF]">Step 3</p>
              <p className="mt-1 text-sm text-[#8892A4]">
                Retry gated requests with the wallet address header while the
                session is active.
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg border border-[rgba(30,42,58,0.8)] bg-[#0A0E1A] p-3">
                <code className="font-mono text-[11px] text-[#8892A4]">
                  {`fetch("${baseV1}/assets/blackrock-buidl/full", {
  headers: {
    "X-Wallet-Address": "${wallet}"
  }
});`}
                </code>
              </pre>
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white">SDKs &amp; plugins</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              { title: "Python SDK", icon: Code2 },
              { title: "JavaScript SDK", icon: Code2 },
              { title: "LangChain Plugin", icon: Sparkles },
              { title: "AutoGen Plugin", icon: Sparkles },
            ].map(({ title, icon: Icon }) => (
              <div
                key={title}
                className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[rgba(30,42,58,0.9)] bg-[rgba(10,14,26,0.5)] px-4 py-10 text-center"
              >
                <Icon className="size-8 text-[#4A5568]" />
                <p className="mt-3 font-semibold text-white">{title}</p>
                <p className="mt-1 text-sm text-[#8892A4]">Coming Soon</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
