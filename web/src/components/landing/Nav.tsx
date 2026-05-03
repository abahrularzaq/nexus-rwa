"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { HexLogo } from "@/components/landing/primitives";

const links = ["Dashboard", "Assets", "Analytics", "API", "Pricing"];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("Dashboard");
  return (
    <>
      <header
        className="fixed top-0 inset-x-0 z-[100] h-16 border-b"
        style={{
          background: "rgba(10, 14, 26, 0.85)",
          backdropFilter: "blur(20px)",
          borderColor: "rgba(30,42,58,0.5)",
        }}
      >
        <div className="h-full max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2.5">
            <HexLogo size={28} />
            <span className="text-base font-bold tracking-tight">
              <span className="text-white">NEXUS</span>{" "}
              <span style={{ color: "var(--accent-cyan)" }}>RWA</span>
            </span>
            <span
              className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(0,212,255,0.15)",
                color: "var(--accent-cyan)",
                border: "1px solid rgba(0,212,255,0.4)",
              }}
            >
              BETA
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-8">
            {links.map((l) => (
              <button
                key={l}
                onClick={() => setActive(l)}
                className={`relative text-sm font-medium transition-colors ${
                  active === l ? "text-white" : "text-text-secondary hover:text-white"
                }`}
                style={active === l ? { color: "#fff" } : { color: "#8892A4" }}
              >
                {l}
                {active === l && (
                  <span
                    className="absolute -bottom-[22px] left-0 right-0 h-[2px]"
                    style={{ background: "var(--accent-cyan)" }}
                  />
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              className="hidden sm:inline-flex text-sm font-semibold px-5 py-2 rounded-lg transition-all"
              style={{
                border: "1px solid rgba(0,212,255,0.4)",
                color: "var(--accent-cyan)",
              }}
            >
              API Docs
            </button>
            <Link
              href="/dashboard"
              className="text-sm font-bold px-5 py-2 rounded-lg text-white transition-transform hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #00D4FF, #0099BB)",
                boxShadow: "0 0 20px rgba(0,212,255,0.35)",
              }}
            >
              Launch App →
            </Link>
            <button
              className="lg:hidden p-2 text-white"
              onClick={() => setOpen(true)}
              aria-label="menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex flex-col"
          style={{
            background: "rgba(10,14,26,0.95)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="flex justify-end p-6">
            <button onClick={() => setOpen(false)} className="text-white">
              <X size={24} />
            </button>
          </div>
          <nav className="flex flex-col items-center gap-8 mt-12">
            {links.map((l) => (
              <a
                key={l}
                href="#"
                onClick={() => setOpen(false)}
                className="text-2xl font-semibold text-white"
              >
                {l}
              </a>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
