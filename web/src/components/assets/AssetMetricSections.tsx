import type { ReactNode } from "react";
import Link from "next/link";
import { DisclaimerBanner } from "@/components/common/DisclaimerBanner";
import { MetricField, MetricGrid, MetricSection } from "@/components/common/MetricField";
import { getGradeDisclaimer } from "@/lib/disclaimers";
import type { LocalAssetMetrics } from "@/lib/local-assets";

type AssetMetricSectionsProps = {
  asset: LocalAssetMetrics;
  showHeader?: boolean;
};

function formatEnumLabel(value?: string | null): string | null {
  if (!value) return null;
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function applicabilityLabel(value?: string | null): string | null {
  if (!value) return null;
  if (value === "not_applicable") return "Not applicable";
  return formatEnumLabel(value);
}

export function AssetMetricSections({ asset, showHeader = true }: AssetMetricSectionsProps) {
  const displayName = asset.identity.name ?? asset.slug;
  const symbol = asset.identity.symbol ? ` (${asset.identity.symbol})` : "";
  const grade = asset.gradeBaseline.grade ?? "research";
  const warnings = asset.gradeBaseline.warnings ?? [];
  const blockers = asset.gradeBaseline.blockers ?? [];
  const gradeDisclaimer = getGradeDisclaimer(grade);
  const gradeContext = asset.gradeBaseline.gradeContext;
  const gradingProfile = formatEnumLabel(asset.gradeBaseline.gradingProfile);
  const claimType = formatEnumLabel(asset.gradeBaseline.claimType);
  const publicSegment = asset.gradeBaseline.publicSegment;
  const reserveApplicability = asset.gradeBaseline.applicability?.reserve;
  const isReserveNotApplicable = reserveApplicability === "not_applicable";

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
              {gradeContext ? (
                <p className="mt-3 text-sm font-semibold" style={{ color: "var(--accent-cyan)" }}>
                  {gradeContext}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Badge>{grade} grade</Badge>
              {gradingProfile ? <Badge>{gradingProfile} profile</Badge> : null}
              {publicSegment ? <Badge>{publicSegment}</Badge> : null}
              {claimType ? <Badge>Claim: {claimType}</Badge> : null}
              {asset.identity.category ? <Badge>{asset.identity.category}</Badge> : null}
              {asset.gradeBaseline.score !== undefined && asset.gradeBaseline.score !== null ? (
                <Badge>{asset.gradeBaseline.score}/100 score</Badge>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <DisclaimerBanner variant="asset" />
        <DisclaimerBanner disclaimer={gradeDisclaimer} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MetricSection title="Identity" description="Core asset identity, classification, and official references.">
          <MetricGrid columns={2}>
            <MetricField fieldKey="symbol" value={asset.identity.symbol} variant="card" />
            <MetricField fieldKey="category" value={asset.identity.category} glossarySlug="real-world-asset" variant="card" />
            <MetricField fieldKey="subcategory" value={asset.identity.subcategory} glossarySlug="underlying-asset" variant="card" />
            <MetricField fieldKey="launchDate" value={asset.identity.launchDate} variant="card" />
            <MetricField fieldKey="assetClass" label="Asset Class" value={formatEnumLabel(asset.gradeBaseline.assetClass)} glossarySlug="real-world-asset" variant="card" />
            <MetricField fieldKey="claimType" label="Claim Type" value={claimType} glossarySlug="underlying-asset" variant="card" />
          </MetricGrid>
        </MetricSection>

        <MetricSection title="Compliance" description="Investor eligibility, regulatory status, and screening signals.">
          <MetricGrid columns={2}>
            <MetricField fieldKey="kycRequired" value={asset.compliance.kycRequired} glossarySlug="kyc" variant="card" />
            <MetricField fieldKey="accreditedOnly" value={asset.compliance.accreditedOnly} glossarySlug="kyc" variant="card" />
            <MetricField fieldKey="regulatoryStatus" value={asset.compliance.regulatoryStatus} glossarySlug="prospectus" variant="card" />
            <MetricField fieldKey="sanctionsScreening" value={asset.compliance.sanctionsScreening} glossarySlug="aml" variant="card" />
          </MetricGrid>
        </MetricSection>

        <MetricSection title="Liquidity" description="Redemption access, lock-up constraints, and exit quality.">
          <MetricGrid columns={2}>
            <MetricField fieldKey="redemptionType" value={asset.liquidity.redemptionType} glossarySlug="redemption" variant="card" />
            <MetricField fieldKey="redemptionPeriodDays" value={asset.liquidity.redemptionPeriodDays} valueSuffix=" day" glossarySlug="redemption-period" variant="card" />
            <MetricField fieldKey="lockupPeriodDays" value={asset.liquidity.lockupPeriodDays} valueSuffix=" days" glossarySlug="liquidity" variant="card" />
            <MetricField fieldKey="liquidityScore" value={asset.gradeBaseline.liquidityScore ?? asset.liquidity.liquidityScore} valueSuffix=" / 100" glossarySlug="liquidity" variant="card" />
          </MetricGrid>
        </MetricSection>

        <MetricSection
          title="Reserve"
          description={isReserveNotApplicable
            ? "Reserve, custody, redemption, and proof-of-reserves are not applicable for this grading profile."
            : "Backing, custody, audit, and reserve transparency indicators."
          }
        >
          <MetricGrid columns={2}>
            <MetricField fieldKey="backingType" value={isReserveNotApplicable ? "Not applicable" : asset.reserve.backingType} glossarySlug="asset-backed-token" variant="card" />
            <MetricField fieldKey="custodian" value={isReserveNotApplicable ? "Not applicable" : asset.reserve.custodian} glossarySlug="custodian" variant="card" />
            <MetricField fieldKey="hasProofOfReserves" value={isReserveNotApplicable ? "Not applicable" : asset.reserve.hasProofOfReserves} glossarySlug="proof-of-reserves" variant="card" />
            <MetricField
              fieldKey="reserveScore"
              value={isReserveNotApplicable ? "N/A" : asset.gradeBaseline.reserveScore}
              valueSuffix={isReserveNotApplicable ? undefined : " / 100"}
              glossarySlug="reserve"
              variant="card"
            />
            <MetricField fieldKey="reserveApplicability" label="Reserve Applicability" value={applicabilityLabel(reserveApplicability)} glossarySlug="reserve" variant="card" />
            <MetricField fieldKey="gradingProfile" label="Grading Profile" value={gradingProfile} glossarySlug="institutional-grade" variant="card" />
          </MetricGrid>
        </MetricSection>

        <MetricSection title="Grading" description="Evidence quality, completeness, and final data quality signals.">
          <MetricGrid columns={2}>
            <MetricField fieldKey="sourceScore" value={asset.gradeBaseline.sourceScore} valueSuffix=" / 100" glossarySlug="risk-score" variant="card" />
            <MetricField fieldKey="completenessScore" value={asset.gradeBaseline.completenessScore} valueSuffix=" / 100" glossarySlug="risk-score" variant="card" />
            <MetricField fieldKey="riskScore" value={asset.gradeBaseline.riskScore} valueSuffix=" / 100" glossarySlug="risk-score" variant="card" />
            <MetricField fieldKey="dataQualityGrade" value={gradeContext ?? grade} glossarySlug="institutional-grade" variant="card" />
            <MetricField fieldKey="gradingProfile" label="Profile" value={gradingProfile} glossarySlug="institutional-grade" variant="card" />
            <MetricField fieldKey="publicSegment" label="Public Segment" value={publicSegment} glossarySlug="real-world-asset" variant="card" />
          </MetricGrid>
        </MetricSection>

        <MetricSection title="Review Signals" description="Blockers, warnings, baseline status, and review date.">
          <MetricGrid columns={2}>
            <MetricField fieldKey="blockers" value={blockers} glossarySlug="blocker" variant="card" emptyValue="No blockers" />
            <MetricField fieldKey="warnings" value={warnings} glossarySlug="warning" variant="card" emptyValue="No warnings" />
            <MetricField fieldKey="lastUpdated" label="Baseline Date" value={asset.gradeBaseline.baselineDate} variant="card" />
            <MetricField fieldKey="dataQualityGrade" label="Status" value={asset.gradeBaseline.status} glossarySlug="analytic-grade" variant="card" />
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
