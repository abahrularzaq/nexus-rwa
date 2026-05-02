import { FadeUp, HexLogo } from "./primitives";
import { Twitter, Github, MessageCircle, BookOpen } from "lucide-react";

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
            {[Twitter, Github, MessageCircle, BookOpen].map((Icon, i) => (
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
          { h: "Company", l: ["About Nexus RWA", "Blog", "Twitter", "Discord", "Contact"] },
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
