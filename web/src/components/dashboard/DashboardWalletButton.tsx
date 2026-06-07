"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CheckCircle2, ChevronDown, Clock, Zap } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatExpiresIn, useSession } from "@/hooks/useSession";
import { cn } from "@/lib/utils";

const outlineDark =
  "border-[rgba(30,42,58,0.9)] bg-transparent text-white shadow-none hover:bg-white/5 hover:text-white";

function compactAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function ActiveSessionPill({
  tier,
  expiresLabel,
}: {
  tier: string;
  expiresLabel: string | null | undefined;
}) {
  const isEnterprise = tier === "enterprise";
  const label = isEnterprise ? "ENTERPRISE ACTIVE" : "PRO ACTIVE";

  return (
    <div
      className={cn(
        "hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-[0_0_18px_rgba(0,212,255,0.16)] sm:flex",
        isEnterprise
          ? "border-amber-500/45 bg-amber-500/12 text-amber-300"
          : "border-[#00D4FF]/45 bg-[#00D4FF]/12 text-[#00D4FF]",
      )}
      title={`${label}${expiresLabel ? ` · expires in ${expiresLabel}` : ""}`}
    >
      <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
      <span>{label}</span>
      {expiresLabel ? (
        <>
          <span className="text-current/45">·</span>
          <span className="normal-case tracking-normal">{expiresLabel}</span>
        </>
      ) : null}
    </div>
  );
}

export function DashboardWalletButton() {
  const { session, isPro, isEnterprise, expiresLabel, refresh } = useSession();
  const activeTier = session?.active ? session.tier : null;

  return (
    <ConnectButton.Custom>
      {({
        account,
        openAccountModal,
        openConnectModal,
        mounted,
        authenticationStatus,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const pending = authenticationStatus === "loading";

        const tierBadge = isEnterprise ? (
          <Badge className="h-5 border-amber-500/50 bg-amber-500/15 px-1.5 text-[10px] font-bold text-amber-300 sm:hidden">
            ENT
          </Badge>
        ) : isPro ? (
          <Badge className="h-5 border-[#00D4FF]/50 bg-[#00D4FF]/15 px-1.5 text-[10px] font-bold text-[#00D4FF] sm:hidden">
            PRO
          </Badge>
        ) : null;

        return (
          <div
            className={cn(
              "flex items-center gap-2",
              !ready && "pointer-events-none opacity-0",
            )}
            aria-hidden={!ready}
          >
            {activeTier ? (
              <ActiveSessionPill tier={activeTier} expiresLabel={expiresLabel} />
            ) : null}
            {tierBadge}
            {!account ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn("h-8 px-3 text-xs font-medium", outlineDark)}
                onClick={openConnectModal}
                disabled={pending}
              >
                Connect
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 max-w-[220px] gap-1 px-2.5 font-mono text-xs",
                      outlineDark,
                      session?.active &&
                        "border-[#00D4FF]/45 bg-[#00D4FF]/5 text-[#E6F8FF] hover:bg-[#00D4FF]/10",
                    )}
                  >
                    <span className="truncate">
                      {session?.active ? compactAddress(account.address) : account.displayName}
                    </span>
                    <ChevronDown className="size-3 shrink-0 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-xs text-muted-foreground">Wallet</p>
                    <p className="truncate font-mono text-sm">{account.address}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {session?.active ? (
                    <>
                      <DropdownMenuItem
                        className="flex items-center gap-2 text-xs"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <CheckCircle2
                          className={cn(
                            "size-3.5",
                            isEnterprise ? "text-amber-400" : "text-[#00D4FF]",
                          )}
                        />
                        <span className="font-semibold">
                          {session.tier.toUpperCase()} ACTIVE
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2 text-xs"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Clock className="size-3.5 text-muted-foreground" />
                        <span>
                          Expires in {expiresLabel ?? formatExpiresIn(session.expiresInSeconds)}
                        </span>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem
                      className="text-xs text-muted-foreground"
                      onSelect={(e) => e.preventDefault()}
                    >
                      Free tier — upgrade via paywall
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => void refresh()}
                    className="text-xs"
                  >
                    Refresh session
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center gap-2 text-xs"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Zap className="size-3.5 text-[var(--accent-amber)]" aria-hidden />
                    <span className="text-muted-foreground">
                      X402 wallet sessions active
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/api-docs" className="text-xs">
                      API &amp; x402 docs
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={openAccountModal}>
                    Account settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
