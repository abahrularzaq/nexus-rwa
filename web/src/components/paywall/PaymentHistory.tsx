"use client";

import { ExternalLink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  listStoredX402Payments,
  type StoredX402Payment,
} from "@/lib/x402-session";

function endpointDisplayName(path: string): string {
  const parts = path.split("/").filter(Boolean);
  const last = parts[parts.length - 1] ?? path;
  return last
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function basescanTxUrl(txHash: string): string {
  return `https://basescan.org/tx/${txHash}`;
}

function formatTime(ts: number | null): string {
  if (ts == null) return "—";
  return new Date(ts).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function PaymentHistory() {
  const [rows, setRows] = useState<StoredX402Payment[]>([]);

  const refresh = useCallback(() => {
    setRows(listStoredX402Payments());
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith("x402-tx:") || e.key === null) refresh();
    };
    const onCustom = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener("nexus-x402-payment", onCustom);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("nexus-x402-payment", onCustom);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-[rgba(30,42,58,0.6)] bg-[rgba(10,14,26,0.35)] px-3 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8892A4]">
          Payments
        </p>
        <p className="mt-1 text-xs text-[#8892A4]">
          Belum ada pembayaran X402 di sesi ini.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[rgba(30,42,58,0.6)] bg-[rgba(10,14,26,0.35)] px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8892A4]">
        Payments
      </p>
      <ul className="mt-2 max-h-[200px] space-y-2.5 overflow-y-auto pr-0.5">
        {rows.map((row) => (
          <li
            key={`${row.path}-${row.txHash}`}
            className="border-b border-[rgba(30,42,58,0.45)] pb-2 last:border-0 last:pb-0"
          >
            <p className="truncate text-xs font-medium text-white">
              {endpointDisplayName(row.path)}
            </p>
            <p className="mt-0.5 text-[10px] text-[#8892A4]">
              {formatTime(row.paidAt)}
            </p>
            <a
              href={basescanTxUrl(row.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[#00D4FF] hover:underline"
            >
              BaseScan
              <ExternalLink className="size-3 shrink-0 opacity-80" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
