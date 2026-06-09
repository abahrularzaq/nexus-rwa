"use client";

import { useState } from "react";
import { Bot, Lock, Wallet, ShieldCheck, Database, Zap, Coins } from "lucide-react";
import { FadeUp } from "@/components/landing/primitives";

const steps = [
  { Icon: Bot, title: "Request Data", text: "User or agent calls Nexus RWA API", bg: "rgba(15,22,41,0.8)", border: "var(--border-line)", color: "#00D4FF", titleColor: "#FFFFFF" },
  { Icon: Lock, title: "402 Response", text: "Server returns payment instructions if locked", bg: "rgba(0,212,255,0.05)", border: "rgba(0,212,255,0.4)", color: "#00D4FF", titleColor: "#00D4FF" },
  { Icon: Wallet, title: "USDC Pass", text: "Wallet unlocks Pro 24h access", bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.4)", color: "#A78BFA", titleColor: "#A78BFA" },
  { Icon: ShieldCheck, title: "Session Active", text: "Wallet session is persisted in Postgres", bg: "rgba(15,22,41,0.8)", border: "var(--border-line)", color: "#00D4FF", titleColor: "#FFFFFF" },
  { Icon: Database, title: "Layers Unlocked", text: "Risk, sources, history, and insight delivered", bg: "rgba(0,255,136,0.05)", border: "rgba(0,255,136,0.4)", color: "#00FF88", titleColor: "#00FF88" },
];

const tabs = ["curl", "Python", "JavaScript", "AI Agent"] as const;

const codeSamples: Record<(typeof tabs)[number], string> = {
  curl: `# 1. Check wallet session
$ curl "https://api.nexusrwa.xyz/v1/session?wallet=0x..." \\
  -H "X-Wallet-Address: 0x..."

# If no active session, gated endpoints return:
HTTP/1.1 402 Payment Required
{
  "x402Version": 1,
  "accepts": [{
    "network": "base-sepolia",
    "asset": "USDC",
    "tier": "pro",
    "displayPrice": "$3 / 24h"
  }]
}

# 2. After checkout, retry with wallet session
$ curl https://api.nexusrwa.xyz/v1/assets/franklin-benji/full \\
  -H "X-Wallet-Address: 0x..."

# ✓ Full Pro layers returned
{"success":true,"data":{"slug":"franklin-benji","sources":[],"risk":{}}}`,
  Python: `import requests

wallet = "0x..."
base = "https://api.nexusrwa.xyz/v1"

session = requests.get(
    f"{base}/session?wallet={wallet}",
    headers={"X-Wallet-Address": wallet},
).json()

if session["data"]["active"]:
    res = requests.get(
        f"{base}/assets/franklin-benji/full",
        headers={"X-Wallet-Address": wallet},
    )
    print(res.json()["data"]["slug"])`,
  JavaScript: `const wallet = "0x...";
const base = "https://api.nexusrwa.xyz/v1";

const session = await fetch(base + "/session?wallet=" + wallet, {
  headers: { "X-Wallet-Address": wallet },
}).then(r => r.json());

if (session.data.active) {
  const asset = await fetch(base + "/assets/franklin-benji/full", {
    headers: { "X-Wallet-Address": wallet },
  }).then(r => r.json());

  console.log(asset.data.slug);
}`,
  "AI Agent": `Goal: retrieve complete RWA risk intelligence.

1. Request /v1/assets/{slug}/full
2. If HTTP 402, parse x402 payment requirement
3. Pay with wallet-native USDC pass
4. Retry with wallet session header
5. Use sources + risk + events for reasoning

Best for: agents, research bots, portfolio monitors`,
};

export function X402Section() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("curl");

  return (
    <section
      id="x402"
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
            Wallet-native USDC access passes for deeper RWA intelligence — no traditional subscription required.
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
              {i < steps.length - 1 && <Zap size={18} className="hidden lg:block" style={{ color: "var(--accent-cyan)" }} />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-8 items-start">
          <FadeUp>
            <div className="glass-card p-6 h-full">
              <div className="flex items-center gap-3 mb-4">
                <Coins size={22} style={{ color: "var(--accent-green)" }} />
                <h3 className="text-xl font-bold text-white">Pay-per-request ready</h3>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Nexus RWA is designed for API-native data access where users and agents can unlock deeper asset intelligence only when they need it.
              </p>
            </div>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div className="glass-card overflow-hidden">
              <div className="flex flex-wrap gap-2 p-4 border-b" style={{ borderColor: "var(--border-line)" }}>
                {tabs.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="px-3 py-1.5 rounded-md text-xs font-bold"
                    style={{
                      background: tab === t ? "rgba(0,212,255,0.12)" : "transparent",
                      color: tab === t ? "var(--accent-cyan)" : "var(--text-secondary)",
                      border: tab === t ? "1px solid rgba(0,212,255,0.3)" : "1px solid transparent",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <pre className="p-6 text-xs leading-relaxed overflow-x-auto" style={{ color: "#CBD5E1" }}>
                {codeSamples[tab]}
              </pre>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
