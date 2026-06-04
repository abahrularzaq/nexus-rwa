"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useAccount } from "wagmi";

import { PaywallModal } from "@/components/paywall/PaywallModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  clearStoredX402Tx,
  readStoredX402Tx,
  writeStoredX402Tx,
} from "@/lib/x402-session";
import {
  parseX402Response,
  type AccessTier,
  type X402Details,
} from "@/types/x402";

function resolveEndpointUrl(endpoint: string): string {
  if (typeof window === "undefined") return endpoint;
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${window.location.origin}${path}`;
}

function PaywallSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/40 p-6">
      <Skeleton className="h-7 w-2/3 max-w-sm" />
      <Skeleton className="h-28 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
  );
}

export type PaywallGuardFallbackContext = {
  openPaywall: () => void;
};

export type PaywallGuardProps = {
  endpoint: string;
  fallback?:
    | ReactNode
    | ((ctx: PaywallGuardFallbackContext) => ReactNode);
  children: ReactNode | ((data: unknown) => ReactNode);
};

type GuardStatus = "loading" | "gated" | "unlocked" | "error";

export function PaywallGuard({
  endpoint,
  fallback,
  children,
}: PaywallGuardProps) {
  const { address } = useAccount();
  const [status, setStatus] = useState<GuardStatus>("loading");
  const [payload, setPayload] = useState<unknown>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [x402, setX402] = useState<X402Details | null>(null);
  const [requiredTier, setRequiredTier] = useState<AccessTier>("pro");
  const [modalOpen, setModalOpen] = useState(false);

  const openPaywall = useCallback(() => setModalOpen(true), []);

  const fetchResource = useCallback(
    async (paymentTxHeader?: string | null) => {
      setStatus("loading");
      setErrorMsg(null);

      const url = resolveEndpointUrl(endpoint);
      const headers = new Headers({ Accept: "application/json" });
      if (paymentTxHeader) {
        headers.set("X-Payment-Tx", paymentTxHeader);
      }
      if (address) {
        headers.set("X-Wallet-Address", address);
      }

      try {
        const res = await fetch(url, {
          headers,
          credentials: "omit",
        });

        if (res.status === 402) {
          if (paymentTxHeader) {
            clearStoredX402Tx(endpoint);
          }
          const body: unknown = await res.json().catch(() => null);
          const parsed = parseX402Response(body, endpoint);
          if (parsed) {
            setX402(parsed.x402);
            setRequiredTier(
              parsed.tier?.tier ??
                parsed.x402.tier ??
                (parsed.x402.price === "0.01" ? "enterprise" : "pro"),
            );
            // Keep gated content visible without interrupting the user.
            // The payment modal should only open after an explicit click.
            setModalOpen(false);
            setPayload(null);
            setStatus("gated");
            return;
          }
          setErrorMsg("Respons 402 tidak berisi metadata X402 yang valid.");
          setStatus("error");
          return;
        }

        if (!res.ok) {
          setErrorMsg(`Permintaan gagal (${res.status}).`);
          setStatus("error");
          return;
        }

        const contentType = res.headers.get("content-type");
        let data: unknown = null;
        if (contentType?.includes("application/json")) {
          data = await res.json().catch(() => null);
        } else {
          data = await res.text();
        }

        setPayload(data);
        setX402(null);
        setModalOpen(false);
        setStatus("unlocked");
      } catch (e) {
        setErrorMsg(
          e instanceof Error ? e.message : "Gagal menghubungi server.",
        );
        setStatus("error");
      }
    },
    [endpoint, address],
  );

  useEffect(() => {
    const stored = readStoredX402Tx(endpoint);
    const t = window.setTimeout(() => {
      void fetchResource(stored);
    }, 0);
    return () => window.clearTimeout(t);
  }, [endpoint, fetchResource]);

  const onPaymentSuccess = useCallback(
    (txHash: string) => {
      writeStoredX402Tx(endpoint, txHash);
      setModalOpen(false);
      void fetchResource(txHash);
    },
    [endpoint, fetchResource],
  );

  if (status === "error") {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {errorMsg ?? "Terjadi kesalahan."}
      </div>
    );
  }

  if (status === "unlocked") {
    return typeof children === "function"
      ? children(payload)
      : children;
  }

  const renderShell = () => {
    if (typeof fallback === "function") {
      return fallback({ openPaywall });
    }
    return fallback ?? <PaywallSkeleton />;
  };

  return (
    <>
      <div className="space-y-3">
        {renderShell()}
        {status === "gated" && !modalOpen && typeof fallback !== "function" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={openPaywall}
          >
            Tampilkan pembayaran
          </Button>
        ) : null}
      </div>
      {x402 ? (
        <PaywallModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          x402Data={x402}
          requiredTier={requiredTier}
          onPaymentSuccess={onPaymentSuccess}
        />
      ) : null}
    </>
  );
}
