"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type BlurredPreviewProps = {
  title: string;
  priceLabel?: string;
  onUnlock?: () => void;
  className?: string;
};

const SAMPLE_ROWS = [
  { label: "30D APY", value: "8.42%" },
  { label: "Volatility", value: "Low" },
  { label: "Sharpe (est.)", value: "1.24" },
  { label: "Utilization", value: "76%" },
];

export function BlurredPreview({
  title,
  priceLabel = "~0.001 ETH",
  onUnlock,
  className,
}: BlurredPreviewProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-xl border border-[rgba(30,42,58,0.8)] bg-[rgba(15,22,41,0.5)]",
        className,
      )}
    >
      <div className="border-b border-[rgba(30,42,58,0.6)] px-5 py-4">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <p className="mt-0.5 text-xs text-[#8892A4]">
          Live data setelah pembayaran X402
        </p>
      </div>

      <div className="relative min-h-[220px] p-5">
        <div className="pointer-events-none select-none blur-sm">
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SAMPLE_ROWS.map((r) => (
              <div
                key={r.label}
                className="rounded-lg border border-[rgba(30,42,58,0.6)] bg-[rgba(10,14,26,0.8)] p-3"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8892A4]">
                  {r.label}
                </p>
                <p className="mt-1 font-mono text-lg text-white">{r.value}</p>
              </div>
            ))}
          </div>
          <div className="h-24 rounded-lg bg-gradient-to-r from-[#00D4FF]/20 to-[#6366f1]/15" />
          <ul className="mt-4 space-y-2">
            {["RWA-001", "RWA-014", "RWA-022"].map((id) => (
              <li
                key={id}
                className="flex justify-between rounded-md border border-[rgba(30,42,58,0.5)] bg-[rgba(10,14,26,0.6)] px-3 py-2 text-sm text-[#8892A4]"
              >
                <span>{id}</span>
                <span className="tabular-nums text-white">$12.4M</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A0E1A] via-[#0A0E1A]/75 to-transparent"
          aria-hidden
        />

        <div className="pointer-events-auto absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-5 pb-6 pt-10">
          <motion.div
            className="flex size-12 items-center justify-center rounded-full border border-[rgba(0,212,255,0.35)] bg-[rgba(0,212,255,0.12)] text-[#00D4FF]"
            animate={{ scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Lock className="size-5" strokeWidth={2.25} aria-hidden />
          </motion.div>
          <p className="text-center text-xs font-medium uppercase tracking-wide text-[#8892A4]">
            Premium access
          </p>
          <p className="text-center font-mono text-sm text-white">{priceLabel}</p>
          <Button
            type="button"
            size="sm"
            className="bg-[#00D4FF] font-semibold text-[#0A0E1A] hover:bg-[#00D4FF]/90"
            onClick={() => onUnlock?.()}
          >
            Unlock with Crypto
          </Button>
        </div>
      </div>
    </section>
  );
}
