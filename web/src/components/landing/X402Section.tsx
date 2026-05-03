"use client";

import { useState } from "react";
import { Bot, Lock, Wallet, ShieldCheck, Database, Zap, Coins } from "lucide-react";
import { FadeUp } from "@/components/landing/primitives";

const steps = [
  { Icon: Bot, title: "Agent Request", text: "AI agent calls Nexus RWA API", bg: "rgba(15,22,41,0.8)", border: "var(--border-line)", color: "#00D4FF", titleColor: "#FFFFFF" },
  { Icon: Lock, title: "402 Response", text: "Server returns payment instructions", bg: "rgba(0,212,255,0.05)", border: "rgba(0,212,255,0.4)", color: "#00D4FF", titleColor: "#00D4FF" },
  { Icon: Wallet, title: "Auto Payment", text: "Agent pays $0.001 USDC on Base", bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.4)", color: "#A78BFA", titleColor: "#A78BFA" },
  { Icon: ShieldCheck, title: "Verification", text: "Payment confirmed on-chain", bg: "rgba(15,22,41,0.8)", border: "var(--border-line)", color: "#00D4FF", titleColor: "#FFFFFF" },
  { Icon: Database, title: "Data Returned", text: "Yield, TVL, risk data delivered", bg: "rgba(0,255,136,0.05)", border: "rgba(0,255,136,0.4)", color: "#00FF88", titleColor: "#00FF88" },
];

const tabs = ["curl", "Python", "JavaScript", "AI Agent"] as const;

const codeSamples: Record<(typeof tabs)[number], string> = {
  curl: `# 1. Initial request — no payment needed yet
$ curl https://api.nexusrwa.xyz/v1/assets/ondo-usdy/yield

# Server responds:
HTTP/1.1 402 Payment Required
{
  "x402Version": 1,
  "accepts": [{
    "network": "base-sepolia",
    "maxAmountRequired": "$0.005",
    "payTo": "0x742d...8f3a",
    "asset": "USDC"
  }]
}

# 2. Client pays & retries with proof
$ curl https://api.nexusrwa.xyz/v1/assets/ondo-usdy/yield \\
  -H 'X-Payment: {"txHash":"0x...","from":"0x..."}'

# ✓ Data returned:
{"success":true,"data":{"yield":"5.42%","tvl":"892400000","risk":"LOW"}}`,
  Python: `import requests
from x402 import X402Client

client = X402Client(wallet="0x...", network="base")
res = client.get("https://api.nexusrwa.xyz/v1/assets/ondo-usdy/yield")
print(res.json()["data"]["yield"])  # → 5.42%`,
  JavaScript: `import { x402 } from "@x402/client";

const client = x402({ wallet: "0x...", network: "base" });
const { data } = await client.get(
  "https://api.nexusrwa.xyz/v1/assets/ondo-usdy/yield"
);
console.log(data.yield); // → "5.42%"`,
  "AI Agent": `from langchain.tools import X402Tool
from langchain.agents import initialize_agent

nexus = X402Tool(api="https://api.nexusrwa.xyz/v1")
agent = initialize_agent([nexus], llm)
agent.run("What's the current yield on Ondo USDY?")
# Agent auto-pays $0.005 USDC and returns: 5.42%`,
};

export function X402Section() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("curl");

  return (
    <section
      className="py-24 px-6"
      style={{
        background:
          "linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)",
      }}
    >
      <div className="max-w-[1400px] mx-auto">
        <FadeUp className="text-center mb-16">
          <span
            className="inline-block px-3 py-1 rounded-full text-[11px] label-eyebrow"
            style={{
              background: "rgba(124,58,237,0.15)",
              border: "1px solid var(--border-purple)",
              color: "#A78BFA",
            }}
          >
            Monetization Engine
          </span>
          <h2 className="mt-5 text-4xl md:text-[40px] font-extrabold tracking-tight text-gradient">
            Powered by X402 Protocol
          </h2>
          <p
            className="mt-3 text-base max-w-xl mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            The internet-native payment standard built for AI agents and autonomous systems
          </p>
        </FadeUp>

        {/* flow */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-16">
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col lg:flex-row items-center gap-4 w-full lg:w-auto">
              <div
                className="w-[160px] rounded-xl p-4 text-center"
                style={{
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                }}
              >
                <s.Icon size={28} style={{ color: s.color }} className="mx-auto mb-2" />
                <div className="text-sm font-bold" style={{ color: s.titleColor }}>
                  {s.title}
                </div>
                <div className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>
                  {s.text}
                </div>
              </div>
              {i < steps.length - 1 && (
                <span
                  className="arrow-pulse text-2xl rotate-90 lg:rotate-0"
                  style={{ color: "var(--accent-cyan)" }}
                >
                  →
                </span>
              )}
            </div>
          ))}
        </div>

        {/* code */}
        <FadeUp>
          <div className="flex items-center gap-1 mb-3 border-b" style={{ borderColor: "var(--border-line)" }}>
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  color: tab === t ? "#fff" : "#8892A4",
                  borderBottom: tab === t ? "2px solid var(--accent-cyan)" : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <pre
            className="text-[13px] leading-[1.7] overflow-x-auto p-6 rounded-xl font-mono"
            style={{
              background: "#060A14",
              border: "1px solid rgba(0,212,255,0.2)",
              color: "#CBD5E1",
            }}
          >
            {highlight(codeSamples[tab])}
          </pre>
        </FadeUp>

        {/* feature cards */}
        <div className="grid md:grid-cols-3 gap-5 mt-10">
          {[
            { Icon: Zap, title: "Zero Friction", text: "No API keys. No signup. No subscriptions. Just pay and access.", border: "rgba(0,212,255,0.3)", color: "#00D4FF" },
            { Icon: Bot, title: "AI Agent Native", text: "Works with LangChain, AutoGen, CrewAI, and any HTTP client out of the box.", border: "rgba(124,58,237,0.3)", color: "#A78BFA" },
            { Icon: Coins, title: "True Micropayments", text: "Pay exactly $0.0005 per request. No minimums. No monthly fees.", border: "rgba(0,255,136,0.3)", color: "#00FF88" },
          ].map((c, i) => (
            <FadeUp key={i} delay={i * 0.05}>
              <div
                className="glass-card p-7 h-full transition-all hover:-translate-y-1"
                style={{ borderColor: c.border }}
              >
                <c.Icon size={28} style={{ color: c.color }} />
                <h3 className="mt-4 text-lg font-bold text-white">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {c.text}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

function highlight(code: string) {
  // Minimal token highlighting
  const lines = code.split("\n");
  return lines.map((line, i) => {
    let el: React.ReactNode = line;
    if (line.trim().startsWith("#")) {
      el = <span style={{ color: "#4A5568", fontStyle: "italic" }}>{line}</span>;
    } else if (/^HTTP\/|GET |POST /.test(line.trim())) {
      el = <span style={{ color: "#00D4FF" }}>{line}</span>;
    } else {
      // simple string + number coloring
      const parts = line.split(/("[^"]*")/g);
      el = parts.map((p, j) =>
        p.startsWith('"') ? (
          <span key={j} style={{ color: "#00FF88" }}>{p}</span>
        ) : (
          <span key={j}>{p.replace(/(\b\d+\.?\d*\b)/g, (n) => n)}</span>
        ),
      );
    }
    return (
      <div key={i}>
        <span className="select-none mr-4 inline-block w-6 text-right" style={{ color: "#2A3548" }}>
          {i + 1}
        </span>
        {el}
      </div>
    );
  });
}
