import type { LocalAssetMetrics } from "@/lib/local-assets";

type AssetAiInsightCardProps = {
  asset: LocalAssetMetrics;
  hasProAccess?: boolean;
  onUnlockClick?: () => void;
};

function confidenceLabel(value?: string | null): string {
  if (!value) return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function confidenceClass(value?: string | null): string {
  if (value === "high") {
    return "border-[rgba(0,255,136,0.25)] bg-[rgba(0,255,136,0.1)] text-[var(--accent-green)]";
  }

  if (value === "low") {
    return "border-[rgba(196,92,92,0.35)] bg-[rgba(196,92,92,0.12)] text-[var(--data-negative)]";
  }

  return "border-[rgba(255,193,7,0.28)] bg-[rgba(255,193,7,0.1)] text-[var(--accent-amber)]";
}

export function AssetAiInsightCard({
  asset,
  hasProAccess = true,
  onUnlockClick,
}: AssetAiInsightCardProps) {
  const insight = asset.aiInsight;
  const hasInsight = Boolean(insight?.summary || insight?.whatThisAssetIs);

  if (!hasInsight) {
    return null;
  }

  const locked = insight.accessTier === "pro" && !hasProAccess;
  const preview = insight.summary ?? "Nexus AI Insight is available for this asset.";

  if (locked) {
    return (
      <section className="glass-card overflow-hidden p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="label-eyebrow text-sm" style={{ color: "var(--accent-cyan)" }}>
              Nexus AI Insight
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white">
              Asset intelligence is available for Pro users
            </h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {preview}
            </p>
          </div>

          <span className="inline-flex w-fit rounded-full border border-[rgba(255,193,7,0.28)] bg-[rgba(255,193,7,0.1)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--accent-amber)]">
            Pro
          </span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[
            "Key strengths",
            "Key risks",
            "Investor fit",
            "Missing evidence",
          ].map((item) => (
            <div
              key={item}
              className="rounded-xl border border-[var(--border-panel)] bg-[rgba(8,13,20,0.5)] p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                {item}
              </p>
              <div className="mt-3 space-y-2">
                <div className="h-2 rounded bg-[rgba(255,255,255,0.12)]" />
                <div className="h-2 w-4/5 rounded bg-[rgba(255,255,255,0.08)]" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-[var(--border-panel)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Unlock Pro to view full strengths, risks, investor fit, confidence, and missing evidence.
          </p>
          <button
            type="button"
            onClick={onUnlockClick}
            className="inline-flex w-fit rounded-lg border border-[var(--accent-amber)]/40 bg-[var(--accent-amber-dim)] px-4 py-2 text-sm font-semibold text-[var(--accent-amber)] transition hover:bg-[var(--accent-amber)]/20"
          >
            Unlock Pro Insight
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="glass-card p-5 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-4xl">
          <p className="label-eyebrow text-sm" style={{ color: "var(--accent-cyan)" }}>
            Nexus AI Insight
          </p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white">
            Asset Intelligence Summary
          </h2>
          {insight.summary ? (
            <p className="mt-3 text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {insight.summary}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <span
            className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${confidenceClass(
              insight.dataConfidence,
            )}`}
          >
            {confidenceLabel(insight.dataConfidence)} confidence
          </span>
          {insight.accessTier ? (
            <span className="inline-flex w-fit rounded-full border border-[rgba(255,193,7,0.28)] bg-[rgba(255,193,7,0.1)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--accent-amber)]">
              {insight.accessTier}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <InsightTextBlock title="What this asset is" value={insight.whatThisAssetIs} />
        <InsightTextBlock title="Why it matters" value={insight.whyItMatters} />
        <InsightListBlock title="Key strengths" items={insight.keyStrengths} tone="positive" />
        <InsightListBlock title="Key risks" items={insight.keyRisks} tone="risk" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <InsightTextBlock title="Investor fit" value={insight.investorFit} />
        <InsightListBlock title="Missing evidence" items={insight.missingEvidence} tone="warning" emptyValue="No missing evidence listed." />
      </div>

      {insight.watchReason ? (
        <div className="mt-4 rounded-xl border border-[rgba(255,193,7,0.22)] bg-[rgba(255,193,7,0.08)] p-4">
          <p className="label-eyebrow text-xs" style={{ color: "var(--accent-amber)" }}>
            Watch reason
          </p>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {insight.watchReason}
          </p>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-2 border-t border-[var(--border-panel)] pt-4 text-xs md:flex-row md:items-center md:justify-between">
        <p style={{ color: "var(--text-secondary)" }}>
          This insight is generated from Nexus RWA asset data and is not financial advice.
        </p>
        {insight.lastUpdated ? (
          <p className="font-mono uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
            Updated {insight.lastUpdated}
          </p>
        ) : null}
      </div>
    </section>
  );
}

type InsightTextBlockProps = {
  title: string;
  value?: string | null;
};

function InsightTextBlock({ title, value }: InsightTextBlockProps) {
  if (!value) return null;

  return (
    <div className="rounded-xl border border-[var(--border-panel)] bg-[rgba(8,13,20,0.5)] p-4">
      <p className="label-eyebrow text-xs" style={{ color: "var(--text-secondary)" }}>
        {title}
      </p>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {value}
      </p>
    </div>
  );
}

type InsightListBlockProps = {
  title: string;
  items?: string[];
  tone?: "positive" | "risk" | "warning";
  emptyValue?: string;
};

function InsightListBlock({
  title,
  items,
  tone = "positive",
  emptyValue = "No items listed.",
}: InsightListBlockProps) {
  const bulletClass =
    tone === "positive"
      ? "bg-[var(--accent-green)]"
      : tone === "risk"
        ? "bg-[var(--data-negative)]"
        : "bg-[var(--accent-amber)]";

  return (
    <div className="rounded-xl border border-[var(--border-panel)] bg-[rgba(8,13,20,0.5)] p-4">
      <p className="label-eyebrow text-xs" style={{ color: "var(--text-secondary)" }}>
        {title}
      </p>
      {items && items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          {items.map((item) => (
            <li key={item} className="flex gap-2 leading-relaxed">
              <span className={`mt-2 size-1.5 shrink-0 rounded-full ${bulletClass}`} aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
          {emptyValue}
        </p>
      )}
    </div>
  );
}
