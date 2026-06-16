"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useAccount } from "wagmi";

import { PaywallModal } from "@/components/paywall/PaywallModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trackPaymentEvent } from "@/lib/payment-events";
import { clearStoredX402Tx } from "@/lib/x402-session";
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

function resolveSessionUrl(wallet: string): string {
  if (typeof window === "undefined") return `/session?wallet=${wallet}`;
  return `${window.location.origin}/session?wallet=${wallet}`;
}

type WalletSessionInfo = {
  active: boolean;
  tier?: AccessTier;
  expiresAt?: string | null;
};

async function getActiveWalletSession(
  wallet: string,
): Promise<WalletSessionInfo> {
  try {
    const res = await fetch(resolveSessionUrl(wallet), {
      headers: {
        Accept: "application/json",
        "X-Wallet-Address": wallet,
      },
      credentials: "omit",
    });
    if (!res.ok) return { active: false };
    const body = (await res.json().catch(() => null)) as {
      data?: {
        active?: boolean;
        tier?: string;
        expiresAt?: string | null;
        expires_at?: string | null;
        expiry?: string | null;
      };
    } | null;
    const tier = body?.data?.tier;
    const active = Boolean(
      body?.data?.active && (tier === "pro" || tier === "enterprise"),
    );
    return {
      active,
      tier: tier === "pro" || tier === "enterprise" ? tier : undefined,
      expiresAt:
        body?.data?.expiresAt ??
        body?.data?.expires_at ??
        body?.data?.expiry ??
        null,
    };
  } catch {
    return { active: false };
  }
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
  fallback?: ReactNode | ((ctx: PaywallGuardFallbackContext) => ReactNode);
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
  const [sessionInfo, setSessionInfo] = useState<WalletSessionInfo>({
    active: false,
  });

  const openPaywall = useCallback(() => setModalOpen(true), []);

  const fetchResource = useCallback(
    async function fetchResourceCallback(
      paymentTxHeader?: string | null,
      retriedAfterSessionCheck = false,
    ) {
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

          if (address && !paymentTxHeader && !retriedAfterSessionCheck) {
            const session = await getActiveWalletSession(address);
            setSessionInfo(session);
            if (session.active) {
              trackPaymentEvent("session_active", {
                endpoint,
                tier: session.tier,
                wallet: address,
                sessionExpiresAt: session.expiresAt ?? null,
              });
              void fetchResourceCallback(null, true);
              return;
            }
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

        if (paymentTxHeader) {
          clearStoredX402Tx(endpoint);
        }
        setPayload(data);
        setX402(null);
        if (address) {
          const session = await getActiveWalletSession(address);
          setSessionInfo(session);
          if (session.active) {
            trackPaymentEvent("session_active", {
              endpoint,
              tier: session.tier,
              wallet: address,
              sessionExpiresAt: session.expiresAt ?? null,
            });
          }
        }
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
    clearStoredX402Tx(endpoint);
    const t = window.setTimeout(() => {
      void fetchResource(null);
    }, 0);
    return () => window.clearTimeout(t);
  }, [endpoint, fetchResource]);

  const onPaymentSuccess = useCallback(
    (paymentHeader: string) => {
      setModalOpen(false);
      void fetchResource(paymentHeader);
    },
    [fetchResource],
  );

  if (status === "error") {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <p className="font-medium">Paywall belum bisa dimuat.</p>
        <p className="mt-1">{errorMsg ?? "Terjadi kesalahan."}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => void fetchResource(null)}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (status === "unlocked") {
    return (
      <div className="space-y-3">
        {sessionInfo.active ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            <Badge variant="outline">Session aktif</Badge>
            <span>
              Tier saat ini: <strong>{sessionInfo.tier ?? requiredTier}</strong>
            </span>
            <span>
              Expiry session:{" "}
              <strong>
                {sessionInfo.expiresAt
                  ? new Date(sessionInfo.expiresAt).toLocaleString()
                  : "tidak tersedia"}
              </strong>
            </span>
          </div>
        ) : null}
        {typeof children === "function" ? children(payload) : children}
      </div>
    );
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
        {status === "gated" ? (
          <div className="rounded-lg border bg-card p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                Tier saat ini: {sessionInfo.tier ?? "free"}
              </Badge>
              <Badge variant="secondary">Butuh: {requiredTier}</Badge>
            </div>
            <p className="mt-2 text-muted-foreground">
              Session aktif: {sessionInfo.active ? "ya" : "tidak"}
            </p>
            <p className="text-muted-foreground">
              Expiry session:{" "}
              {sessionInfo.expiresAt
                ? new Date(sessionInfo.expiresAt).toLocaleString()
                : "—"}
            </p>
            {x402 ? (
              <p className="mt-2 font-medium">
                Biaya akses: {x402.price} {x402.currency} /{" "}
                {x402.duration ?? "session"}
              </p>
            ) : null}
          </div>
        ) : null}
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
