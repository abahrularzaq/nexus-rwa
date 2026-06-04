export type DisclaimerVariant =
  | "global"
  | "asset"
  | "grade"
  | "research"
  | "analytics"
  | "institutional";

export type DisclaimerTone = "neutral" | "warning" | "success";

export type DisclaimerDefinition = {
  title: string;
  body: string;
  tone: DisclaimerTone;
  bullets?: string[];
};

export const DISCLAIMERS = {
  global: {
    title: "Informational Data Only",
    body:
      "Nexus RWA provides research, analytics, and structured public data about real-world asset products for informational purposes only. Nothing on this platform constitutes financial, investment, legal, tax, accounting, or regulatory advice.",
    tone: "neutral",
    bullets: [
      "Users should conduct their own due diligence before making any decision.",
      "Data may be incomplete, delayed, inaccurate, or change after publication.",
      "Scores and grades represent Nexus RWA data-quality methodology, not recommendations to buy, sell, hold, or invest.",
    ],
  },
  asset: {
    title: "Asset Profile Disclaimer",
    body:
      "This asset profile is based on publicly available sources, structured datasets, and Nexus RWA methodology. It should not be treated as a recommendation, endorsement, legal opinion, or assurance of asset safety.",
    tone: "warning",
    bullets: [
      "Verify issuer documents, legal terms, reserve reports, and contract addresses independently.",
      "Missing fields are intentionally left blank or marked unavailable rather than estimated.",
      "Asset profiles may include AI-assisted research but require manual review before institutional-grade use.",
    ],
  },
  grade: {
    title: "Data Quality Grade, Not Investment Rating",
    body:
      "Nexus RWA grades describe the quality, completeness, and review status of available data. They are not credit ratings, investment ratings, risk guarantees, or regulatory approvals.",
    tone: "neutral",
    bullets: [
      "Research grade means preliminary coverage with unresolved gaps.",
      "Analytics grade means usable comparative data with key-field review.",
      "Institutional grade means stronger public evidence and manual review, but still not investment advice.",
    ],
  },
  research: {
    title: "Research Grade Disclaimer",
    body:
      "Research-grade profiles are preliminary and may include incomplete, AI-assisted, or unverified fields. They are useful for discovery but should not be relied on for institutional due diligence.",
    tone: "warning",
    bullets: [
      "Expect missing legal, reserve, liquidity, or source fields.",
      "Treat scores as preliminary until manual review is completed.",
    ],
  },
  analytics: {
    title: "Analytics Grade Disclaimer",
    body:
      "Analytics-grade profiles contain enough structured data for monitoring and comparison, but may still lack full legal, reserve, or institutional review.",
    tone: "neutral",
    bullets: [
      "Use for comparative analytics, not final investment decisions.",
      "Review source quality and unresolved warnings before relying on the data.",
    ],
  },
  institutional: {
    title: "Institutional Grade Disclaimer",
    body:
      "Institutional-grade profiles have stronger source coverage and manual review, but they still represent public-data research and methodology, not investment, legal, tax, accounting, or regulatory advice.",
    tone: "success",
    bullets: [
      "Institutional grade does not mean the asset is risk-free.",
      "Users should still verify current issuer, legal, reserve, and market disclosures.",
    ],
  },
} as const satisfies Record<DisclaimerVariant, DisclaimerDefinition>;

export function getDisclaimer(variant: DisclaimerVariant) {
  return DISCLAIMERS[variant];
}

export function getGradeDisclaimer(grade?: string | null) {
  const normalizedGrade = grade?.toLowerCase();

  if (normalizedGrade === "institutional") return DISCLAIMERS.institutional;
  if (normalizedGrade === "analytics" || normalizedGrade === "analytic") return DISCLAIMERS.analytics;
  return DISCLAIMERS.research;
}
