"use client";

import { AlertTriangle, Minus, Sparkles, TrendingUp } from "lucide-react";
import { BlurredPreview } from "@/components/paywall/BlurredPreview";
import { PaywallGuard } from "@/components/paywall/PaywallGuard";
import type { ApiResponse, AssetInsight } from "@/lib/shared";

const OUTLOOK_STYLES: Record<
  AssetInsight["outlook"],
  { label: string; className: string; Icon: typeof Minus }
> = {
  bullish: {
    label: "Positive",
    className:
      "border-[rgba(61,154,110,0.4)] bg-[rgba(61,154,110,0.12)] text-[var(--data-positive)]",
    Icon: TrendingUp,
  },
  neutral: {
    label: "Neutral",
    className:
      "border-[var(--border-panel)] bg-[var(--bg-panel)] text-[var(--text-secondary)]",
    Icon: Minus,
  },
  bearish: {
    label: "Cautious",
    className:
      "border-[rgba(196,92,92,0.4)] bg-[rgba(196,92,92,0.12)] text-[var(--data-negative)]",
    Icon: AlertTriangle,
  },
};

function formatHoursAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.max(0, Math.floor(ms / (60 * 60 * 1000)));
  if (hours < 1) return "less than 1 hour ago";
  if (hours === 1) return "1 hour ago";
  return `${hours} hours ago`;
}

function BulletList({
  items,
  dotClassName,
}: {
  items: string[];
  dotClassName: string;
}) {
  return (
    <ul className="space-y-1.5 text-sm text-[var(--text-secondary)]">
      {items.map((item) => (
        <li key={item} className="flex gap-2 leading-snug">
          <span
            className={`mt-2 size-1 shrink-0 rounded-full ${dotClassName}`}
            aria-hidden
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function MockInsightBlurred() {
  return (
    <div className="pointer-events-none select-none space-y-4 blur-[4px]">
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-7 w-24 rounded border border-[var(--border-panel)] bg-[var(--bg-panel)]" />
        <div className="h-4 w-32 rounded bg-[rgba(30,42,58,0.85)]" />
      </div>
      <p className="text-sm text-[var(--text-secondary)]">
        This asset provides tokenized exposure to a real-world financial instrument.
        The full insight explains structure, risk, fit, and missing evidence…
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
          <li>Evidence-backed asset summary</li>
          <li>Key strengths and investor fit</li>
        </ul>
        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
          <li>Main risk factors</li>
          <li>Missing evidence to verify</li>
        </ul>
      </div>
    </div>
  );
}

function InsightContent({ insight }: { insight: AssetInsight }) {
  const outlook = OUTLOOK_STYLES[insight.outlook];
  const OutlookIcon = outlook.Icon;
  const whatChanged = insight.whatChanged ?? [];
  const watchList = insight.watchList ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${outlook.className}`}
        >
          <OutlookIcon className="size-3" aria-hidden />
          {outlook.label}
        </span>
        <span className="terminal-label">
          Data confidence <span className="text-[var(--text-primary)]">{insight.confidence}</span>
        </span>
      </div>

      <div>
        <p className="terminal-label mb-2">Summary</p>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          {insight.summary}
        </p>
      </div>

      {whatChanged.length > 0 ? (
        <div>
          <p className="terminal-label mb-2">What changed</p>
          <BulletList items={whatChanged} dotClassName="bg-[var(--accent-amber)]" />
        </div>
      ) : null}

      {watchList.length > 0 ? (
        <div>
          <p className="terminal-label mb-2">Watch / missing evidence</p>
          <BulletList items={watchList} dotClassName="bg-[var(--text-label)]" />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="terminal-panel p-4">
          <h3 className="terminal-label mb-3">Key strengths</h3>
          <BulletList items={insight.opportunities} dotClassName="bg-[var(--data-positive)]" />
        </div>
        <div className="terminal-panel p-4">
          <h3 className="terminal-label mb-3">Key risks</h3>
          <BulletList items={insight.risks} dotClassName="bg-[var(--data-negative)]" />
        </div>
      </div>

      <p className="border-t border-[var(--border-panel)] pt-3 text-xs leading-relaxed text-[var(--text-secondary)]">
        This insight is generated from Nexus RWA asset data and is not financial advice.
      </p>
      <p className="terminal-label">
        Updated {formatHoursAgo(insight.generatedAt)}
      </p>
    </div>
  );
}

export type AIInsightCardProps = {
  apiBaseUrl: string;
  assetId: string;
};

export function AIInsightCard({ apiBaseUrl, assetId }: AIInsightCardProps) {
  const base = apiBaseUrl.trim().replace(/\/$/, "");
  const endpoint = `${base}/v1/assets/${assetId}/insight`;

  return (
    <section className="terminal-panel p-6">
      <div className="mb-5 flex items-center gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-lg border border-[var(--border-panel)] bg-[var(--bg-panel)]"
          aria-hidden
        >
          <Sparkles className="size-5 text-[var(--accent-amber)]" />
        </div>
        <div>
          <p className="terminal-label text-[var(--accent-cyan)]">Nexus AI Insight</p>
          <h2 className="mt-1 text-lg font-bold text-white">Asset Intelligence Summary</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Evidence-aware strengths, risks, investor fit, and missing data
          </p>
        </div>
      </div>

      <PaywallGuard
        endpoint={endpoint}
        fallback={({ openPaywall }) => (
          <div className="space-y-4">
            <MockInsightBlurred />
            <BlurredPreview
              title="Nexus AI Insight"
              priceLabel="Pro — $0.001 ETH"
              onUnlock={openPaywall}
            />
            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
              Unlock Pro to view the full asset summary, key strengths, key risks,
              investor fit, data confidence, and missing evidence.
            </p>
          </div>
        )}
      >
        {(payload) => {
          const body = payload as ApiResponse<AssetInsight>;
          if (
            !body ||
            typeof body !== "object" ||
            !("success" in body) ||
            !body.success
          ) {
            return (
              <p className="text-sm text-[var(--text-secondary)]">
                Insight unavailable, try again later
              </p>
            );
          }
          return <InsightContent insight={body.data} />;
        }}
      </PaywallGuard>
    </section>
  );
}
