"use client";

import { useCallback, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Code2, Sparkles } from "lucide-react";

const BASE = "https://api.nexusrwa.xyz/v1";

type ParamRow = {
  name: string;
  in: string;
  type: string;
  required: string;
  example: string;
};

type EndpointDoc = {
  id: string;
  title: string;
  badge: string;
  badgeFree?: boolean;
  description: string;
  curl: string;
  response: ReactNode;
  params?: ParamRow[];
  x402?: string;
};

function Jp({ children }: { children: React.ReactNode }) {
  return <span className="text-[#8892A4]">{children}</span>;
}
function Jk({ children }: { children: React.ReactNode }) {
  return <span className="text-[#A78BFA]">{children}</span>;
}
function Js({ children }: { children: React.ReactNode }) {
  return <span className="text-[#00FF88]">{children}</span>;
}
function Jn({ children }: { children: React.ReactNode }) {
  return <span className="text-[#00D4FF]">{children}</span>;
}
function Jb({ children }: { children: React.ReactNode }) {
  return <span className="text-[#FFB800]">{children}</span>;
}

const ENDPOINTS: EndpointDoc[] = [
  {
    id: "market-overview",
    title: "GET /v1/market/overview",
    badge: "FREE",
    badgeFree: true,
    description: "Market-wide RWA statistics",
    curl: `curl ${BASE}/market/overview`,
    response: (
      <>
        <Jp>{"{"}</Jp>
        {"\n  "}
        <Jk>&quot;success&quot;</Jk>
        <Jp>: </Jp>
        <Jb>true</Jb>
        <Jp>,</Jp>
        {"\n  "}
        <Jk>&quot;data&quot;</Jk>
        <Jp>: {"{"}</Jp>
        {"\n    "}
        <Jk>&quot;totalTvl&quot;</Jk>
        <Jp>: </Jp>
        <Jn>2847300000</Jn>
        <Jp>,</Jp>
        {"\n    "}
        <Jk>&quot;totalAssets&quot;</Jk>
        <Jp>: </Jp>
        <Jn>8</Jn>
        <Jp>,</Jp>
        {"\n    "}
        <Jk>&quot;avgYieldRate&quot;</Jk>
        <Jp>: </Jp>
        <Jn>6.73</Jn>
        {"\n  "}
        <Jp>{"}"}</Jp>
        {"\n"}
        <Jp>{"}"}</Jp>
      </>
    ),
  },
  {
    id: "assets-list",
    title: "GET /v1/assets",
    badge: "$0.0005",
    description: "Paginated list of tokenized real-world assets",
    curl: `curl ${BASE}/assets?page=1&limit=20`,
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
        name: "chain",
        in: "query",
        type: "string",
        required: "optional",
        example: "base",
      },
      {
        name: "search",
        in: "query",
        type: "string",
        required: "optional",
        example: "ondo",
      },
    ],
    x402: "This endpoint requires X402 payment of $0.0005 USDC",
    response: (
      <>
        <Jp>{"{"}</Jp>
        {"\n  "}
        <Jk>&quot;success&quot;</Jk>
        <Jp>: </Jp>
        <Jb>true</Jb>
        <Jp>,</Jp>
        {"\n  "}
        <Jk>&quot;data&quot;</Jk>
        <Jp>: {"{"}</Jp>
        {"\n    "}
        <Jk>&quot;data&quot;</Jk>
        <Jp>: [</Jp>
        {"\n      "}
        <Jp>{"{"}</Jp>
        {"\n        "}
        <Jk>&quot;id&quot;</Jk>
        <Jp>: </Jp>
        <Js>&quot;ondo-usdy&quot;</Js>
        <Jp>,</Jp>
        {"\n        "}
        <Jk>&quot;symbol&quot;</Jk>
        <Jp>: </Jp>
        <Js>&quot;USDY&quot;</Js>
        {"\n      "}
        <Jp>{"}"}</Jp>
        {"\n    "}
        <Jp>],</Jp>
        {"\n    "}
        <Jk>&quot;pagination&quot;</Jk>
        <Jp>: {"{"}</Jp>
        {" \"page\": 1, \"total\": 8 "}
        <Jp>{"}"}</Jp>
        {"\n  "}
        <Jp>{"}"}</Jp>
        {"\n"}
        <Jp>{"}"}</Jp>
      </>
    ),
  },
  {
    id: "asset-detail",
    title: "GET /v1/assets/:id",
    badge: "$0.001",
    description: "Single asset profile and metadata",
    curl: `curl ${BASE}/assets/ondo-usdy`,
    params: [
      {
        name: "id",
        in: "path",
        type: "string",
        required: "required",
        example: "ondo-usdy",
      },
    ],
    x402: "This endpoint requires X402 payment of $0.001 USDC",
    response: (
      <>
        <Jp>{"{"}</Jp>
        {"\n  "}
        <Jk>&quot;success&quot;</Jk>
        <Jp>: </Jp>
        <Jb>true</Jb>
        <Jp>,</Jp>
        {"\n  "}
        <Jk>&quot;data&quot;</Jk>
        <Jp>: {"{"}</Jp>
        {"\n    "}
        <Jk>&quot;id&quot;</Jk>
        <Jp>: </Jp>
        <Js>&quot;ondo-usdy&quot;</Js>
        <Jp>,</Jp>
        {"\n    "}
        <Jk>&quot;name&quot;</Jk>
        <Jp>: </Jp>
        <Js>&quot;Ondo USDY&quot;</Js>
        <Jp>,</Jp>
        {"\n    "}
        <Jk>&quot;protocol&quot;</Jk>
        <Jp>: </Jp>
        <Js>&quot;Ondo Finance&quot;</Js>
        {"\n  "}
        <Jp>{"}"}</Jp>
        {"\n"}
        <Jp>{"}"}</Jp>
      </>
    ),
  },
  {
    id: "asset-yield",
    title: "GET /v1/assets/:id/yield",
    badge: "$0.005",
    description: "Historical yield data for one asset",
    curl: `curl ${BASE}/assets/ondo-usdy/yield?period=7d`,
    params: [
      {
        name: "id",
        in: "path",
        type: "string",
        required: "required",
        example: "ondo-usdy",
      },
      {
        name: "period",
        in: "query",
        type: "string",
        required: "optional",
        example: "7d | 30d | 90d | 365d",
      },
    ],
    x402: "This endpoint requires X402 payment of $0.005 USDC",
    response: (
      <>
        <Jp>{"{"}</Jp>
        {"\n  "}
        <Jk>&quot;success&quot;</Jk>
        <Jp>: </Jp>
        <Jb>true</Jb>
        <Jp>,</Jp>
        {"\n  "}
        <Jk>&quot;data&quot;</Jk>
        <Jp>: {"{"}</Jp>
        {"\n    "}
        <Jk>&quot;assetId&quot;</Jk>
        <Jp>: </Jp>
        <Js>&quot;ondo-usdy&quot;</Js>
        <Jp>,</Jp>
        {"\n    "}
        <Jk>&quot;currentYield&quot;</Jk>
        <Jp>: </Jp>
        <Jn>4.82</Jn>
        <Jp>,</Jp>
        {"\n    "}
        <Jk>&quot;history&quot;</Jk>
        <Jp>: [ ... ]</Jp>
        {"\n  "}
        <Jp>{"}"}</Jp>
        {"\n"}
        <Jp>{"}"}</Jp>
      </>
    ),
  },
  {
    id: "asset-history",
    title: "GET /v1/assets/:id/history",
    badge: "$0.005",
    description: "Time-series yield and TVL history (6h snapshots)",
    curl: `curl ${BASE}/assets/ondo-usdy/history?period=30d`,
    params: [
      {
        name: "id",
        in: "path",
        type: "string",
        required: "required",
        example: "ondo-usdy",
      },
      {
        name: "period",
        in: "query",
        type: "string",
        required: "optional",
        example: "7d | 30d | 90d",
      },
    ],
    x402: "This endpoint requires X402 payment of $0.005 USDC",
    response: (
      <>
        <Jp>{"{"}</Jp>
        {"\n  "}
        <Jk>&quot;success&quot;</Jk>
        <Jp>: </Jp>
        <Jb>true</Jb>
        <Jp>,</Jp>
        {"\n  "}
        <Jk>&quot;data&quot;</Jk>
        <Jp>: {"{"}</Jp>
        {"\n    "}
        <Jk>&quot;limited_history&quot;</Jk>
        <Jp>: </Jp>
        <Jb>true</Jb>
        <Jp>,</Jp>
        {"\n    "}
        <Jk>&quot;history&quot;</Jk>
        <Jp>: [{"{"} </Jp>
        <Jk>&quot;timestamp&quot;</Jk>
        <Jp>: </Jp>
        <Js>&quot;2026-05-29T00:00:00.000Z&quot;</Js>
        <Jp>, </Jp>
        <Jk>&quot;yield&quot;</Jk>
        <Jp>: </Jp>
        <Jn>5.2</Jn>
        <Jp>, </Jp>
        <Jk>&quot;tvl&quot;</Jk>
        <Jp>: </Jp>
        <Jn>892400000</Jn>
        <Jp> {"}"}]</Jp>
        {"\n  "}
        <Jp>{"}"}</Jp>
        {"\n"}
        <Jp>{"}"}</Jp>
      </>
    ),
  },
  {
    id: "asset-holders",
    title: "GET /v1/assets/:id/holders",
    badge: "$0.005",
    description: "Holder distribution and concentration metrics",
    curl: `curl ${BASE}/assets/ondo-usdy/holders`,
    params: [
      {
        name: "id",
        in: "path",
        type: "string",
        required: "required",
        example: "ondo-usdy",
      },
    ],
    x402: "This endpoint requires X402 payment of $0.005 USDC",
    response: (
      <>
        <Jp>{"{"}</Jp>
        {"\n  "}
        <Jk>&quot;success&quot;</Jk>
        <Jp>: </Jp>
        <Jb>true</Jb>
        <Jp>,</Jp>
        {"\n  "}
        <Jk>&quot;data&quot;</Jk>
        <Jp>: {"{"}</Jp>
        {"\n    "}
        <Jk>&quot;totalHolders&quot;</Jk>
        <Jp>: </Jp>
        <Jn>128400</Jn>
        <Jp>,</Jp>
        {"\n    "}
        <Jk>&quot;top10Concentration&quot;</Jk>
        <Jp>: </Jp>
        <Jn>34.2</Jn>
        {"\n  "}
        <Jp>{"}"}</Jp>
        {"\n"}
        <Jp>{"}"}</Jp>
      </>
    ),
  },
  {
    id: "asset-risk",
    title: "GET /v1/assets/:id/risk",
    badge: "Free",
    description: "Risk scoring and factor breakdown for one asset (no X402 payment)",
    curl: `curl ${BASE}/assets/ondo-usdy/risk`,
    params: [
      {
        name: "id",
        in: "path",
        type: "string",
        required: "required",
        example: "ondo-usdy",
      },
    ],
    x402: "No payment required — public risk overview hook",
    response: (
      <>
        <Jp>{"{"}</Jp>
        {"\n  "}
        <Jk>&quot;success&quot;</Jk>
        <Jp>: </Jp>
        <Jb>true</Jb>
        <Jp>,</Jp>
        {"\n  "}
        <Jk>&quot;data&quot;</Jk>
        <Jp>: {"{"}</Jp>
        {"\n    "}
        <Jk>&quot;assetId&quot;</Jk>
        <Jp>: </Jp>
        <Js>&quot;ondo-usdy&quot;</Js>
        <Jp>,</Jp>
        {"\n    "}
        <Jk>&quot;score&quot;</Jk>
        <Jp>: </Jp>
        <Jn>72</Jn>
        <Jp>,</Jp>
        {"\n    "}
        <Jk>&quot;level&quot;</Jk>
        <Jp>: </Jp>
        <Js>&quot;LOW&quot;</Js>
        <Jp>,</Jp>
        {"\n    "}
        <Jk>&quot;factors&quot;</Jk>
        <Jp>: []</Jp>
        {"\n  "}
        <Jp>{"}"}</Jp>
        {"\n"}
        <Jp>{"}"}</Jp>
      </>
    ),
  },
  {
    id: "search",
    title: "GET /v1/search",
    badge: "$0.001",
    description: "Full-text and faceted search across catalog fields",
    curl: `curl "${BASE}/search?q=usdy&limit=10"`,
    params: [
      {
        name: "q",
        in: "query",
        type: "string",
        required: "required",
        example: "usdy",
      },
      {
        name: "limit",
        in: "query",
        type: "number",
        required: "optional",
        example: "10",
      },
    ],
    x402: "This endpoint requires X402 payment of $0.001 USDC",
    response: (
      <>
        <Jp>{"{"}</Jp>
        {"\n  "}
        <Jk>&quot;success&quot;</Jk>
        <Jp>: </Jp>
        <Jb>true</Jb>
        <Jp>,</Jp>
        {"\n  "}
        <Jk>&quot;data&quot;</Jk>
        <Jp>: {"{"}</Jp>
        {"\n    "}
        <Jk>&quot;hits&quot;</Jk>
        <Jp>: [ ... ]</Jp>
        {"\n  "}
        <Jp>{"}"}</Jp>
        {"\n"}
        <Jp>{"}"}</Jp>
      </>
    ),
  },
];

function EndpointCard({
  ep,
  expanded,
  onToggle,
}: {
  ep: EndpointDoc;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <article
      id={`ep-${ep.id}`}
      className="scroll-mt-28 overflow-hidden rounded-xl border border-[rgba(30,42,58,0.85)] bg-[rgba(15,22,41,0.55)]"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 border-b border-[rgba(30,42,58,0.6)] px-4 py-4 text-left transition-colors hover:bg-[rgba(255,255,255,0.03)]"
        aria-expanded={expanded}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {expanded ? (
            <ChevronDown className="size-5 shrink-0 text-[#00D4FF]" />
          ) : (
            <ChevronRight className="size-5 shrink-0 text-[#8892A4]" />
          )}
          <span className="truncate font-mono text-sm font-semibold text-white md:text-base">
            {ep.title}
          </span>
        </div>
        <span
          className={
            ep.badgeFree
              ? "shrink-0 rounded-full bg-[rgba(0,255,136,0.12)] px-2.5 py-0.5 text-xs font-bold text-[#00FF88] ring-1 ring-[rgba(0,255,136,0.35)]"
              : "shrink-0 rounded-full bg-[rgba(0,212,255,0.1)] px-2.5 py-0.5 text-xs font-bold text-[#00D4FF] ring-1 ring-[rgba(0,212,255,0.3)]"
          }
        >
          {ep.badge}
        </span>
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
                      key={row.name}
                      className="border-b border-[rgba(30,42,58,0.5)] last:border-0"
                    >
                      <td className="px-3 py-2 font-mono text-[#00D4FF]">{row.name}</td>
                      <td className="px-3 py-2 text-[#8892A4]">{row.in}</td>
                      <td className="px-3 py-2 text-white">{row.type}</td>
                      <td className="px-3 py-2 text-[#8892A4]">{row.required}</td>
                      <td className="px-3 py-2 font-mono text-[#8892A4]">{row.example}</td>
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
              <code className="block font-mono text-[11px] leading-relaxed whitespace-pre">
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
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ENDPOINTS.map((e) => [e.id, e.id === "market-overview"])),
  );

  const toggle = useCallback((id: string) => {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(`ep-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
      {/* SIDEBAR */}
      <aside className="lg:sticky lg:top-24 lg:w-56 lg:shrink-0">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#4A5568]">
          Endpoints
        </p>
        <nav className="flex flex-row gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {ENDPOINTS.map((ep) => (
            <button
              key={ep.id}
              type="button"
              onClick={() => {
                scrollTo(ep.id);
                setOpen((prev) => ({ ...prev, [ep.id]: true }));
              }}
              className="whitespace-nowrap rounded-lg border border-transparent px-3 py-2 text-left text-xs text-[#8892A4] transition-colors hover:border-[rgba(30,42,58,0.8)] hover:bg-[rgba(15,22,41,0.6)] hover:text-white lg:text-sm"
            >
              {ep.title.replace("GET ", "")}
            </button>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 space-y-10">
        {/* HEADER */}
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-[32px]">
            API Reference
          </h1>
          <p className="mt-2 text-sm text-[#8892A4]">
            Powered by X402 Protocol — pay per request
          </p>
          <div className="mt-4 inline-flex items-center rounded-lg border border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.08)] px-3 py-1.5 font-mono text-xs font-medium text-[#00D4FF]">
            api.nexusrwa.xyz/v1
          </div>
        </header>

        {/* ENDPOINT CARDS */}
        <section className="space-y-4">
          <h2 className="sr-only">Endpoints</h2>
          {ENDPOINTS.map((ep) => (
            <EndpointCard
              key={ep.id}
              ep={ep}
              expanded={!!open[ep.id]}
              onToggle={() => toggle(ep.id)}
            />
          ))}
        </section>

        <hr className="border-[rgba(30,42,58,0.8)]" />

        {/* X402 GUIDE */}
        <section>
          <h2 className="text-xl font-bold text-white">How X402 Works</h2>
          <ol className="mt-6 space-y-6">
            <li className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.4)] p-4">
              <p className="text-sm font-semibold text-[#00D4FF]">Step 1</p>
              <p className="mt-1 text-sm text-[#8892A4]">Make request → get HTTP 402 Payment Required</p>
              <pre className="mt-3 overflow-x-auto rounded-lg border border-[rgba(30,42,58,0.8)] bg-[#0A0E1A] p-3">
                <code className="font-mono text-[11px] text-[#8892A4]">
                  {`const res = await fetch("${BASE}/assets/ondo-usdy/yield");\nconsole.log(res.status); // 402`}
                </code>
              </pre>
            </li>
            <li className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.4)] p-4">
              <p className="text-sm font-semibold text-[#00D4FF]">Step 2</p>
              <p className="mt-1 text-sm text-[#8892A4]">
                Read payment instructions from the response body (amount, payTo, asset, network).
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg border border-[rgba(30,42,58,0.8)] bg-[#0A0E1A] p-3">
                <code className="font-mono text-[11px] text-[#8892A4]">
                  {`const body = await res.json();\n// x402Requirements, maxAmountRequired, payTo, ...`}
                </code>
              </pre>
            </li>
            <li className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.4)] p-4">
              <p className="text-sm font-semibold text-[#00D4FF]">Step 3</p>
              <p className="mt-1 text-sm text-[#8892A4]">Pay USDC on Base (exact amount) to the provided address.</p>
            </li>
            <li className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.4)] p-4">
              <p className="text-sm font-semibold text-[#00D4FF]">Step 4</p>
              <p className="mt-1 text-sm text-[#8892A4]">Retry the same URL with proof in the X-Payment header.</p>
              <pre className="mt-3 overflow-x-auto rounded-lg border border-[rgba(30,42,58,0.8)] bg-[#0A0E1A] p-3">
                <code className="font-mono text-[11px] text-[#8892A4]">
                  {`fetch(url, {\n  headers: {\n    "X-Payment": JSON.stringify({ /* proof */ }),\n  },\n});`}
                </code>
              </pre>
            </li>
            <li className="rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.4)] p-4">
              <p className="text-sm font-semibold text-[#00D4FF]">Step 5</p>
              <p className="mt-1 text-sm text-[#8892A4]">Receive 200 JSON with your data.</p>
            </li>
          </ol>
        </section>

        {/* SDK */}
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
