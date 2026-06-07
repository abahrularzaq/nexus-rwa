"use client";

import { Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AccessTier } from "@/types/x402";

type FeatureRow = { label: string; free: boolean; pro: boolean; enterprise: boolean };

const FEATURES: FeatureRow[] = [
  { label: "TVL & market overview", free: true, pro: true, enterprise: true },
  { label: "Market Brief (AI narrative)", free: true, pro: true, enterprise: true },
  { label: "Asset list & search", free: true, pro: true, enterprise: true },
  { label: "Basic yield snapshot", free: true, pro: true, enterprise: true },
  { label: "Risk level (LOW / MEDIUM / HIGH)", free: true, pro: true, enterprise: true },
  { label: "AI asset insight (per asset)", free: false, pro: true, enterprise: true },
  { label: "Yield history (time series)", free: false, pro: true, enterprise: true },
  { label: "Risk score & factor breakdown", free: false, pro: true, enterprise: true },
  { label: "Holder intelligence", free: false, pro: true, enterprise: true },
  { label: "Raw API access", free: false, pro: false, enterprise: true },
  { label: "Bulk export & all assets", free: false, pro: false, enterprise: true },
  { label: "Priority RPC", free: false, pro: false, enterprise: true },
];

const TIERS: {
  id: AccessTier;
  name: string;
  price: string;
  duration: string;
  badge?: string;
}[] = [
  { id: "free", name: "Free", price: "0", duration: "" },
  {
    id: "pro",
    name: "Pro",
    price: "3.00",
    duration: "24h",
    badge: "POPULAR",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "29.00",
    duration: "7d",
  },
];

function CellIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <Check className="size-4 text-emerald-500" aria-hidden />
  ) : (
    <X className="size-4 text-muted-foreground/50" aria-hidden />
  );
}

export type TierComparisonProps = {
  /** Tier required by the endpoint the user tried to access. */
  requiredTier?: AccessTier;
  onSelectTier?: (tier: "pro" | "enterprise") => void;
  className?: string;
};

export function TierComparison({
  requiredTier = "pro",
  onSelectTier,
  className,
}: TierComparisonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <p className="text-sm text-muted-foreground">
        Session-based access: pay once in USDC through x402, unlock all endpoints
        in that tier until expiry.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {TIERS.map((t) => {
          const highlighted =
            t.id !== "free" &&
            (requiredTier === t.id ||
              (requiredTier === "enterprise" && t.id === "enterprise") ||
              (requiredTier === "pro" && t.id === "pro"));

          return (
            <div
              key={t.id}
              className={cn(
                "relative flex flex-col rounded-xl border p-4 transition-colors",
                highlighted
                  ? "border-primary/60 bg-primary/5 ring-1 ring-primary/30"
                  : "border-border/80 bg-muted/20",
              )}
            >
              {t.badge ? (
                <Badge
                  variant="secondary"
                  className="absolute -top-2.5 right-3 text-[10px]"
                >
                  {t.badge}
                </Badge>
              ) : null}
              {highlighted && requiredTier === t.id ? (
                <Badge className="absolute -top-2.5 left-3 text-[10px]">
                  Required
                </Badge>
              ) : null}

              <h3 className="text-sm font-semibold">{t.name}</h3>
              <p className="mt-2 font-mono text-2xl font-bold tabular-nums">
                {t.id === "free" ? (
                  "Free"
                ) : (
                  <>
                    {t.price}{" "}
                    <span className="text-base font-normal text-muted-foreground">
                      USDC
                    </span>
                  </>
                )}
              </p>
              {t.duration ? (
                <p className="text-xs text-muted-foreground">
                  per session · {t.duration}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">forever</p>
              )}

              <ul className="mt-4 flex-1 space-y-2 text-xs">
                {FEATURES.map((f) => {
                  const ok =
                    t.id === "free"
                      ? f.free
                      : t.id === "pro"
                        ? f.pro
                        : f.enterprise;
                  return (
                    <li key={f.label} className="flex items-start gap-2">
                      <CellIcon ok={ok} />
                      <span
                        className={cn(
                          !ok && "text-muted-foreground line-through",
                        )}
                      >
                        {f.label}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {t.id !== "free" && onSelectTier ? (
                <Button
                  type="button"
                  size="sm"
                  className="mt-4 w-full"
                  variant={highlighted ? "default" : "outline"}
                  onClick={() => onSelectTier(t.id as "pro" | "enterprise")}
                >
                  {t.id === "pro" ? "Get Pro" : "Get Enterprise"}
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
