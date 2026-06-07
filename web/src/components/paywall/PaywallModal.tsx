"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isAddress } from "viem";
import { base, baseSepolia } from "viem/chains";
import {
  useAccount,
  useBalance,
  useChainId,
  useSwitchChain,
} from "wagmi";

import { TierComparison } from "@/components/paywall/TierComparison";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useX402Payment } from "@/hooks/useX402Payment";
import { cn } from "@/lib/utils";
import type { AccessTier, X402Details } from "@/types/x402";

const TIER_PRICES: Record<
  "pro" | "enterprise",
  { price: string; amount: string; duration: string; currency: "USDC" }
> = {
  pro: { price: "3.00", amount: "3000000", duration: "24h", currency: "USDC" },
  enterprise: {
    price: "29.00",
    amount: "29000000",
    duration: "7d",
    currency: "USDC",
  },
};

function targetChainId(network: string): number {
  const n = network.toLowerCase();
  if (n === "base" || n === "base-mainnet") return base.id;
  if (
    n === "base-sepolia" ||
    n === "basesepolia" ||
    n === "base_sepolia"
  ) {
    return baseSepolia.id;
  }
  return base.id;
}

function networkLabel(network: string): string {
  const n = network.toLowerCase();
  if (n === "base" || n === "base-mainnet") return "Base Mainnet";
  if (
    n === "base-sepolia" ||
    n === "basesepolia" ||
    n === "base_sepolia"
  ) {
    return "Base Sepolia";
  }
  return network;
}

function BaseLogo({ className }: { className?: string }) {
  return (
    <svg
      className={cn("shrink-0", className)}
      viewBox="0 0 111 111"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M54.921 0C24.8 0 .414 24.546.414 54.921s24.386 54.922 54.507 54.922c30.12 0 54.507-24.546 54.507-54.922S85.041 0 54.921 0z"
        fill="#0052FF"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M58.434 46.428H52.57c-5.528 0-10.01 4.482-10.01 10.01v5.864c0 5.528 4.482 10.01 10.01 10.01h5.864c5.528 0 10.01-4.482 10.01-10.01V56.438c0-5.528-4.482-10.01-10.01-10.01Z"
        fill="#fff"
      />
    </svg>
  );
}

export type PaywallModalProps = {
  isOpen: boolean;
  onClose: () => void;
  x402Data: X402Details;
  requiredTier?: AccessTier;
  onPaymentSuccess: (paymentHeader: string) => void;
};

export function PaywallModal({
  isOpen,
  onClose,
  x402Data,
  requiredTier = "pro",
  onPaymentSuccess,
}: PaywallModalProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: switchPending } = useSwitchChain();

  const [activeTab, setActiveTab] = useState<"pay" | "compare">("pay");
  const [payTier, setPayTier] = useState<"pro" | "enterprise">(
    requiredTier === "enterprise" ? "enterprise" : "pro",
  );

  const {
    isPaying,
    isConfirming,
    txHash: paymentHeader,
    error,
    initiatePayment,
    paymentStatus,
    resetPayment,
  } = useX402Payment();

  const { data: balance } = useBalance({
    address,
    query: { enabled: Boolean(address) },
  });

  const [billingInvalid, setBillingInvalid] = useState(false);
  const successNotified = useRef(false);

  const effectiveX402 = useMemo((): X402Details => {
    const plan = TIER_PRICES[payTier];
    return {
      ...x402Data,
      price: plan.price,
      amount: plan.amount,
      currency: plan.currency,
      tier: payTier,
      duration: plan.duration,
    };
  }, [x402Data, payTier]);

  const expectedChainId = useMemo(
    () => targetChainId(effectiveX402.network),
    [effectiveX402.network],
  );

  const needSwitch = isConnected && chainId !== expectedChainId;

  useEffect(() => {
    if (!isOpen) return;
    successNotified.current = false;
    setActiveTab("pay");
    setPayTier(requiredTier === "enterprise" ? "enterprise" : "pro");
    const t = window.setTimeout(() => {
      setBillingInvalid(false);
      resetPayment();
    }, 0);
    return () => window.clearTimeout(t);
  }, [isOpen, resetPayment, requiredTier]);

  useEffect(() => {
    if (
      paymentStatus === "success" &&
      paymentHeader &&
      !successNotified.current
    ) {
      successNotified.current = true;
      onPaymentSuccess(paymentHeader);
    }
  }, [paymentStatus, paymentHeader, onPaymentSuccess]);

  const balanceLabel = useMemo(() => {
    if (!balance) return "—";
    const v = Number(balance.formatted);
    if (!Number.isFinite(v)) return "—";
    const digits = v >= 1 ? 4 : 6;
    return `${v.toFixed(digits)} ${balance.symbol}`;
  }, [balance]);

  const onPay = useCallback(async () => {
    if (!isAddress(effectiveX402.recipient)) {
      setBillingInvalid(true);
      return;
    }
    setBillingInvalid(false);
    try {
      await initiatePayment(effectiveX402);
    } catch {
      setBillingInvalid(true);
    }
  }, [initiatePayment, effectiveX402]);

  const statusHint = useMemo(() => {
    if (paymentStatus === "confirming" || isConfirming) {
      return "Tanda tangani authorization USDC di wallet…";
    }
    if (paymentStatus === "mining") {
      return "Menyiapkan header X-Payment…";
    }
    if (paymentStatus === "success") {
      return "Authorization berhasil dibuat — membuka akses…";
    }
    if (paymentStatus === "error") {
      return error?.message ?? "Checkout gagal.";
    }
    return null;
  }, [paymentStatus, isConfirming, error]);

  const payPanel = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="uppercase text-[10px]">
          {payTier} session
        </Badge>
        {effectiveX402.duration ? (
          <span className="text-xs text-muted-foreground">
            valid {effectiveX402.duration}
          </span>
        ) : null}
      </div>

      <div className="rounded-xl border bg-muted/30 p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Total
        </p>
        <p className="mt-1 font-mono text-3xl font-semibold tabular-nums tracking-tight">
          {effectiveX402.price}{" "}
          <span className="text-xl text-muted-foreground">
            {effectiveX402.currency}
          </span>
        </p>
        {effectiveX402.amount ? (
          <p className="mt-1 text-xs text-muted-foreground">
            atomic amount: {effectiveX402.amount}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="gap-1.5 py-1 pr-2 pl-1.5">
          <BaseLogo className="size-4" />
          {networkLabel(effectiveX402.network)}
        </Badge>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-xs text-primary underline-offset-4 hover:underline"
            >
              What is X402?
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-left">
            X402 adalah pola HTTP 402 Payment Required: bayar USDC sesuai tier,
            lalu akses semua endpoint dalam tier itu sampai session habis.
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="rounded-lg border px-3 py-2 text-sm">
        <span className="text-muted-foreground">Saldo wallet: </span>
        <span className="font-medium tabular-nums">{balanceLabel}</span>
      </div>

      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
        Checkout memakai USDC x402 authorization. Wallet akan meminta tanda tangan,
        lalu API akan memverifikasi dan settle lewat facilitator.
      </div>

      {billingInvalid ? (
        <p className="text-sm text-destructive">
          Checkout gagal atau metadata payment tidak valid.
        </p>
      ) : null}

      {statusHint ? (
        <p
          className={cn(
            "text-sm",
            paymentStatus === "error"
              ? "text-destructive"
              : "text-muted-foreground",
          )}
        >
          {statusHint}
        </p>
      ) : null}

      {!isConnected ? (
        <div className="flex w-full justify-center [&>button]:w-full">
          <ConnectButton />
        </div>
      ) : needSwitch ? (
        <Button
          type="button"
          className="w-full"
          disabled={switchPending}
          onClick={() => switchChain?.({ chainId: expectedChainId })}
        >
          {switchPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Mengganti jaringan…
            </>
          ) : (
            `Switch ke ${networkLabel(effectiveX402.network)}`
          )}
        </Button>
      ) : (
        <Button
          type="button"
          className="w-full"
          disabled={isPaying || paymentStatus === "success"}
          onClick={onPay}
        >
          {isPaying ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {paymentStatus === "confirming"
                ? "Menunggu tanda tangan…"
                : "Memproses…"}
            </>
          ) : (
            `Pay ${effectiveX402.price} ${effectiveX402.currency} & unlock ${payTier.toUpperCase()}`
          )}
        </Button>
      )}
    </div>
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
        showCloseButton={!isPaying}
      >
        <TooltipProvider delayDuration={200}>
          <DialogHeader>
            <DialogTitle className="text-left text-lg">
              Unlock {requiredTier === "enterprise" ? "Enterprise" : "Pro"} data
            </DialogTitle>
            <DialogDescription>
              Session unlocks all endpoints in your tier — not just this
              request.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "pay" | "compare")}
          >
            <TabsList className="w-full">
              <TabsTrigger value="pay" className="flex-1">
                Pay
              </TabsTrigger>
              <TabsTrigger value="compare" className="flex-1">
                Compare Plans
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pay" className="mt-4">
              {payPanel}
            </TabsContent>
            <TabsContent value="compare" className="mt-4">
              <TierComparison
                requiredTier={requiredTier}
                onSelectTier={(tier) => {
                  setPayTier(tier);
                  setActiveTab("pay");
                }}
              />
            </TabsContent>
          </Tabs>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}
