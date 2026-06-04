"use client";

import { useState } from "react";
import { FadeUp } from "@/components/landing/primitives";

const endpoints = [
  { method: "GET", path: "/v1/market/overview", price: "Free", tier: "Public" },
  { method: "GET", path: "/v1/assets", price: "Free", tier: "Public" },
  { method: "GET", path: "/v1/assets/:slug", price: "Free", tier: "Public" },
  { method: "GET", path: "/v1/assets/:slug/events", price: "Free", tier: "Public" },
  { method: "GET", path: "/v1/assets/:slug/full", price: "$3 / 24h", tier: "Pro" },
  { method: "GET", path: "/v1/assets/:slug/risk", price: "$3 / 24h", tier: "Pro" },
  { method: "GET", path: "/v1/assets/:slug/sources", price: "$3 / 24h", tier: "Pro" },
  { method: "GET", path: "/v1/assets/:slug/insight", price: "$3 / 24h", tier: "Pro" },
  { method: "GET", path: "/v1/export", price: "$29 / 7d", tier: "Enterprise" },
  { method: "POST", path: "/v1/ask", price: "$29 / 7d", tier: "Enterprise" },
];

const responseSample = `{
  "network": "base-sepolia",
  "chainId": 84532,
  "x402Version": 1,
  "error": "Payment required",
  "tier": {
    "tier": "pro",
    "label": "Pro 24h Pass",
    "displayPrice": "$3 / 24h",
    "priceUsd": "3.00",
    "priceEth": "0.001",
    "duration": "24h"
  },
  "pricing": {
    "tier": "pro",
    "label": "Pro 24h Pass",
    "displayPrice": "$3 / 24h",
    "priceUsd": "3.00",
    "priceEth": "0.001",
    "duration": "24h"
  },
  "x402": {
    "price": "0.001",
    "currency": "ETH",
    "network": "base-sepolia",
    "tier": "pro"
  }
}`;

const tierStyle: Record<string, { bg: string; color: string }> = {
  Public: { bg: "rgba(0,255,136,0.15)", color: "var(--accent-green)" },
  Pro: { bg: "rgba(0,212,255,0.15)", color: "var(--accent-cyan)" },
  Enterprise: { bg: "rgba(124,58,237,0.18)", color: "#A78BFA" },
};

export function ApiReference() {
  const [active, setActive] = useState(4);
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
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={tierStyle[e.tier]}
                    >
                      {e.tier}
                    </span>
                    <span className="text-[11px] tabular" style={{ color: "var(--text-muted)" }}>
                      {e.price}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="flex items-center gap-3 mb-3">
            <span
              className="px-2 py-0.5 text-[10px] font-bold rounded"
              style={tierStyle[endpoints[active].tier]}
            >
              {endpoints[active].tier}
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {endpoints[active].price}
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
