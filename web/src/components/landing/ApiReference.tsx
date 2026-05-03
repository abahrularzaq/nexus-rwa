"use client";

import { useState } from "react";
import { FadeUp } from "@/components/landing/primitives";

const endpoints = [
  { method: "GET", path: "/v1/market/overview", price: "FREE" },
  { method: "GET", path: "/v1/assets", price: "$0.0005" },
  { method: "GET", path: "/v1/assets/:id", price: "$0.001" },
  { method: "GET", path: "/v1/assets/:id/yield", price: "$0.005" },
  { method: "GET", path: "/v1/assets/:id/holders", price: "$0.005" },
  { method: "GET", path: "/v1/assets/:id/risk", price: "$0.003" },
  { method: "GET", path: "/v1/search", price: "$0.001" },
];

const responseSample = `{
  "success": true,
  "data": {
    "assetId": "ondo-usdy",
    "name": "Ondo USDY",
    "currentYield": "5.42",
    "avgYield7d": "5.39",
    "avgYield30d": "5.38",
    "avgYield90d": "5.29",
    "yieldHistory": [
      { "date": "2026-05-02", "yield": "5.42" },
      { "date": "2026-05-01", "yield": "5.39" },
      { "date": "2026-04-30", "yield": "5.41" }
    ]
  },
  "meta": {
    "timestamp": "2026-05-02T15:00:00Z",
    "requestId": "req_01hw8x9kp3...",
    "cached": false
  }
}`;

export function ApiReference() {
  const [active, setActive] = useState(3);
  return (
    <section className="py-24 px-6">
      <div className="max-w-[1400px] mx-auto grid lg:grid-cols-[2fr_3fr] gap-8 items-start">
        <FadeUp>
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white">API Reference</h3>
            <p className="mt-1 text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
              api.nexusrwa.xyz/v1
            </p>
            <div className="mt-5 space-y-1">
              {endpoints.map((e, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-left transition-all"
                  style={{
                    background: active === i ? "rgba(0,212,255,0.08)" : "transparent",
                    borderLeft: active === i ? "2px solid var(--accent-cyan)" : "2px solid transparent",
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="px-1.5 py-0.5 text-[10px] font-bold rounded"
                      style={{ background: "rgba(0,255,136,0.15)", color: "var(--accent-green)" }}
                    >
                      {e.method}
                    </span>
                    <span
                      className="text-xs font-mono truncate"
                      style={{ color: active === i ? "#fff" : "#CBD5E1" }}
                    >
                      {e.path}
                    </span>
                  </div>
                  <span className="text-[11px] tabular shrink-0" style={{ color: "var(--text-muted)" }}>
                    {e.price}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="flex items-center gap-3 mb-3">
            <span
              className="px-2 py-0.5 text-[10px] font-bold rounded"
              style={{ background: "rgba(0,255,136,0.15)", color: "var(--accent-green)" }}
            >
              200 OK
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              12ms
            </span>
            <span className="text-xs font-mono ml-auto" style={{ color: "var(--text-secondary)" }}>
              {endpoints[active].path}
            </span>
          </div>
          <pre
            className="text-[13px] leading-[1.7] overflow-x-auto p-6 rounded-xl font-mono"
            style={{
              background: "#060A14",
              border: "1px solid rgba(0,212,255,0.2)",
              color: "#CBD5E1",
            }}
          >
            {colorJson(responseSample)}
          </pre>
          <a
            href="#"
            className="inline-flex items-center gap-2 mt-4 text-sm font-semibold"
            style={{ color: "var(--accent-cyan)" }}
          >
            View Full API Documentation →
          </a>
        </FadeUp>
      </div>
    </section>
  );
}

function colorJson(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => (
    <div key={i}>
      {line.split(/("[^"]*"|\b\d+\.?\d*\b|true|false)/g).map((tok, j) => {
        if (/^"/.test(tok)) {
          return (
            <span key={j} style={{ color: line.indexOf(`${tok}:`) >= 0 ? "#00D4FF" : "#00FF88" }}>
              {tok}
            </span>
          );
        }
        if (/^\d/.test(tok)) return <span key={j} style={{ color: "#FFB800" }}>{tok}</span>;
        if (tok === "true" || tok === "false") return <span key={j} style={{ color: "#FFB800" }}>{tok}</span>;
        return <span key={j} style={{ color: "#8892A4" }}>{tok}</span>;
      })}
    </div>
  ));
}
