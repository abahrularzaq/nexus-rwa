import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { FadeUp } from "@/components/landing/primitives";
import { DisclaimerBanner } from "@/components/common/DisclaimerBanner";
import { MetricField, MetricGrid, MetricSection } from "@/components/common/MetricField";
import { getGradeDisclaimer } from "@/lib/disclaimers";
import type { LocalAssetMetrics } from "@/lib/local-assets";

type AssetDetailMetricsPreviewProps = {
  asset: LocalAssetMetrics;
};

type ProLockedSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

function formatEnumLabel(value?: string | null): string | null {
  if (!value) return null;
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function ProLockedSection({ title, description, children }: ProLockedSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-xl">
      <MetricSection title={title} description={description}>
        {children}
      </MetricSection>
      <div
        className="absolute inset-0 flex items-center justify-center p-5 backdrop-blur-[2px]"
        style={{
          background: "linear-gradient(180deg, rgba(6,10,20,0.42), rgba(6,10,20,0.82))",
          border: "1px solid rgba(0,212,255,0.22)",
          borderRadius: "0.75rem",
        }}
      >
        <div
          className="max-w-xs rounded-xl px-4 py-3 text-center"
          style={{
            background: "rgba(15,22,41,0.92)",
            border: "1px solid rgba(0,212,255,0.35)",
            boxShadow: "0 0 28px rgba(0,212,255,0.18)",
          }}
        >
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "rgba(0,212,255,0.12)" }}>
            <Lock size={16} style={{ color: "var(--accent-cyan)" }} />
          </div>
          <div className="text-sm font-bold text-white">Pro analyst layer</div>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Unlock reserve, compliance, liquidity, source trail, and full risk evidence with Pro.
          </p>
        </div>
      </div>
    </div>
  );
}

export function AssetDetailMetricsPreview({ asset }: AssetDetailMetricsPreviewProps) {
  const displayName = asset.identity.name ?? asset.slug;
  const symbol = asset.identity.symbol ? ` (${asset.identity.symbol})` : "";
  const grade = asset.gradeBaseline.grade ?? "research";
  const gradeDisclaimer = getGradeDisclaimer(grade);
  const gradeContext = asset.gradeBaseline.gradeContext;
  const gradingProfile = formatEnumLabel(asset.gradeBaseline.gradingProfile);
  const claimType = formatEnumLabel(asset.gradeBaseline.claimType);
  const isReserveNotApplicable = asset.gradeBaseline.applicability?.reserve === "not_applicable";

  return (
    <section className="py-24 px-6">
      <div className="max-w-[1400px] mx-auto">
        <FadeUp className="mb-10 text-center">
          <span
            className="inline-block px-3 py-1 rounded-full text-[11px] label-eyebrow"
            style={{
              background: "rgba(0,212,255,0.1)",
              border: "1px solid rgba(0,212,255,0.3)",
              color: "var(--accent-cyan)",
            }}
          >
            Access-Aware Data Dictionary
          </span>
          <h2 className="mt-5 text-4xl md:text-[40px] font-extrabold tracking-tight text-gradient">
            Public Preview, Pro Evidence
          </h2>
          <p className="mt-3 text-base max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            Free users see public-safe summaries. Pro unlocks institutional layers such as compliance,
            reserve, liquidity, risk breakdown, and source trail evidence.
          </p>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="glass-card p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div>
                <div className="text-sm label-eyebrow" style={{ color: "var(--text-secondary)" }}>
                  Asset Detail Preview · Free + Pro Layers
                </div>
                <h3 className="mt-2 text-2xl font-extrabold text-white">
                  {displayName}{symbol}
                </h3>
                {gradeContext ? (
                  <p className="mt-2 text-sm font-semibold" style={{ color: "var(--accent-cyan)" }}>
                    {gradeContext}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <PreviewBadge tone="green">{grade} grade</PreviewBadge>
                {gradingProfile ? <PreviewBadge tone="cyan">{gradingProfile} profile</PreviewBadge> : null}
                {claimType ? <PreviewBadge tone="cyan">Claim: {claimType}</PreviewBadge> : null}
                <PreviewBadge tone="cyan">Pro layers locked</PreviewBadge>
              </div>
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-2">
              <DisclaimerBanner variant="asset" compact />
              <DisclaimerBanner disclaimer={gradeDisclaimer} compact />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ProLockedSection
                title="Compliance"
                description="Investor eligibility, transfer controls, and screening signals."
              >
                <MetricGrid columns={2}>
                  <MetricField fieldKey="kycRequired" value={asset.compliance.kycRequired} variant="card" />
                  <MetricField fieldKey="accreditedOnly" value={asset.compliance.accreditedOnly} variant="card" />
                  <MetricField fieldKey="regulatoryStatus" value={asset.compliance.regulatoryStatus} variant="card" />
                  <MetricField fieldKey="sanctionsScreening" value={asset.compliance.sanctionsScreening} variant="card" />
                </MetricGrid>
              </ProLockedSection>

              <ProLockedSection
                title="Liquidity"
                description="Redemption access, lock-up constraints, and exit quality."
              >
                <MetricGrid columns={2}>
                  <MetricField fieldKey="redemptionType" value={asset.liquidity.redemptionType} variant="card" />
                  <MetricField fieldKey="redemptionPeriodDays" value={asset.liquidity.redemptionPeriodDays} valueSuffix=" day" variant="card" />
                  <MetricField fieldKey="lockupPeriodDays" value={asset.liquidity.lockupPeriodDays} valueSuffix=" days" variant="card" />
                  <MetricField fieldKey="liquidityScore" value={asset.gradeBaseline.liquidityScore ?? asset.liquidity.liquidityScore} valueSuffix=" / 100" variant="card" />
                </MetricGrid>
              </ProLockedSection>

              <ProLockedSection
                title="Reserve"
                description={isReserveNotApplicable
                  ? "Reserve, custody, and PoR are not applicable for this grading profile."
                  : "Backing, custody, and reserve transparency indicators."
                }
              >
                <MetricGrid columns={2}>
                  <MetricField fieldKey="backingType" value={isReserveNotApplicable ? "Not applicable" : asset.reserve.backingType} variant="card" />
                  <MetricField fieldKey="custodian" value={isReserveNotApplicable ? "Not applicable" : asset.reserve.custodian} variant="card" />
                  <MetricField fieldKey="hasProofOfReserves" value={isReserveNotApplicable ? "Not applicable" : asset.reserve.hasProofOfReserves} variant="card" />
                  <MetricField
                    fieldKey="reserveScore"
                    value={isReserveNotApplicable ? "N/A" : asset.gradeBaseline.reserveScore}
                    valueSuffix={isReserveNotApplicable ? undefined : " / 100"}
                    variant="card"
                  />
                </MetricGrid>
              </ProLockedSection>

              <ProLockedSection
                title="Source & Grading Evidence"
                description="Evidence quality, completeness, blockers, warnings, and final data quality signals."
              >
                <MetricGrid columns={2}>
                  <MetricField fieldKey="sourceScore" value={asset.gradeBaseline.sourceScore} valueSuffix=" / 100" variant="card" />
                  <MetricField fieldKey="completenessScore" value={asset.gradeBaseline.completenessScore} valueSuffix=" / 100" variant="card" />
                  <MetricField fieldKey="riskScore" value={asset.gradeBaseline.riskScore} valueSuffix=" / 100" variant="card" />
                  <MetricField fieldKey="dataQualityGrade" value={gradeContext ?? grade} variant="card" />
                </MetricGrid>
              </ProLockedSection>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

function PreviewBadge({ children, tone }: { children: ReactNode; tone: "green" | "cyan" }) {
  const color = tone === "green" ? "var(--accent-green)" : "var(--accent-cyan)";
  const border = tone === "green" ? "rgba(0,255,136,0.25)" : "rgba(0,212,255,0.25)";
  const background = tone === "green" ? "rgba(0,255,136,0.1)" : "rgba(0,212,255,0.1)";

  return (
    <div
      className="inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold capitalize"
      style={{ background, color, border: `1px solid ${border}` }}
    >
      {children}
    </div>
  );
}
