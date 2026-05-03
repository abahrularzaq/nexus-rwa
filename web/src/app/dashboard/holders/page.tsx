"use client";

export default function HoldersPage() {
  return (
    <div className="p-6">
      <h1 className="mb-2 text-2xl font-bold text-white">Holder Intelligence</h1>
      <p className="text-[#8892A4]">Coming soon — advanced holder analytics</p>
      <div
        className="mt-6 rounded-xl border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.05)] p-4"
      >
        <p className="text-sm text-[#00D4FF]">
          Access holder data via API: GET /v1/assets/:id/holders — $0.005 per request
        </p>
      </div>
    </div>
  );
}
