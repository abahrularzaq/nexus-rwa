"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-28 pb-20 px-6">
      {/* dot grid */}
      <div className="absolute inset-0 dot-grid pointer-events-none" />
      {/* orbs */}
      <div
        className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(0,212,255,0.08), transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(124,58,237,0.08), transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: "rgba(0,212,255,0.04)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative max-w-[820px] mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[13px]"
          style={{
            background: "rgba(0,212,255,0.08)",
            border: "1px solid rgba(0,212,255,0.25)",
            color: "var(--text-secondary)",
          }}
        >
          <span
            className="w-2 h-2 rounded-full pulse-dot"
            style={{ background: "var(--accent-green)" }}
          />
          RWA Intelligence · Evidence-based · API preview
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-8 font-extrabold tracking-[-0.03em] leading-[1.05]"
        >
          <span className="block text-gradient-cyan text-[42px] md:text-[64px] lg:text-[72px]">
            The Intelligence Layer
          </span>
          <span className="block text-gradient-cp text-[42px] md:text-[64px] lg:text-[72px]">
            for Real World Assets
          </span>
          <span
            className="block text-[36px] md:text-[48px] lg:text-[56px] mt-1"
            style={{
              color: "var(--accent-cyan)",
              textShadow: "0 0 40px rgba(0,212,255,0.5)",
            }}
          >
            On-Chain.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 max-w-[640px] mx-auto text-[18px] leading-[1.7]"
          style={{ color: "var(--text-secondary)" }}
        >
          Structured RWA intelligence for investors, builders, and AI agents —
          covering reserves, compliance, liquidity, yield, risk scoring, and
          source credibility in one evidence-based dataset.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/dashboard"
            className="px-9 py-3.5 rounded-[10px] text-white font-bold text-base transition-transform hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #00D4FF 0%, #7C3AED 100%)",
              boxShadow:
                "0 0 40px rgba(0,212,255,0.4), 0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            Explore Dashboard →
          </Link>
          <Link
            href="/methodology"
            className="px-9 py-3.5 rounded-[10px] font-semibold text-base transition-colors"
            style={{
              border: "1px solid rgba(0,212,255,0.4)",
              color: "var(--accent-cyan)",
            }}
          >
            View Methodology
          </Link>
        </motion.div>

        <p
          className="mt-5 text-[13px]"
          style={{ color: "var(--text-muted)", letterSpacing: "0.02em" }}
        >
          Public preview · x402/API-key MVP · Ask Nexus beta
        </p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 flex items-stretch justify-center gap-8 md:gap-14 text-center"
        >
          {[
            { v: "12", l: "Data Layers" },
            { v: "Evidence", l: "Based Scoring" },
            { v: "API", l: "Preview Access" },
          ].map((s, i) => (
            <div key={s.l} className="flex items-center gap-8 md:gap-14">
              <div>
                <div className="text-2xl md:text-3xl font-bold tabular text-white">
                  {s.v}
                </div>
                <div
                  className="text-xs md:text-[13px] mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {s.l}
                </div>
              </div>
              {i < 2 && (
                <div
                  className="hidden md:block w-px h-10 self-center"
                  style={{ background: "var(--border-line)" }}
                />
              )}
            </div>
          ))}
        </motion.div>
      </div>

      {/* floating asset profile card */}
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="hidden xl:block absolute right-8 top-1/2 -translate-y-1/2 w-[240px] float-card"
        style={{
          background: "rgba(10,14,26,0.95)",
          border: "1px solid rgba(0,212,255,0.35)",
          borderRadius: 16,
          padding: 20,
          boxShadow:
            "0 0 40px rgba(0,212,255,0.2), 0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-white font-bold text-xs">RWA ASSET PROFILE</span>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{
              background: "rgba(0,212,255,0.1)",
              color: "var(--accent-cyan)",
            }}
          >
            SAMPLE
          </span>
        </div>
        <div className="my-3 h-px" style={{ background: "var(--border-line)" }} />
        <div className="space-y-3">
          {[
            { label: "Reserve Layer", value: "Source-backed" },
            { label: "Compliance", value: "Reviewed" },
            { label: "Risk Grade", value: "Analytics" },
            { label: "Source Confidence", value: "High" },
          ].map((item) => (
            <div key={item.label}>
              <div
                className="text-[10px] uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                {item.label}
              </div>
              <div
                className="text-sm font-bold tabular mt-0.5"
                style={{ color: "var(--accent-green)" }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
        <div
          className="mt-3 text-[10px] italic"
          style={{ color: "var(--text-muted)" }}
        >
          Example intelligence card
        </div>
      </motion.div>
    </section>
  );
}
