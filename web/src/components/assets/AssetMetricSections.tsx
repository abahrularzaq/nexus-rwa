import type { ReactNode } from "react";
import Link from "next/link";
import { DisclaimerBanner } from "@/components/common/DisclaimerBanner";
import { MetricField, MetricGrid, MetricSection } from "@/components/common/MetricField";
import type { LocalAssetMetrics } from "@/lib/local-assets";

type AssetMetricSectionsProps = {
  asset: LocalAssetMetrics;
  showHeader?: boolean;
};

export function AssetMetricSections({ asset, showHeader = true }: AssetMetricSectionsProps) {
  const displayName = asset.identity.name ?? asset.slug;
  const symbol = asset.identity.symbol ? ` (${asset.identity.symbol})` : "";
  const grade = asset.gradeBaseline.grade ?? "research";
  const warnings = asset.gradeBaseline.warnings ?? [];
  const blockers = asset.gradeBaseline.blockers ?? [];

  return (
    <div className="space-y-6">
      {showHeader ? (
        <div className="glass-card p-5 md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <Link href="/" className="text-sm font-semibold" style={{ color: "var(--accent-cyan)" }}>
                ← Back to home
              </Link>
              <div className="mt-5 text-sm label-eyebrow" style={{ color: "var(--text-secondary)" }}>
                Asset Detail · Local Dataset
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                {displayName}{symbol}
              </h1>
              {asset.identity.description ? (
                <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {asset.identity.description}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Badge>{grade} grade</Badge>
              {asset.identity.category ? <Badge>{asset.identity.category}</Badge> : null}
              {asset.gradeBaseline.score !== undefined && asset.gradeBaseline.score !== null ? (
                <Badge>{asset.gradeBaseline.score}/100 score</Badge>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <DisclaimerBanner variant="asset" />

      <div className="grid gap-4 lg:grid-cols-2">
        <MetricSection title="Identity" description="Core asset identity, classification, and official references.">
          <MetricGrid columns={2}>
            <MetricField fieldKey="symbol" value={asset.identity.symbol} variant="card" />
            <MetricField fieldKey="category" value={asset.identity.category} variant="card" />
            <MetricField fieldKey="subcategory" value={asset.identity.subcategory} variant="card" />
            <MetricField fieldKey="launchDate" value={asset.identity.launchDate} variant="card" />
          </MetricGrid>
        </MetricSection>

        <MetricSection title="Compliance" description="Investor eligibility, regulatory status, and screening signals.">
          <MetricGrid columns={2}>
            <MetricField fieldKey="kycRequired" value={asset.compliance.kycRequired} variant="card" />
            <MetricField fieldKey="accreditedOnly" value={asset.compliance.accreditedOnly} variant="card" />
            <MetricField fieldKey="regulatoryStatus" value={asset.compliance.regulatoryStatus} variant="card" />
            <MetricField fieldKey="sanctionsScreening" value={asset.compliance.sanctionsScreening} variant="card" />
          </MetricGrid>
        </MetricSection>

        <MetricSection title="Liquidity" description="Redemption access, lock-up constraints, and exit quality.">
          <MetricGrid columns={2}>
            <MetricField fieldKey="redemptionType" value={asset.liquidity.redemptionType} variant="card" />
            <MetricField fieldKey="redemptionPeriodDays" value={asset.liquidity.redemptionPeriodDays} valueSuffix=" day" variant="card" />
            <MetricField fieldKey="lockupPeriodDays" value={asset.liquidity.lockupPeriodDays} valueSuffix=" days" variant="card" />
            <MetricField fieldKey="liquidityScore" value={asset.gradeBaseline.liquidityScore ?? asset.liquidity.liquidityScore} valueSuffix=" / 100" variant="card" />
          </MetricGrid>
        </MetricSection>

        <MetricSection title="Reserve" description="Backing, custody, audit, and reserve transparency indicators.">
          <MetricGrid columns={2}>
            <MetricField fieldKey="backingType" value={asset.reserve.backingType} variant="card" />
            <MetricField fieldKey="custodian" value={asset.reserve.custodian} variant="card" />
            <MetricField fieldKey="hasProofOfReserves" value={asset.reserve.hasProofOfReserves} variant="card" />
            <MetricField fieldKey="reserveScore" value={asset.gradeBaseline.reserveScore} valueSuffix=" / 100" variant="card" />
          </MetricGrid>
        </MetricSection>

        <MetricSection title="Grading" description="Evidence quality, completeness, and final data quality signals.">
          <MetricGrid columns={2}>
            <MetricField fieldKey="sourceScore" value={asset.gradeBaseline.sourceScore} valueSuffix=" / 100" variant="card" />
            <MetricField fieldKey="completenessScore" value={asset.gradeBaseline.completenessScore} valueSuffix=" / 100" variant="card" />
            <MetricField fieldKey="riskScore" value={asset.gradeBaseline.riskScore} valueSuffix=" / 100" variant="card" />
            <MetricField fieldKey="dataQualityGrade" value={grade} variant="card" />
          </MetricGrid>
        </MetricSection>

        <MetricSection title="Review Signals" description="Blockers, warnings, baseline status, and review date.">
          <MetricGrid columns={2}>
            <MetricField fieldKey="blockers" value={blockers} variant="card" emptyValue="No blockers" />
            <MetricField fieldKey="warnings" value={warnings} variant="card" emptyValue="No warnings" />
            <MetricField fieldKey="lastUpdated" label="Baseline Date" value={asset.gradeBaseline.baselineDate} variant="card" />
            <MetricField fieldKey="dataQualityGrade" label="Status" value={asset.gradeBaseline.status} variant="card" />
          </MetricGrid>
        </MetricSection>
      </div>
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold capitalize"
      style={{
        background: "rgba(0,255,136,0.1)",
        color: "var(--accent-green)",
        border: "1px solid rgba(0,255,136,0.25)",
      }}
    >
      {children}
    </span>
  );
}
