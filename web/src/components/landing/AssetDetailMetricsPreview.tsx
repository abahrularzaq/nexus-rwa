import { FadeUp } from "@/components/landing/primitives";
import { MetricField, MetricGrid, MetricSection } from "@/components/common/MetricField";

const sampleAsset = {
  name: "Franklin BENJI",
  dataQualityGrade: "institutional",
  kycRequired: true,
  accreditedOnly: false,
  transferRestricted: true,
  sanctionsScreening: true,
  redemptionType: "Issuer-supported",
  redemptionPeriodDays: 1,
  lockupPeriodDays: null,
  liquidityScore: 80,
  backingType: "Money Market Fund",
  custodian: "Qualified custodian / fund infrastructure",
  hasProofOfReserves: false,
  reserveScore: 90,
  sourceScore: 97,
  completenessScore: 100,
  riskScore: 88,
};

export function AssetDetailMetricsPreview() {
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
            Data Dictionary
          </span>
          <h2 className="mt-5 text-4xl md:text-[40px] font-extrabold tracking-tight text-gradient">
            Every Parameter, Explained
          </h2>
          <p className="mt-3 text-base max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            Metric labels include built-in explanations so users can understand compliance, reserve,
            liquidity, and grading signals without leaving the dashboard.
          </p>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="glass-card p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div>
                <div className="text-sm label-eyebrow" style={{ color: "var(--text-secondary)" }}>
                  Asset Detail Preview
                </div>
                <h3 className="mt-2 text-2xl font-extrabold text-white">{sampleAsset.name}</h3>
              </div>
              <div
                className="inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold capitalize"
                style={{
                  background: "rgba(0,255,136,0.1)",
                  color: "var(--accent-green)",
                  border: "1px solid rgba(0,255,136,0.25)",
                }}
              >
                {sampleAsset.dataQualityGrade} grade
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <MetricSection
                title="Compliance"
                description="Investor eligibility, transfer controls, and screening signals."
              >
                <MetricGrid columns={2}>
                  <MetricField fieldKey="kycRequired" value={sampleAsset.kycRequired} variant="card" />
                  <MetricField fieldKey="accreditedOnly" value={sampleAsset.accreditedOnly} variant="card" />
                  <MetricField fieldKey="transferRestricted" value={sampleAsset.transferRestricted} variant="card" />
                  <MetricField fieldKey="sanctionsScreening" value={sampleAsset.sanctionsScreening} variant="card" />
                </MetricGrid>
              </MetricSection>

              <MetricSection
                title="Liquidity"
                description="Redemption access, lock-up constraints, and exit quality."
              >
                <MetricGrid columns={2}>
                  <MetricField fieldKey="redemptionType" value={sampleAsset.redemptionType} variant="card" />
                  <MetricField fieldKey="redemptionPeriodDays" value={sampleAsset.redemptionPeriodDays} valueSuffix=" day" variant="card" />
                  <MetricField fieldKey="lockupPeriodDays" value={sampleAsset.lockupPeriodDays} valueSuffix=" days" variant="card" />
                  <MetricField fieldKey="liquidityScore" value={sampleAsset.liquidityScore} valueSuffix=" / 100" variant="card" />
                </MetricGrid>
              </MetricSection>

              <MetricSection
                title="Reserve"
                description="Backing, custody, and reserve transparency indicators."
              >
                <MetricGrid columns={2}>
                  <MetricField fieldKey="backingType" value={sampleAsset.backingType} variant="card" />
                  <MetricField fieldKey="custodian" value={sampleAsset.custodian} variant="card" />
                  <MetricField fieldKey="hasProofOfReserves" value={sampleAsset.hasProofOfReserves} variant="card" />
                  <MetricField fieldKey="reserveScore" value={sampleAsset.reserveScore} valueSuffix=" / 100" variant="card" />
                </MetricGrid>
              </MetricSection>

              <MetricSection
                title="Grading"
                description="Evidence quality, completeness, and final data quality signals."
              >
                <MetricGrid columns={2}>
                  <MetricField fieldKey="sourceScore" value={sampleAsset.sourceScore} valueSuffix=" / 100" variant="card" />
                  <MetricField fieldKey="completenessScore" value={sampleAsset.completenessScore} valueSuffix=" / 100" variant="card" />
                  <MetricField fieldKey="riskScore" value={sampleAsset.riskScore} valueSuffix=" / 100" variant="card" />
                  <MetricField fieldKey="dataQualityGrade" value={sampleAsset.dataQualityGrade} variant="card" />
                </MetricGrid>
              </MetricSection>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
