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

export function RedactedPremiumPreview({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none select-none overflow-hidden rounded-xl border border-[rgba(30,42,58,0.85)] bg-[rgba(10,14,26,0.72)] p-4",
        className,
      )}
      aria-hidden
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="h-3 w-32 rounded-full bg-white/10" />
        <div className="h-3 w-16 rounded-full bg-[#00D4FF]/15" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-[rgba(30,42,58,0.75)] bg-[rgba(15,22,41,0.65)] px-4 py-3"
          >
            <div className="h-2.5 w-20 rounded-full bg-white/10" />
            <div className="mt-3 h-4 w-3/4 rounded-full bg-white/15" />
            <div className="mt-2 h-2.5 w-1/2 rounded-full bg-white/8" />
          </div>
        ))}
      </div>
      <div className="mt-4 h-2 rounded-full bg-white/10">
        <div className="h-full w-2/3 rounded-full bg-[#00D4FF]/20" />
      </div>
    </div>
  );
}

export function BlurredPreview({
  title,
  priceLabel = "~0.001 ETH",
  onUnlock,
  className,
}: BlurredPreviewProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-[rgba(0,212,255,0.18)] bg-[rgba(10,14,26,0.88)] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.18)]",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <motion.div
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[rgba(0,212,255,0.35)] bg-[rgba(0,212,255,0.12)] text-[#00D4FF]"
            animate={{ scale: [1, 1.04, 1], opacity: [0.88, 1, 0.88] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Lock className="size-4" strokeWidth={2.25} aria-hidden />
          </motion.div>

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8892A4]">
              Premium access
            </p>
            <h3 className="mt-1 text-sm font-bold text-white">{title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#8892A4]">
              Unlock verified premium data only when you need the full evidence layer.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:justify-end">
          <p className="font-mono text-sm font-semibold text-white">{priceLabel}</p>
          <Button
            type="button"
            size="sm"
            className="bg-[#00D4FF] font-semibold text-[#0A0E1A] hover:bg-[#00D4FF]/90"
            onClick={() => onUnlock?.()}
          >
            Unlock
          </Button>
        </div>
      </div>
    </section>
  );
}
