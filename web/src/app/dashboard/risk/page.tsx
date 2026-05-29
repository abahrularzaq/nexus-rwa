"use client";

import Link from "next/link";

export default function RiskPage() {
  return (
    <div className="space-y-6 p-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-white">Risk Scoring</h1>
        <p className="mt-2 max-w-xl text-[#8892A4]">
          Composite risk scores (0–100) are computed from TVL stability, yield
          sustainability, holder count, and protocol maturity. Higher scores
          indicate lower risk.
        </p>
      </div>
      <div
        className="rounded-xl border border-[rgba(0,255,136,0.25)] p-5"
        style={{ background: "rgba(0,255,136,0.06)" }}
      >
        <p className="text-sm font-semibold text-[#00FF88]">
          GET /v1/assets/:id/risk — Free
        </p>
        <p className="mt-2 text-sm text-[#8892A4]">
          Returns <code className="text-[#00D4FF]">score</code>,{" "}
          <code className="text-[#00D4FF]">level</code>, and{" "}
          <code className="text-[#00D4FF]">factors</code>. Cached in Redis for 1
          hour. Scores refresh on the server every 6 hours.
        </p>
        <Link
          href="/dashboard/assets"
          className="mt-4 inline-flex text-sm font-semibold text-[#00D4FF] hover:underline"
        >
          Browse assets →
        </Link>
      </div>
    </div>
  );
}
