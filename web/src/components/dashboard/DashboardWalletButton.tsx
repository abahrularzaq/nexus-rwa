"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const outlineDark =
  "border-[rgba(30,42,58,0.9)] bg-transparent text-white shadow-none hover:bg-white/5 hover:text-white";

export function DashboardWalletButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        openAccountModal,
        openConnectModal,
        mounted,
        authenticationStatus,
      }) => {
        const ready =
          mounted && authenticationStatus !== "loading";
        const pending = authenticationStatus === "loading";

        return (
          <div
            className={cn(!ready && "pointer-events-none opacity-0")}
            aria-hidden={!ready}
          >
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 max-w-[160px] truncate px-2.5 font-mono text-xs",
                  outlineDark,
                )}
                onClick={openAccountModal}
              >
                {account.displayName}
              </Button>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
