"use client";

import { useCallback, useMemo, useState } from "react";
import { isAddress, type Address, type Hex } from "viem";
import { base, baseSepolia } from "viem/chains";
import { useAccount, useWalletClient } from "wagmi";

import type { X402Details } from "@/types/x402";

export type PaymentStatus =
  | "idle"
  | "confirming"
  | "mining"
  | "success"
  | "error";

function targetChainIdForNetwork(network: string): number {
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

function randomNonce(): Hex {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}` as Hex;
}

function encodePaymentHeader(value: unknown): string {
  return btoa(JSON.stringify(value));
}

export function useX402Payment() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [paymentHeader, setPaymentHeader] = useState<string | null>(null);
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [error, setError] = useState<Error | null>(null);

  const paymentStatus = useMemo(() => status, [status]);
  const isConfirming = status === "confirming";
  const isPaying = status === "confirming" || status === "mining";

  const initiatePayment = useCallback(
    async (x402: X402Details) => {
      setError(null);
      setPaymentHeader(null);

      try {
        if (!address || !walletClient) {
          throw new Error("Wallet belum terhubung.");
        }
        if (!isAddress(x402.recipient)) {
          throw new Error("Alamat penerima payment tidak valid.");
        }
        if (!x402.asset || !isAddress(x402.asset)) {
          throw new Error("Alamat kontrak USDC tidak valid.");
        }
        if (x402.currency.toUpperCase() !== "USDC") {
          throw new Error("Checkout hanya mendukung USDC x402.");
        }
        if (!x402.amount) {
          throw new Error("Atomic amount USDC tidak tersedia dari API.");
        }

        const chainId = targetChainIdForNetwork(x402.network);
        const account = address as Address;
        const token = x402.asset as Address;
        const recipient = x402.recipient as Address;
        const value = BigInt(x402.amount);
        const validAfter = 0n;
        const validBefore = BigInt(Math.floor(Date.now() / 1000) + 300);
        const nonce = randomNonce();

        setStatus("confirming");
        const signature = await walletClient.signTypedData({
          account,
          domain: {
            name: "USD Coin",
            version: "2",
            chainId,
            verifyingContract: token,
          },
          primaryType: "TransferWithAuthorization",
          types: {
            TransferWithAuthorization: [
              { name: "from", type: "address" },
              { name: "to", type: "address" },
              { name: "value", type: "uint256" },
              { name: "validAfter", type: "uint256" },
              { name: "validBefore", type: "uint256" },
              { name: "nonce", type: "bytes32" },
            ],
          },
          message: {
            from: account,
            to: recipient,
            value,
            validAfter,
            validBefore,
            nonce,
          },
        });

        const payload = {
          x402Version: 1,
          scheme: "exact",
          network: x402.network,
          payload: {
            signature,
            authorization: {
              from: account,
              to: recipient,
              value: x402.amount,
              validAfter: validAfter.toString(),
              validBefore: validBefore.toString(),
              nonce,
            },
          },
        };

        setStatus("mining");
        const encoded = encodePaymentHeader(payload);
        setPaymentHeader(encoded);
        setStatus("success");
        return encoded;
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Gagal membuat payment header x402.");
        setError(err);
        setStatus("error");
        throw err;
      }
    },
    [address, walletClient],
  );

  const resetPayment = useCallback(() => {
    setPaymentHeader(null);
    setError(null);
    setStatus("idle");
  }, []);

  return {
    isPaying,
    isConfirming,
    txHash: paymentHeader,
    paymentHeader,
    error,
    initiatePayment,
    paymentStatus,
    resetPayment,
  };
}
