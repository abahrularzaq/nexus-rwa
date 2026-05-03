"use client";

import { FadeUp, HexLogo } from "@/components/landing/primitives";
import { BookOpen, MessageCircle } from "lucide-react";

/** lucide-react v1.x does not ship a GitHub brand icon; inline SVG keeps Vercel builds stable. */
function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function CTASection() {
  return (
    <section
      className="relative py-28 px-6 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(0,212,255,0.04) 0%, rgba(124,58,237,0.04) 100%)",
        borderTop: "1px solid rgba(0,212,255,0.1)",
        borderBottom: "1px solid rgba(0,212,255,0.1)",
      }}
    >
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "rgba(0,212,255,0.05)", filter: "blur(100px)" }}
      />
      <div className="relative max-w-[700px] mx-auto text-center">
        <FadeUp>
          <span
            className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#00D4FF,#7C3AED)" }}
          >
            GET STARTED TODAY
          </span>
          <h2 className="mt-6 text-4xl md:text-[56px] font-extrabold tracking-[-0.03em] leading-[1.05]">
            <span className="block text-gradient-cyan">The RWA Data Layer</span>
            <span className="block text-gradient-cp">Your Protocol Deserves</span>
          </h2>
          <p
            className="mt-5 text-lg leading-[1.7]"
            style={{ color: "var(--text-secondary)" }}
          >
            Start with free tier. Scale with pay-per-request. No contracts, no gatekeeping, no limits.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              className="px-8 py-3.5 rounded-[10px] text-white font-bold text-base"
              style={{
                background: "linear-gradient(135deg,#00D4FF,#7C3AED)",
                boxShadow: "0 0 40px rgba(0,212,255,0.4)",
              }}
            >
              Explore Dashboard
            </button>
            <button
              className="px-8 py-3.5 rounded-[10px] font-semibold text-base"
              style={{
                border: "1px solid rgba(0,212,255,0.4)",
                color: "var(--accent-cyan)",
              }}
            >
              Read API Docs
            </button>
            <button className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
              Try API Free →
            </button>
          </div>
          <div className="mt-10 flex items-center justify-center gap-6 text-sm" style={{ color: "var(--text-secondary)" }}>
            {["47 Assets", "6 Protocols", "$2.84B TVL", "Live on Base"].map((t, i, arr) => (
              <div key={t} className="flex items-center gap-6">
                <span>{t}</span>
                {i < arr.length - 1 && <span style={{ color: "var(--text-muted)" }}>·</span>}
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer
      className="px-6 pt-16 pb-8"
      style={{ background: "var(--bg-primary)", borderTop: "1px solid var(--border-line)" }}
    >
      <div className="max-w-[1400px] mx-auto grid md:grid-cols-[1.6fr_1fr_1fr_1fr] gap-10">
        <div>
          <div className="flex items-center gap-2.5">
            <HexLogo size={32} />
            <span className="text-lg font-bold">
              <span className="text-white">NEXUS</span>{" "}
              <span style={{ color: "var(--accent-cyan)" }}>RWA</span>
            </span>
          </div>
          <p
            className="mt-4 text-sm leading-[1.8] max-w-[240px]"
            style={{ color: "var(--text-secondary)" }}
          >
            The intelligence layer for Real World Assets on-chain.
          </p>
          <div className="mt-6 flex items-center gap-2">
            <a
              href="#"
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{ background: "var(--border-line)", color: "var(--accent-cyan)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0,212,255,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(30,42,58,0.8)";
              }}
              aria-label="GitHub"
            >
              <GithubIcon />
            </a>
            {[MessageCircle, BookOpen].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{ background: "var(--border-line)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0,212,255,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(30,42,58,0.8)";
                }}
              >
                <Icon size={16} style={{ color: "var(--accent-cyan)" }} />
              </a>
            ))}
            <a
              href="#"
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{ background: "var(--border-line)", color: "var(--accent-cyan)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0,212,255,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(30,42,58,0.8)";
              }}
              aria-label="X"
            >
              <XIcon />
            </a>
          </div>
          <div
            className="mt-5 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg"
            style={{ border: "1px solid var(--border-line)" }}
          >
            <span className="w-4 h-4 rounded-full" style={{ background: "#0052FF" }} />
            <span className="text-xs font-semibold text-white">Built on Base</span>
          </div>
        </div>
        {[
          { h: "Product", l: ["Dashboard", "API Reference", "Pricing", "Changelog", "Status"] },
          { h: "Developers", l: ["Quickstart Guide", "API Docs", "X402 Integration", "AI Agent SDK", "GitHub"] },
          { h: "Company", l: ["About Nexus RWA", "Blog", "X", "Discord", "Contact"] },
        ].map((col) => (
          <div key={col.h}>
            <h4
              className="text-[13px] font-medium uppercase tracking-wider text-white mb-4"
            >
              {col.h}
            </h4>
            <ul className="space-y-2.5">
              {col.l.map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#00D4FF")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#8892A4")}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div
        className="mt-12 pt-6 max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-[13px]"
        style={{ borderTop: "1px solid var(--border-line)", color: "var(--text-secondary)" }}
      >
        <p>© 2026 Nexus RWA. All rights reserved.</p>
        <p className="hidden md:block">Powered by X402 Protocol · Built on Base</p>
        <p>Privacy Policy · Terms of Service</p>
      </div>
    </footer>
  );
}
